import { shallowEqual } from '@yunke/component';
import type { TranscriptionBlockProps } from '@yunke/core/blocksuite/ai/blocks/transcription-block/model';
import { DebugLogger } from '@yunke/debug';
import { UserFriendlyError } from '@yunke/error';
// import { AiJobStatus } from '@yunke/graphql';
import { Entity, LiveData } from '@toeverything/infra';

import type { DefaultServerService, WorkspaceServerService } from '../../cloud';
import { AuthService } from '../../cloud/services/auth';
import { AudioTranscriptionJobStore } from './audio-transcription-job-store';
import type { TranscriptionResult } from './types';

// The UI status of the transcription job
export type TranscriptionStatus =
  | {
      status: 'waiting-for-job';
    }
  | {
      status: 'started';
    }
  | {
      status: AiJobStatus.pending;
    }
  | {
      status: AiJobStatus.running;
    }
  | {
      status: AiJobStatus.failed;
      error: UserFriendlyError; // <<- this is not visible on UI yet
    }
  | {
      status: AiJobStatus.finished; // ready to be claimed, but may be rejected because of insufficient credits
    }
  | {
      status: AiJobStatus.claimed;
      result: TranscriptionResult;
    };

const logger = new DebugLogger('audio-transcription-job');

// facts on transcription job ownership
// 1. jobid + blobid is unique for a given user
// 2. only the creator can claim the job
// 3. all users can query the claimed job result
// 4. claim a job requires AI credits
export class AudioTranscriptionJob extends Entity<{
  readonly blockProps: TranscriptionBlockProps;
  readonly blobId: string;
  readonly getAudioFiles: () => Promise<File[]>;
}> {
  constructor(
    private readonly workspaceServerService: WorkspaceServerService,
    private readonly defaultServerService: DefaultServerService
  ) {
    super();
    this.disposables.push(() => {
      this.disposed = true;
    });
  }

  disposed = false;

  private readonly _status$ = new LiveData<TranscriptionStatus>({
    status: 'waiting-for-job',
  });

  private readonly store = this.framework.createEntity(
    AudioTranscriptionJobStore,
    {
      blobId: this.props.blobId,
      getAudioFiles: this.props.getAudioFiles,
    }
  );

  status$ = this._status$.distinctUntilChanged(shallowEqual);
  transcribing$ = this.status$.map(status => {
    return (
      status.status === 'started' ||
      status.status === AiJobStatus.pending ||
      status.status === AiJobStatus.running ||
      status.status === AiJobStatus.finished
    );
  });

  error$ = this.status$.map(status => {
    if (status.status === AiJobStatus.failed) {
      return status.error;
    }
    return null;
  });

  // check if we can kick start the transcription job
  readonly preflightCheck = async () => {
    // if the job id is given, check if the job exists
    if (this.props.blockProps.jobId) {
      const existingJob = await this.store.getAudioTranscription(
        this.props.blobId,
        this.props.blockProps.jobId
      );

      if (existingJob?.status === AiJobStatus.claimed) {
        // if job exists, anyone can query it
        return;
      }

      if (
        !existingJob &&
        this.props.blockProps.createdBy &&
        this.props.blockProps.createdBy !== this.currentUserId
      ) {
        return {
          error: 'created-by-others',
          userId: this.props.blockProps.createdBy,
        };
      }
    }

    // if no job id, anyone can start a new job
    return;
  };

  async start() {
    if (this.disposed) {
      logger.debug('任务已释放，无法启动');
      throw new Error('任务已释放');
    }

    this._status$.value = {
      status: 'started',
    };

    try {
      // firstly check if there is a job already
      logger.debug('检查已存在的转录任务', {
        blobId: this.props.blobId,
        jobId: this.props.blockProps.jobId,
      });
      let job: {
        id: string;
        status: AiJobStatus;
      } | null = await this.store.getAudioTranscription(
        this.props.blobId,
        this.props.blockProps.jobId
      );

      if (!job) {
        logger.debug('未找到已存在的任务，提交新的转录任务');
        job = await this.store.submitAudioTranscription();
      } else if (job.status === AiJobStatus.failed) {
        logger.debug('找到已存在的失败任务，正在重试', {
          jobId: job.id,
        });
        job = await this.store.retryAudioTranscription(job.id);
      } else {
        logger.debug('找到已存在的任务', {
          jobId: job.id,
          status: job.status,
        });
      }

      this.props.blockProps.jobId = job.id;
      this.props.blockProps.createdBy = this.currentUserId;

      if (job.status !== AiJobStatus.failed) {
        this._status$.value = {
          status: AiJobStatus.pending,
        };
      } else {
        logger.debug('任务提交失败');
        throw UserFriendlyError.fromAny('提交转录失败');
      }

      await this.untilJobFinishedOrClaimed();
      await this.claim();
    } catch (err) {
      logger.debug('任务提交过程中出错', { error: err });
      this._status$.value = {
        status: AiJobStatus.failed,
        error: UserFriendlyError.fromAny(err),
      };
    }
    return this.status$.value;
  }

  private async untilJobFinishedOrClaimed() {
    while (
      !this.disposed &&
      this.props.blockProps.jobId &&
      this.props.blockProps.createdBy === this.currentUserId
    ) {
      logger.debug('轮询任务状态', {
        jobId: this.props.blockProps.jobId,
      });
      const job = await this.store.getAudioTranscription(
        this.props.blobId,
        this.props.blockProps.jobId
      );

      if (!job || job?.status === 'failed') {
        logger.debug('轮询过程中任务失败', {
          jobId: this.props.blockProps.jobId,
        });
        throw UserFriendlyError.fromAny('转录任务失败');
      }

      if (job?.status === 'finished' || job?.status === 'claimed') {
        logger.debug('任务完成，准备声明', {
          jobId: this.props.blockProps.jobId,
        });
        this._status$.value = {
          status: AiJobStatus.finished,
        };
        return;
      }

      // Add delay between polling attempts
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  async claim() {
    if (this.disposed) {
      logger.debug('任务已释放，无法声明');
      throw new Error('任务已释放');
    }

    logger.debug('尝试声明任务', {
      jobId: this.props.blockProps.jobId,
    });

    if (!this.props.blockProps.jobId) {
      logger.debug('未找到任务ID，无法声明');
      throw new Error('未找到任务ID');
    }

    const claimedJob = await this.store.claimAudioTranscription(
      this.props.blockProps.jobId
    );

    if (claimedJob) {
      logger.debug('成功声明任务', {
        jobId: this.props.blockProps.jobId,
      });
      const result: TranscriptionResult = {
        summary: claimedJob.summary ?? '',
        title: claimedJob.title ?? '',
        actions: claimedJob.actions ?? '',
        segments:
          claimedJob.transcription?.map(segment => ({
            speaker: segment.speaker,
            start: segment.start,
            end: segment.end,
            transcription: segment.transcription,
          })) ?? [],
      };

      this._status$.value = {
        status: AiJobStatus.claimed,
        result,
      };
    } else {
      throw new Error('声明转录结果失败');
    }
  }

  isCreator() {
    return (
      this.props.blockProps.jobId &&
      this.props.blockProps.createdBy &&
      this.props.blockProps.createdBy === this.currentUserId
    );
  }

  private get serverService() {
    return (
      this.workspaceServerService.server || this.defaultServerService.server
    );
  }

  get currentUserId() {
    const authService = this.serverService?.scope.getOptional(AuthService);
    if (!authService) {
      return;
    }
    return authService.session.account$.value?.id;
  }
}

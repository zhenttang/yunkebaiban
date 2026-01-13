//import {
//   claimAudioTranscriptionMutation,
//   getAudioTranscriptionQuery,
//   retryAudioTranscriptionMutation,
//   submitAudioTranscriptionMutation,
//} from '@yunke/graphql';
import { Entity } from '@toeverything/infra';

import type { DefaultServerService, WorkspaceServerService } from '../../cloud';
import { FetchService } from '../../cloud/services/fetch';
import type { WorkspaceService } from '../../workspace';

export class AudioTranscriptionJobStore extends Entity<{
  readonly blobId: string;
  readonly getAudioFiles: () => Promise<File[]>;
}> {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceServerService: WorkspaceServerService,
    private readonly defaultServerService: DefaultServerService
  ) {
    super();
  }

  private get serverService() {
    return (
      this.workspaceServerService.server || this.defaultServerService.server
    );
  }

  private get fetchService() {
    return this.serverService?.scope.get(FetchService);
  }

  private get currentWorkspaceId() {
    return this.workspaceService.workspace.id;
  }

  submitAudioTranscription = async () => {
    const fetchService = this.fetchService;
    if (!fetchService) throw new Error('无可用的网络服务');
    const files = await this.props.getAudioFiles();
    const form = new FormData();
    form.append('workspaceId', this.currentWorkspaceId);
    form.append('blobId', this.props.blobId);
    files.forEach(f => form.append('blobs', f));

    const res = await fetchService.fetch('/api/copilot/audio-transcriptions', {
      method: 'POST',
      body: form,
      timeout: 600_000,
    });
    const data = await res.json();
    if (!data?.id) throw new Error('提交音频转录失败');
    return data;
  };

  retryAudioTranscription = async (jobId: string) => {
    const fetchService = this.fetchService;
    if (!fetchService) throw new Error('无可用的网络服务');
    const res = await fetchService.fetch(
      `/api/copilot/audio-transcriptions/${jobId}/retry`,
      { method: 'POST' }
    );
    if (!res.ok) throw new Error('重试音频转录失败');
    return await res.json();
  };

  getAudioTranscription = async (blobId: string, jobId?: string) => {
    const fetchService = this.fetchService;
    if (!fetchService) throw new Error('无可用的网络服务');
    const currentWorkspaceId = this.currentWorkspaceId;
    if (!currentWorkspaceId) throw new Error('无当前工作区ID');
    const qs = new URLSearchParams({
      workspaceId: currentWorkspaceId,
      blobId,
      ...(jobId ? { jobId } : {}),
    } as any).toString();
    const res = await fetchService.fetch(`/api/copilot/audio-transcriptions?${qs}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data || null;
  };
  claimAudioTranscription = async (jobId: string) => {
    const fetchService = this.fetchService;
    if (!fetchService) throw new Error('无可用的网络服务');
    const res = await fetchService.fetch(
      `/api/copilot/audio-transcriptions/${jobId}/claim`,
      { method: 'POST' }
    );
    if (!res.ok) throw new Error('声明转录结果失败');
    return await res.json();
  };
}

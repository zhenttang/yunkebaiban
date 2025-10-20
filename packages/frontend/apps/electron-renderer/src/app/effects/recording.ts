import type { DocProps } from '@yunke/core/blocksuite/initialization';
import { DocsService } from '@yunke/core/modules/doc';
import { AudioAttachmentService } from '@yunke/core/modules/media/services/audio-attachment';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import { DebugLogger } from '@yunke/debug';
import { apis, events } from '@yunke/electron-api';
import { i18nTime } from '@yunke/i18n';
import track from '@yunke/track';
import type { AttachmentBlockModel } from '@blocksuite/yunke/model';
import type { BlobEngine } from '@blocksuite/yunke/sync';
import type { FrameworkProvider } from '@toeverything/infra';

import { getCurrentWorkspace, isAiEnabled } from './utils';

const logger = new DebugLogger('electron-renderer:recording');

async function saveRecordingBlob(blobEngine: BlobEngine, filepath: string) {
  logger.debug('保存录制', filepath);
  const opusBuffer = await fetch(new URL(filepath, location.origin)).then(res =>
    res.arrayBuffer()
  );
  const blob = new Blob([opusBuffer], {
    type: 'audio/mp4',
  });
  const blobId = await blobEngine.set(blob);
  logger.debug('录制已保存', blobId);
  return { blob, blobId };
}

export function setupRecordingEvents(frameworkProvider: FrameworkProvider) {
  events?.recording.onRecordingStatusChanged(status => {
    (async () => {
      if ((await apis?.ui.isActiveTab()) && status?.status === 'ready') {
        using currentWorkspace = getCurrentWorkspace(frameworkProvider);
        if (!currentWorkspace) {
          // 工作区可能还未就绪，例如在共享工作区视图中
          await apis?.recording.handleBlockCreationFailed(status.id);
          return;
        }
        const { workspace } = currentWorkspace;
        const docsService = workspace.scope.get(DocsService);
        const aiEnabled = isAiEnabled(frameworkProvider);

        const timestamp = i18nTime(status.startTime, {
          absolute: {
            accuracy: 'minute',
            noYear: true,
          },
        });

        const docProps: DocProps = {
          onStoreLoad: (doc, { noteId }) => {
            (async () => {
              if (status.filepath) {
                // 保存blob需要一些时间，所以我们先显示附件
                const { blobId, blob } = await saveRecordingBlob(
                  doc.workspace.blobSync,
                  status.filepath
                );

                // 名称 + 时间戳（可读） + 扩展名
                const attachmentName =
                  (status.appName ?? '系统音频') +
                  ' ' +
                  timestamp +
                  '.opus';

                // 稍后将大小和sourceId添加到附件
                const attachmentId = doc.addBlock(
                  'yunke:attachment',
                  {
                    name: attachmentName,
                    type: 'audio/opus',
                    size: blob.size,
                    sourceId: blobId,
                    embed: true,
                  },
                  noteId
                );

                const model = doc.getBlock(attachmentId)
                  ?.model as AttachmentBlockModel;

                if (!aiEnabled) {
                  return;
                }

                using currentWorkspace = getCurrentWorkspace(frameworkProvider);
                if (!currentWorkspace) {
                  return;
                }
                const { workspace } = currentWorkspace;
                using audioAttachment = workspace.scope
                  .get(AudioAttachmentService)
                  .get(model);
                audioAttachment?.obj
                  .transcribe()
                  .then(() => {
                    track.doc.editor.audioBlock.transcribeRecording({
                      type: 'Meeting record',
                      method: 'success',
                      option: 'Auto transcribing',
                    });
                  })
                  .catch(err => {
                    logger.error('录制转录失败', err);
                  });
              } else {
                throw new Error('未找到附件模型');
              }
            })()
              .then(async () => {
                await apis?.recording.handleBlockCreationSuccess(status.id);
              })
              .catch(error => {
                logger.error('录制转录失败', error);
                return apis?.recording.handleBlockCreationFailed(
                  status.id,
                  error
                );
              })
              .catch(error => {
                console.error('未知错误', error);
              });
          },
        };
        const page = docsService.createDoc({
          docProps,
          title:
            'Recording ' + (status.appName ?? '系统音频') + ' ' + timestamp,
          primaryMode: 'page',
        });
        workspace.scope.get(WorkbenchService).workbench.openDoc(page.id);
      }
    })().catch(console.error);
  });
}

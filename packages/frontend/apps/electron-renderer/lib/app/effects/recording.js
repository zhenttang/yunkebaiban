var __addDisposableResource = (this && this.__addDisposableResource) || function (env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose, inner;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
            if (async) inner = dispose;
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        if (inner) dispose = function() { try { inner.call(this); } catch (e) { return Promise.reject(e); } };
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
var __disposeResources = (this && this.__disposeResources) || (function (SuppressedError) {
    return function (env) {
        function fail(e) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        var r, s = 0;
        function next() {
            while (r = env.stack.pop()) {
                try {
                    if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
                    if (r.dispose) {
                        var result = r.dispose.call(r.value);
                        if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                    }
                    else s |= 1;
                }
                catch (e) {
                    fail(e);
                }
            }
            if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
            if (env.hasError) throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
import { DocsService } from '@yunke/core/modules/doc';
import { AudioAttachmentService } from '@yunke/core/modules/media/services/audio-attachment';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import { DebugLogger } from '@yunke/debug';
import { apis, events } from '@yunke/electron-api';
import { i18nTime } from '@yunke/i18n';
import track from '@yunke/track';
import { getCurrentWorkspace, isAiEnabled } from './utils';
const logger = new DebugLogger('electron-renderer:recording');
async function saveRecordingBlob(blobEngine, filepath) {
    logger.debug('保存录制', filepath);
    const opusBuffer = await fetch(new URL(filepath, location.origin)).then(res => res.arrayBuffer());
    const blob = new Blob([opusBuffer], {
        type: 'audio/mp4',
    });
    const blobId = await blobEngine.set(blob);
    logger.debug('录制已保存', blobId);
    return { blob, blobId };
}
export function setupRecordingEvents(frameworkProvider) {
    events?.recording.onRecordingStatusChanged(status => {
        (async () => {
            if ((await apis?.ui.isActiveTab()) && status?.status === 'ready') {
                const env_1 = { stack: [], error: void 0, hasError: false };
                try {
                    const currentWorkspace = __addDisposableResource(env_1, getCurrentWorkspace(frameworkProvider), false);
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
                    const docProps = {
                        onStoreLoad: (doc, { noteId }) => {
                            (async () => {
                                if (status.filepath) {
                                    const env_2 = { stack: [], error: void 0, hasError: false };
                                    try {
                                        // 保存blob需要一些时间，所以我们先显示附件
                                        const { blobId, blob } = await saveRecordingBlob(doc.workspace.blobSync, status.filepath);
                                        // 名称 + 时间戳（可读） + 扩展名
                                        const attachmentName = (status.appName ?? '系统音频') +
                                            ' ' +
                                            timestamp +
                                            '.opus';
                                        // 稍后将大小和sourceId添加到附件
                                        const attachmentId = doc.addBlock('yunke:attachment', {
                                            name: attachmentName,
                                            type: 'audio/opus',
                                            size: blob.size,
                                            sourceId: blobId,
                                            embed: true,
                                        }, noteId);
                                        const model = doc.getBlock(attachmentId)
                                            ?.model;
                                        if (!aiEnabled) {
                                            return;
                                        }
                                        const currentWorkspace = __addDisposableResource(env_2, getCurrentWorkspace(frameworkProvider), false);
                                        if (!currentWorkspace) {
                                            return;
                                        }
                                        const { workspace } = currentWorkspace;
                                        const audioAttachment = __addDisposableResource(env_2, workspace.scope
                                            .get(AudioAttachmentService)
                                            .get(model), false);
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
                                    }
                                    catch (e_2) {
                                        env_2.error = e_2;
                                        env_2.hasError = true;
                                    }
                                    finally {
                                        __disposeResources(env_2);
                                    }
                                }
                                else {
                                    throw new Error('未找到附件模型');
                                }
                            })()
                                .then(async () => {
                                await apis?.recording.handleBlockCreationSuccess(status.id);
                            })
                                .catch(error => {
                                logger.error('录制转录失败', error);
                                return apis?.recording.handleBlockCreationFailed(status.id, error);
                            })
                                .catch(error => {
                                console.error('未知错误', error);
                            });
                        },
                    };
                    const page = docsService.createDoc({
                        docProps,
                        title: 'Recording ' + (status.appName ?? '系统音频') + ' ' + timestamp,
                        primaryMode: 'page',
                    });
                    workspace.scope.get(WorkbenchService).workbench.openDoc(page.id);
                }
                catch (e_1) {
                    env_1.error = e_1;
                    env_1.hasError = true;
                }
                finally {
                    __disposeResources(env_1);
                }
            }
        })().catch(console.error);
    });
}
//# sourceMappingURL=recording.js.map
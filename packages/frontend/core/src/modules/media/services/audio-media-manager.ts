import { generateUrl } from '@yunke/core/components/hooks/yunke/use-share-url';
import { AttachmentBlockModel } from '@blocksuite/yunke/model';
import {
  attachmentBlockAudioMediaKey,
  type AudioMediaDescriptor,
  type AudioMediaKey,
  type MediaStats,
  ObjectPool,
  parseAudioMediaKey,
  type PlaybackState,
  Service,
} from '@toeverything/infra';
import { clamp } from 'lodash-es';
import { distinctUntilChanged } from 'rxjs';

import { DesktopApiService } from '../../desktop-api';
import type { WorkbenchService } from '../../workbench';
import { AudioMedia } from '../entities/audio-media';
import type { BaseGlobalMediaStateProvider } from '../providers/global-audio-state';

// 媒体服务用于控制附件块中媒体的播放方式
// 同一时间只能播放一个媒体
export class AudioMediaManagerService extends Service {
  private readonly mediaPool = new ObjectPool<AudioMediaKey, AudioMedia>({
    onDelete: media => {
      media.dispose();
      const disposables = this.mediaDisposables.get(media);
      if (disposables) {
        disposables.forEach(dispose => dispose());
        this.mediaDisposables.delete(media);
      }
    },
    onDangling: media => {
      return media.playbackState$.getValue().state !== 'playing';
    },
  });

  private readonly mediaDisposables = new WeakMap<AudioMedia, (() => void)[]>();
  private readonly desktopApi = this.framework.getOptional(DesktopApiService);

  constructor(
    private readonly globalMediaState: BaseGlobalMediaStateProvider,
    private readonly workbench: WorkbenchService
  ) {
    super();
    this.disposables.push(() => {
      this.mediaPool.clear();
    });

    // 订阅全局播放状态变化以管理跨标签页的播放
    this.disposables.push(
      this.observeGlobalPlaybackState(state => {
        if (!state) {
          // 如果全局状态被清除，停止所有媒体
          this.stopAllMedia();
          return;
        }

        const activeStats = this.getGlobalMediaStats();

        if (!activeStats) return;

        if (
          BUILD_CONFIG.isElectron &&
          activeStats.tabId !== this.desktopApi?.appInfo.viewId
        ) {
          // 其他标签页正在播放，暂停当前媒体
          if (state.state === 'playing') {
            this.pauseAllMedia();
          }
          return;
        }

        const mediaRef = this.ensureMediaEntity(activeStats);
        const media = mediaRef.media;

        this.ensureExclusivePlayback();
        media.syncState(state);

        // 返回清理函数
        return () => {
          mediaRef.release();
        };
      })
    );

    window.addEventListener('beforeunload', () => {
      this.stopAllMedia();
    });
  }

  // 辅助方法，用于观察全局播放状态变化
  private observeGlobalPlaybackState(
    callback: (state: PlaybackState | undefined) => (() => void) | undefined
  ): () => void {
    const unsubscribe = this.globalMediaState.playbackState$
      .pipe(distinctUntilChanged((a, b) => a?.updateTime === b?.updateTime))
      .subscribe(state => {
        if (state) {
          return callback(state);
        }
        return;
      });
    return () => {
      unsubscribe.unsubscribe();
    };
  }

  get playbackState$() {
    return this.globalMediaState.playbackState$;
  }

  get playbackStats$() {
    return this.globalMediaState.stats$;
  }

  ensureMediaEntity(input: AttachmentBlockModel | MediaStats) {
    const descriptor = this.normalizeEntityDescriptor(input);

    let rc = this.mediaPool.get(descriptor.key);
    if (!rc) {
      rc = this.mediaPool.put(
        descriptor.key,
        this.framework.createEntity(AudioMedia, {
          blobId: descriptor.blobId,
          metadata: new MediaMetadata({
            title: descriptor.name,
            artist: 'YUNKE',
            // 待办：添加艺术图片，如应用图标？
          }),
        })
      );

      const audioMedia = rc.obj;

      // 设置播放状态同步（广播到全局状态）
      const playbackStateSubscription = audioMedia.playbackState$
        .pipe(distinctUntilChanged((a, b) => a.updateTime === b.updateTime))
        .subscribe(state => {
          if (state.state === 'playing') {
            this.globalMediaState.updateStats({
              ...audioMedia.getStats(),
              tabId: descriptor.tabId,
              key: descriptor.key,
              name: descriptor.name,
              size: descriptor.size,
            });
            this.globalMediaState.updatePlaybackState({
              tabId: descriptor.tabId,
              key: descriptor.key,
              ...audioMedia.getPlaybackStateData(),
            });
          } else if (
            (state.state === 'paused' || state.state === 'stopped') &&
            this.globalMediaState.stats$.value?.key === descriptor.key
          ) {
            // 如果这是活跃媒体且它被暂停/停止，更新全局状态
            this.globalMediaState.updatePlaybackState({
              tabId: descriptor.tabId,
              key: descriptor.key,
              ...audioMedia.getPlaybackStateData(),
            });
            if (state.state === 'stopped') {
              this.globalMediaState.updateStats(null);
              this.globalMediaState.updatePlaybackState(null);
            }
          }
        });

      this.mediaDisposables.set(audioMedia, [
        () => playbackStateSubscription.unsubscribe(),
        () => {
          // 如果audioMedia是活跃媒体，移除它
          if (this.getActiveMediaKey() === descriptor.key) {
            this.globalMediaState.updatePlaybackState(null);
            this.globalMediaState.updateStats(null);
          }
        },
      ]);
    }

    return { media: rc.obj, release: rc.release };
  }

  play() {
    const stats = this.getGlobalMediaStats();
    const currentState = this.getGlobalPlaybackState();
    if (!stats || !currentState) {
      return;
    }
    const seekOffset = currentState.seekOffset;
    this.globalMediaState.updatePlaybackState({
      state: 'playing',
      // 如果seek偏移大于持续时间，则倒回到开始
      seekOffset: seekOffset >= stats.duration ? 0 : seekOffset,
      updateTime: Date.now(),
    });
  }

  pause() {
    const state = this.getGlobalPlaybackState();

    if (!state) {
      return;
    }

    this.globalMediaState.updatePlaybackState({
      state: 'paused',
      seekOffset:
        ((Date.now() - state.updateTime) / 1000) * (state.playbackRate || 1.0) +
        state.seekOffset,
      updateTime: Date.now(),
    });
  }

  stop() {
    this.globalMediaState.updatePlaybackState({
      state: 'stopped',
      seekOffset: 0,
      updateTime: Date.now(),
    });
  }

  seekTo(time: number) {
    const stats = this.getGlobalMediaStats();
    if (!stats) {
      return;
    }
    this.globalMediaState.updatePlaybackState({
      seekOffset: clamp(0, time, stats.duration),
      updateTime: Date.now(),
    });
  }

  /**
   * Sets the playback rate (speed) for the current audio
   * @param rate The playback rate (0.5 to 4.0)
   */
  setPlaybackRate(rate: number) {
    const state = this.getGlobalPlaybackState();
    if (!state) {
      return;
    }

    const clamped = clamp(rate, 0.5, 4.0);
    this.globalMediaState.updatePlaybackState({
      ...state,
      playbackRate: clamped,
      updateTime: Date.now(),
    });
  }

  focusAudioMedia(key: AudioMediaKey, tabId: string | null) {
    const mediaProps = parseAudioMediaKey(key);
    if (tabId === this.currentTabId) {
      this.workbench.workbench.openDoc({
        docId: mediaProps.docId,
        mode: 'page',
        blockIds: [mediaProps.blockId],
      });
    } else if (BUILD_CONFIG.isElectron && tabId) {
      const url = generateUrl({
        baseUrl: window.location.origin,
        workspaceId: mediaProps.workspaceId,
        pageId: mediaProps.docId,
        blockIds: [mediaProps.blockId],
      });

      this.desktopApi?.showTab(tabId, url).catch(console.error);
    }
  }

  private getActiveMediaKey(): AudioMediaKey | null {
    const stats = this.getGlobalMediaStats();
    return stats?.key || null;
  }

  private getGlobalPlaybackState(): PlaybackState | null {
    const provider = this.globalMediaState;
    return provider.playbackState$.value || null;
  }

  private getGlobalMediaStats(): MediaStats | null {
    const provider = this.globalMediaState;
    return provider.stats$.value || null;
  }

  // 确保同一时间只播放一个媒体
  private ensureExclusivePlayback() {
    const activeKey = this.getActiveMediaKey();
    if (activeKey) {
      this.pauseAllMedia(activeKey);
    }
  }

  get currentTabId() {
    return this.desktopApi?.appInfo.viewId || 'web';
  }

  private normalizeEntityDescriptor(
    input: AttachmentBlockModel | MediaStats
  ): AudioMediaDescriptor {
    if (input instanceof AttachmentBlockModel) {
      if (!input.props.sourceId) {
        throw new Error('无效媒体');
      }
      return {
        key: attachmentBlockAudioMediaKey({
          blobId: input.props.sourceId,
          blockId: input.id,
          docId: input.store.id,
          workspaceId: input.store.rootDoc.guid,
        }),
        name: input.props.name,
        size: input.props.size,
        blobId: input.props.sourceId,
        // 当输入为AttachmentBlockModel时，它始终在当前标签页
        tabId: this.currentTabId,
      };
    } else {
      const { blobId } = parseAudioMediaKey(input.key);
      return {
        key: input.key,
        name: input.name,
        size: input.size,
        blobId,
        tabId: input.tabId,
      };
    }
  }

  /**
   * Pause all playing media except the one with the given ID
   * IN THE CURRENT TAB
   */
  private pauseAllMedia(exceptId?: AudioMediaKey) {
    // Iterate through all objects in the pool
    for (const [id, ref] of this.mediaPool.objects) {
      if (
        id !== exceptId &&
        ref.obj.playbackState$.getValue().state === 'playing'
      ) {
        ref.obj.pause();
      }
    }
  }

  private stopAllMedia(exceptId?: AudioMediaKey) {
    // Iterate through all objects in the pool
    for (const [id, ref] of this.mediaPool.objects) {
      if (
        id !== exceptId &&
        ref.obj.playbackState$.getValue().state === 'playing'
      ) {
        ref.obj.stop();
      }
    }

    // The media entity may not being created yet
    // so we need to change the state
    const globalState = this.getGlobalPlaybackState();
    if (
      globalState &&
      globalState.key !== exceptId &&
      globalState.tabId === this.currentTabId
    ) {
      this.globalMediaState.updatePlaybackState(null);
      this.globalMediaState.updateStats(null);
    }
  }
}

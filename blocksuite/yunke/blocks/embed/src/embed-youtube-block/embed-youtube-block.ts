import { LoadingIcon, OpenIcon } from '@blocksuite/yunke-components/icons';
import type {
  EmbedYoutubeModel,
  EmbedYoutubeStyles,
} from '@blocksuite/yunke-model';
import { ImageProxyService } from '@blocksuite/yunke-shared/adapters';
import { ThemeProvider } from '@blocksuite/yunke-shared/services';
import { BlockSelection } from '@blocksuite/std';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EmbedBlockComponent } from '../common/embed-block-element.js';
import { getEmbedCardIcons } from '../common/utils.js';
import { youtubeUrlRegex } from './embed-youtube-model.js';
import type { EmbedYoutubeBlockService } from './embed-youtube-service.js';
import { styles, YoutubeIcon } from './styles.js';
import { refreshEmbedYoutubeUrlData } from './utils.js';

export class EmbedYoutubeBlockComponent extends EmbedBlockComponent<
  EmbedYoutubeModel,
  EmbedYoutubeBlockService
> {
  static override styles = styles;

  override _cardStyle: (typeof EmbedYoutubeStyles)[number] = 'video';

  open = () => {
    let link = this.model.props.url;
    if (!link.match(/^[a-zA-Z]+:\/\//)) {
      link = 'https://' + link;
    }
    window.open(link, '_blank');
  };

  refreshData = () => {
    refreshEmbedYoutubeUrlData(this, this.fetchAbortController.signal).catch(
      console.error
    );
  };

  private _handleDoubleClick(event: MouseEvent) {
    event.stopPropagation();
    this.open();
  }

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create(BlockSelection, {
      blockId: this.blockId,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  protected _handleClick(event: MouseEvent) {
    event.stopPropagation();
    this._selectBlock();
  }

  override connectedCallback() {
    super.connectedCallback();
    this._cardStyle = this.model.props.style;

    if (!this.model.props.videoId) {
      this.store.withoutTransact(() => {
        const url = this.model.props.url;
        const urlMatch = url.match(youtubeUrlRegex);
        if (urlMatch) {
          const [, videoId] = urlMatch;
          this.store.updateBlock(this.model, {
            videoId,
          });
        }
      });
    }

    if (!this.model.props.description && !this.model.props.title) {
      this.store.withoutTransact(() => {
        this.refreshData();
      });
    }

    this.disposables.add(
      this.model.propsUpdated.subscribe(({ key }) => {
        this.requestUpdate();
        if (key === 'url') {
          this.refreshData();
        }
      })
    );

    matchMedia('print').addEventListener('change', () => {
      this._showImage = matchMedia('print').matches;
    });
  }

  // 离线占位符：检测网络状态
  private _isOffline() {
    return typeof navigator !== 'undefined' && !navigator.onLine;
  }

  override renderBlock() {
    // 🔧 离线占位符：离线时显示友好提示，不渲染 iframe
    if (this._isOffline()) {
      return this.renderEmbed(
        () => html`
          <div
            class=${classMap({
              'yunke-embed-youtube-block': true,
              selected: this.selected$.value,
            })}
            @click=${this._handleClick}
          >
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;background:var(--yunke-background-secondary-color);border-radius:8px;min-height:200px;gap:12px;">
              <div style="font-size:36px;">📺</div>
              <div style="font-size:14px;font-weight:600;color:var(--yunke-text-primary-color);">
                ${this.model.props.title || 'YouTube 视频'}
              </div>
              <div style="font-size:12px;color:var(--yunke-text-secondary-color);text-align:center;">
                需要网络连接才能播放视频
              </div>
              <div style="font-size:11px;color:var(--yunke-text-disable-color);word-break:break-all;max-width:300px;text-align:center;">
                ${this.model.props.url}
              </div>
            </div>
          </div>
        `
      );
    }

    const {
      image,
      title = 'YouTube',
      description,
      creator,
      creatorImage,
      videoId,
    } = this.model.props;

    const loading = this.loading;
    const theme = this.std.get(ThemeProvider).theme;
    const imageProxyService = this.store.get(ImageProxyService);
    const { EmbedCardBannerIcon } = getEmbedCardIcons(theme);
    const titleIcon = loading ? LoadingIcon() : YoutubeIcon;
    const titleText = loading ? '加载中...' : title;
    const descriptionText = loading ? null : description;
    const bannerImage =
      !loading && image
        ? html`<img src=${imageProxyService.buildUrl(image)} alt="banner" crossorigin="anonymous" />`
        : EmbedCardBannerIcon;

    const creatorImageEl =
      !loading && creatorImage
        ? html`<img
            src=${imageProxyService.buildUrl(creatorImage)}
            alt="creator"
            crossorigin="anonymous"
          />`
        : nothing;

    return this.renderEmbed(
      () => html`
        <div
          class=${classMap({
            'yunke-embed-youtube-block': true,
            loading,
            selected: this.selected$.value,
          })}
          style=${styleMap({
            transformOrigin: '0 0',
          })}
          @click=${this._handleClick}
          @dblclick=${this._handleDoubleClick}
        >
          <div class="yunke-embed-youtube-video">
            ${videoId
              ? html`
                  <div class="yunke-embed-youtube-video-iframe-container">
                    <iframe
                      id="ytplayer"
                      type="text/html"
                      src=${`https://www.youtube.com/embed/${videoId}`}
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowfullscreen
                      loading="lazy"
                      credentialless
                    ></iframe>

                    <!-- overlay to prevent the iframe from capturing pointer events -->
                    <div
                      class=${classMap({
                        'yunke-embed-youtube-video-iframe-overlay': true,
                        hide: !this.showOverlay$.value,
                      })}
                    ></div>
                    <img
                      class=${classMap({
                        'yunke-embed-youtube-video-iframe-overlay': true,
                        'media-print': true,
                        hide: !this._showImage,
                      })}
                      src=${`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                      alt="YouTube Video"
                      loading="lazy"
                      crossorigin="anonymous"
                    />
                  </div>
                `
              : bannerImage}
          </div>
          <div class="yunke-embed-youtube-content">
            <div class="yunke-embed-youtube-content-header">
              <div class="yunke-embed-youtube-content-title-icon">
                ${titleIcon}
              </div>

              <div class="yunke-embed-youtube-content-title-text">
                ${titleText}
              </div>

              <div class="yunke-embed-youtube-content-creator-image">
                ${creatorImageEl}
              </div>

              <div class="yunke-embed-youtube-content-creator-text">
                ${creator}
              </div>
            </div>

            ${loading
              ? html`<div
                  class="yunke-embed-youtube-content-description"
                ></div>`
              : descriptionText
                ? html`<div class="yunke-embed-youtube-content-description">
                    ${descriptionText}
                  </div>`
                : nothing}

            <div class="yunke-embed-youtube-content-url" @click=${this.open}>
              <span>www.youtube.com</span>

              <div class="yunke-embed-youtube-content-url-icon">
                ${OpenIcon}
              </div>
            </div>
          </div>
        </div>
      `
    );
  }

  @state()
  private accessor _showImage = false;

  @property({ attribute: false })
  accessor loading = false;
}

import { EmbedFigmaBlockComponent } from './embed-figma-block';
import { EmbedEdgelessBlockComponent } from './embed-figma-block/embed-edgeless-figma-block';
import { EmbedGithubBlockComponent } from './embed-github-block';
import { EmbedEdgelessGithubBlockComponent } from './embed-github-block/embed-edgeless-github-block';
import { EmbedHtmlBlockComponent } from './embed-html-block';
import { EmbedHtmlFullscreenToolbar } from './embed-html-block/components/fullscreen-toolbar';
import { EmbedEdgelessHtmlBlockComponent } from './embed-html-block/embed-edgeless-html-block';
import { EmbedIframeErrorCard } from './embed-iframe-block/components/embed-iframe-error-card';
import { EmbedIframeIdleCard } from './embed-iframe-block/components/embed-iframe-idle-card';
import { EmbedIframeLinkEditPopup } from './embed-iframe-block/components/embed-iframe-link-edit-popup';
import { EmbedIframeLinkInputPopup } from './embed-iframe-block/components/embed-iframe-link-input-popup';
import { EmbedIframeLoadingCard } from './embed-iframe-block/components/embed-iframe-loading-card';
import { EmbedEdgelessIframeBlockComponent } from './embed-iframe-block/embed-edgeless-iframe-block';
import { EmbedIframeBlockComponent } from './embed-iframe-block/embed-iframe-block';
import { EmbedLoomBlockComponent } from './embed-loom-block';
import { EmbedEdgelessLoomBlockComponent } from './embed-loom-block/embed-edgeless-loom-bock';
import { EmbedYoutubeBlockComponent } from './embed-youtube-block';
import { EmbedEdgelessYoutubeBlockComponent } from './embed-youtube-block/embed-edgeless-youtube-block';

export function effects() {
  customElements.define(
    'yunke-embed-edgeless-figma-block',
    EmbedEdgelessBlockComponent
  );
  customElements.define('yunke-embed-figma-block', EmbedFigmaBlockComponent);

  customElements.define('yunke-embed-html-block', EmbedHtmlBlockComponent);
  customElements.define(
    'yunke-embed-edgeless-html-block',
    EmbedEdgelessHtmlBlockComponent
  );

  customElements.define(
    'embed-html-fullscreen-toolbar',
    EmbedHtmlFullscreenToolbar
  );
  customElements.define(
    'yunke-embed-edgeless-github-block',
    EmbedEdgelessGithubBlockComponent
  );
  customElements.define('yunke-embed-github-block', EmbedGithubBlockComponent);

  customElements.define(
    'yunke-embed-edgeless-youtube-block',
    EmbedEdgelessYoutubeBlockComponent
  );
  customElements.define(
    'yunke-embed-youtube-block',
    EmbedYoutubeBlockComponent
  );

  customElements.define(
    'yunke-embed-edgeless-loom-block',
    EmbedEdgelessLoomBlockComponent
  );
  customElements.define('yunke-embed-loom-block', EmbedLoomBlockComponent);

  customElements.define(
    'yunke-embed-edgeless-iframe-block',
    EmbedEdgelessIframeBlockComponent
  );
  customElements.define('yunke-embed-iframe-block', EmbedIframeBlockComponent);
  customElements.define(
    'embed-iframe-link-input-popup',
    EmbedIframeLinkInputPopup
  );
  customElements.define('embed-iframe-loading-card', EmbedIframeLoadingCard);
  customElements.define('embed-iframe-error-card', EmbedIframeErrorCard);
  customElements.define('embed-iframe-idle-card', EmbedIframeIdleCard);
  customElements.define(
    'embed-iframe-link-edit-popup',
    EmbedIframeLinkEditPopup
  );
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-embed-figma-block': EmbedFigmaBlockComponent;
    'yunke-embed-edgeless-figma-block': EmbedEdgelessBlockComponent;
    'yunke-embed-github-block': EmbedGithubBlockComponent;
    'yunke-embed-edgeless-github-block': EmbedEdgelessGithubBlockComponent;
    'yunke-embed-html-block': EmbedHtmlBlockComponent;
    'yunke-embed-edgeless-html-block': EmbedEdgelessHtmlBlockComponent;
    'embed-html-fullscreen-toolbar': EmbedHtmlFullscreenToolbar;
    'yunke-embed-edgeless-loom-block': EmbedEdgelessLoomBlockComponent;
    'yunke-embed-loom-block': EmbedLoomBlockComponent;
    'yunke-embed-youtube-block': EmbedYoutubeBlockComponent;
    'yunke-embed-edgeless-youtube-block': EmbedEdgelessYoutubeBlockComponent;
    'yunke-embed-iframe-block': EmbedIframeBlockComponent;
    'embed-iframe-link-input-popup': EmbedIframeLinkInputPopup;
    'embed-iframe-loading-card': EmbedIframeLoadingCard;
    'embed-iframe-error-card': EmbedIframeErrorCard;
    'embed-iframe-idle-card': EmbedIframeIdleCard;
    'embed-iframe-link-edit-popup': EmbedIframeLinkEditPopup;
  }
}

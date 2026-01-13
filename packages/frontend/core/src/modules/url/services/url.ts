import { Service } from '@toeverything/infra';

import type { ClientSchemeProvider } from '../providers/client-schema';
import type { PopupWindowProvider } from '../providers/popup-window';

export class UrlService extends Service {
  constructor(
    // those providers are optional, because they are not always available in some environments
    private readonly popupWindowProvider?: PopupWindowProvider,
    private readonly clientSchemeProvider?: ClientSchemeProvider
  ) {
    super();
  }

  getClientScheme() {
    return this.clientSchemeProvider?.getClientScheme();
  }

  /**
   * open a popup window, provide different implementations in different environments.
   * e.g. in electron, use system default browser to open a popup window.
   *
   * !IMPORTANT: browser will block popup windows in async callbacks, so you should use openExternal instead.
   *
   * @param url only full url with http/https protocol is supported
   */
  openPopupWindow(url: string) {
    if (!url.startsWith('http')) {
      throw new Error('仅支持完整的http/https协议URL');
    }
    this.popupWindowProvider?.open(url);
  }

  /**
   * Opens an external URL with different implementations based on the environment.
   * Unlike openPopupWindow, openExternal opens the URL in the current browser tab,
   * making it more suitable for cases where popup windows might be blocked by browsers.
   *
   * @param url only full url with http/https protocol is supported
   */
  openExternal(url: string) {
    if (BUILD_CONFIG.isWeb || BUILD_CONFIG.isMobileWeb) {
      location.href = url;
    } else {
      this.popupWindowProvider?.open(url);
    }
  }

  /**
   * Get the download page URL (site-local by default).
   * Optionally append a channel query if provided.
   */
  getDownloadPageUrl(opts?: { channel?: string }) {
    let url = BUILD_CONFIG.downloadUrl || '/download';
    if (opts?.channel) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}channel=${opts.channel}`;
    }
    return url;
  }

  openDownloadPage(opts?: { channel?: string }) {
    const url = this.getDownloadPageUrl(opts);
    if (/^https?:/i.test(url)) {
      this.openExternal(url);
    } else {
      location.href = url;
    }
  }
}

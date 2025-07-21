import { type Clipboard as BlockStdScopeClipboard } from '@blocksuite/affine/std';

import { fakeCopyAction } from './fake';

const clipboardWriteIsSupported =
  'clipboard' in navigator && 'write' in navigator.clipboard;

const clipboardWriteTextIsSupported =
  'clipboard' in navigator && 'writeText' in navigator.clipboard;

export const copyTextToClipboard = async (text: string) => {
  // 1. 首先尝试使用异步 API，在 HTTPS 域上工作
  if (clipboardWriteTextIsSupported) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error(err);
    }
  }

  // 2. 尝试使用 `document.execCommand`
  // https://github.com/zenorocha/clipboard.js/blob/master/src/actions/copy.js
  return fakeCopyAction(text);
};

export const copyLinkToBlockStdScopeClipboard = async (
  text: string,
  clipboard?: BlockStdScopeClipboard
) => {
  let success = false;

  if (!clipboard) return success;

  if (clipboardWriteIsSupported) {
    try {
      await clipboard.writeToClipboard(items => {
        items['text/plain'] = text;
        // 包装为一个链接
        items['text/html'] = `<a href="${text}">${text}</a>`;
        return items;
      });
      success = true;
    } catch (error) {
      console.error(error);
    }
  }

  if (!success) {
    success = await copyTextToClipboard(text);
  }

  return success;
};

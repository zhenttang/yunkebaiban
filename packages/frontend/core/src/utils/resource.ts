import { fileTypeFromBuffer } from 'file-type';

export async function resourceUrlToBlob(
  url: string
): Promise<Blob | undefined> {
  const buffer = await fetch(url).then(response => response.arrayBuffer());

  if (!buffer) {
    console.warn('无法获取blob');
    return;
  }
  try {
    const type = await fileTypeFromBuffer(buffer);
    if (!type) {
      return;
    }
    const blob = new Blob([buffer], { type: type.mime });
    return blob;
  } catch (error) {
    console.error('将资源转换为blob时出错', error);
  }
  return;
}

export async function downloadBlob(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.append(anchor);

  const cleanup = () => {
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
  };

  return new Promise<void>((resolve, reject) => {
    try {
      let cleaned = false;
      const resolveOnce = () => {
        if (cleaned) {
          return;
        }
        cleaned = true;
        cleanup();
        resolve();
      };

      anchor.addEventListener(
        'click',
        () => {
          window.setTimeout(resolveOnce, 1000);
        },
        { once: true }
      );

      anchor.click();

      // 兜底：3 秒后仍未触发 click 监听则强制回收
      window.setTimeout(resolveOnce, 3000);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

export async function downloadResourceWithUrl(url: string, filename: string) {
  // 给定的输入URL可能没有正确的MIME类型
  const blob = await resourceUrlToBlob(url);
  if (!blob) return;

  await downloadBlob(blob, filename);
}

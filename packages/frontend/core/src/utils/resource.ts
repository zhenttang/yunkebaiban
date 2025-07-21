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
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

export async function downloadResourceWithUrl(url: string, filename: string) {
  // 给定的输入URL可能没有正确的MIME类型
  const blob = await resourceUrlToBlob(url);
  if (!blob) return;

  await downloadBlob(blob, filename);
}

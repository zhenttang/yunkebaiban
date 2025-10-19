import type { AttachmentBlockModel } from '@blocksuite/yunke/model';

const imageExts = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'avif',
  'tiff',
  'bmp',
]);

const audioExts = new Set(['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'opus']);

const videoExts = new Set([
  'mp4',
  'webm',
  'avi',
  'mov',
  'mkv',
  'mpeg',
  'ogv',
  '3gp',
]);

export function getAttachmentType(model: AttachmentBlockModel) {
  const type = model.props.type;

  // 首先检查MIME类型
  if (type.startsWith('image/')) {
    return 'image';
  }

  if (type.startsWith('audio/')) {
    return 'audio';
  }

  if (type.startsWith('video/')) {
    return 'video';
  }

  if (type === 'application/pdf') {
    return 'pdf';
  }

  // 如果MIME类型不匹配，检查文件扩展名
  const ext = model.props.name.split('.').pop()?.toLowerCase() ?? '';

  if (imageExts.has(ext)) {
    return 'image';
  }

  if (audioExts.has(ext)) {
    return 'audio';
  }

  if (videoExts.has(ext)) {
    return 'video';
  }

  if (ext === 'pdf') {
    return 'pdf';
  }

  return '未知';
}

export async function downloadBlobToBuffer(model: AttachmentBlockModel) {
  const sourceId = model.props.sourceId$.peek();
  if (!sourceId) {
    throw new Error('附件未找到');
  }

  const blob = await model.store.blobSync.get(sourceId);
  if (!blob) {
    throw new Error('附件未找到');
  }

  return await blob.arrayBuffer();
}

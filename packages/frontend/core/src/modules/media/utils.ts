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

const builtinTextExts = new Set(['txt', 'md', 'eml', 'log', 'json', 'csv']);

async function isTextExtension(ext: string): Promise<boolean> {
  if (builtinTextExts.has(ext)) {
    return true;
  }

  try {
    const { bundledLanguagesInfo } = await import('shiki');
    if (
      bundledLanguagesInfo.some(info =>
        [info.id, info.name, ...(info.aliases ?? [])].includes(ext)
      )
    ) {
      return true;
    }
  } catch {
    // ignore
  }

  // Default to treating unknown extensions as text for now
  return true;
}

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

  if (type.startsWith('text/') || type.startsWith('message/')) {
    return 'text';
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

  // Check text extensions synchronously first
  if (builtinTextExts.has(ext)) {
    return 'text';
  }

  // For other extensions, we'll check asynchronously when needed
  // Return 'text' for common code/text file extensions
  const codeExts = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'scss', 'less', 'html', 'xml', 'yaml', 'yml', 'sh', 'bash', 'zsh', 'fish', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'scala', 'clj', 'hs', 'ml', 'elm', 'ex', 'exs', 'vue', 'svelte', 'dart', 'r', 'm', 'mm', 'pl', 'pm', 'lua', 'tcl', 'sql', 'graphql', 'gql', 'proto', 'toml', 'ini', 'conf', 'env', 'dockerfile', 'makefile', 'cmake', 'gradle', 'maven', 'pom', 'build', 'ninja', 'scons', 'rake', 'gemspec', 'podspec', 'lock', 'pac', 'rpc', 'idl', 'thrift', 'avdl', 'avpr', 'avsc', 'jsonld', 'json-ld', 'json5', 'jsonc', 'hjson', 'edn', 'cljc', 'cljs', 'cljx', 'cljr', 'cljs.hl', 'edn.hl', 'fs', 'fsi', 'fsx', 'fsscript', 'f90', 'f95', 'f03', 'f08', 'f18', 'for', 'f77', 'f', 'for', 'fortran', 'fpp', 'mod', 'smod', 'F', 'F90', 'F95', 'F03', 'F08', 'F18', 'FOR', 'F77', 'FPP', 'MOD', 'SMOD'];
  if (codeExts.includes(ext)) {
    return 'text';
  }

  return 'unknown';
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

export class OverSizeError extends Error {
  constructor(limit: string | null) {
    const formattedLimit = limit ? `${limit} ` : '';
    super(`文件大小超过${formattedLimit}限制。`);
  }
}

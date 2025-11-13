export class StorageQuotaExceededError extends Error {
  constructor(message = 'IndexedDB storage quota exceeded') {
    super(message);
    this.name = 'StorageQuotaExceededError';
  }
}

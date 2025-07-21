export class OverCapacityError extends Error {
  constructor(public originError?: any) {
    super('存储超出容量。');
  }
}

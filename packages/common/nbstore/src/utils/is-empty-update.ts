/**
 * Tell a binary is empty yjs binary or not.
 *
 * NOTE:
 *   `[0, 0]` is empty yjs update binary
 *   `[0]` is empty yjs state vector binary
 */
export function isEmptyUpdate(binary: Uint8Array) {
  const isEmpty = (
    binary.byteLength === 0 ||
    (binary.byteLength === 2 && binary[0] === 0 && binary[1] === 0)
  );
  
  console.log('🔍 [isEmptyUpdate] Y.js二进制数据检查:', {
    byteLength: binary.byteLength,
    isEmpty: isEmpty,
    firstBytes: Array.from(binary.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' '),
    isEmptyPattern: binary.byteLength === 2 && binary[0] === 0 && binary[1] === 0
  });
  
  return isEmpty;
}

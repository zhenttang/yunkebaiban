export * from './adapter';
export * from './extension';
export * from './model';
export * from './reactive';
export * from './schema';
export * from './transformer';
export { type IdGenerator, nanoid, uuidv4 } from './utils/id-generator';
export * from './yjs';

const env = (
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
        ? global
        : {}
) as Record<string, boolean>;
const importIdentifier = '__ $BLOCKSUITE_STORE$ __';

if (env[importIdentifier] === true) {
  // https://github.com/yjs/yjs/issues/438
  console.error(
    '@blocksuite/store 已被导入。这会破坏构造函数检查并导致问题！'
  );
}
env[importIdentifier] = true;

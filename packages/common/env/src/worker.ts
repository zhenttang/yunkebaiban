export function getWorkerUrl(name: string) {
  return (
    // 注意：worker 不能使用 publicPath，因为它必须遵守同源策略
    (environment.subPath || '/') +
    'js/' +
    `${name}-${BUILD_CONFIG.appVersion}.worker.js`
  );
}

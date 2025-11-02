import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import type { CapacitorConfig } from '@capacitor/cli';

const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, './package.json'), 'utf-8')
);

interface AppConfig {
  yunkeVersion: string;
}

const config: CapacitorConfig & AppConfig = {
  appId: 'app.yunke.pro',
  appName: '云科',
  webDir: 'dist',
  yunkeVersion: packageJson.version,
  android: {
    path: 'App',
    buildOptions: {
      keystorePath: join(__dirname, 'yunke.keystore'),
      keystorePassword: process.env.YUNKE_ANDROID_KEYSTORE_PASSWORD,
      keystoreAlias: 'key0',
      keystoreAliasPassword: process.env.YUNKE_ANDROID_KEYSTORE_ALIAS_PASSWORD,
      releaseType: 'APK',
    },
    adjustMarginsForEdgeToEdge: 'force',
    // 🔧 WebView存储配置 - 支持IndexedDB
    webContentsDebuggingEnabled: true,  // 启用WebView调试
    allowMixedContent: true,            // 允许混合内容
    // 🔧 修复：禁用 captureInput 以支持中文输入法的 composition 事件
    // captureInput 使用替代的 InputConnection，会干扰 IME 的正常工作
    captureInput: false,                // 捕获输入（改为 false）
  },
  server: {
    cleartext: true,
    allowMixedContent: true,
    hostname: 'localhost',
    androidScheme: 'http',
    // 🔧 强制使用HTTP/1.1，避免HTTP/2相关问题
    iosScheme: 'http',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true, // 启用 CapacitorHttp，绕过 WebView 限制
    },
    CapacitorCookies: {
      enabled: false,
    },
  },
};

if (process.env.CAP_SERVER_URL) {
  Object.assign(config, {
    server: {
      url: process.env.CAP_SERVER_URL,
    },
  });
}

export default config;

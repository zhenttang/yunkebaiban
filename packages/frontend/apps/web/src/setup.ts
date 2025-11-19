import '@yunke/core/bootstrap/browser';
import '@yunke/core/bootstrap/cleanup';
import '@yunke/component/theme';
import React from 'react';
import { configureSocketAuthMethod } from '@yunke/nbstore/cloud';
import '../../../core/src/modules/heading-enhancements/register';

// 为 Web 版本配置 Socket.IO 认证，使用本地存储的 JWT token
configureSocketAuthMethod((_endpoint, cb) => {
  try {
    if (typeof window === 'undefined') {
      cb({});
      return;
    }

    const token =
      window.localStorage.getItem('yunke-admin-token') ?? null;

    if (token) {
      cb({ token });
    } else {
      cb({});
    }
  } catch (error) {
    console.error('Failed to read auth token for Socket.IO:', error);
    cb({});
  }
});

// 确保 React 全局可用（某些第三方库可能需要，如 react-virtuoso）
if (
  typeof window !== 'undefined' &&
  typeof (window as any).React === 'undefined'
) {
  (window as any).React = React;
}

import '@yunke/core/bootstrap/browser';
import '@yunke/core/bootstrap/cleanup';
import '@yunke/component/theme';
import React from 'react';
import '../../../core/src/modules/heading-enhancements/register';

// 确保 React 全局可用（某些第三方库可能需要，如 react-virtuoso）
if (typeof window !== 'undefined' && typeof (window as any).React === 'undefined') {
  (window as any).React = React;
}

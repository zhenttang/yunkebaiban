import type { ToastOptions } from '@affine/component';
import { toast as basicToast } from '@affine/component';

export const toast = (message: string, options?: ToastOptions) => {
  const modal = document.querySelector<HTMLDivElement>('[role=presentation]');
  if (modal && !(modal instanceof HTMLDivElement)) {
    throw new Error('模态框应该是div元素');
  }
  return basicToast(message, {
    portal: modal || document.body,
    ...options,
  });
};

declare global {
  // 全局事件
  interface WindowEventMap {
    'affine-toast:emit': CustomEvent<{
      message: string;
    }>;
  }
}

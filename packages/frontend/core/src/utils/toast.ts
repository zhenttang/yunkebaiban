import type { ToastOptions } from '@yunke/component';
import { toast as basicToast } from '@yunke/component';

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
    'yunke-toast:emit': CustomEvent<{
      message: string;
    }>;
  }
}

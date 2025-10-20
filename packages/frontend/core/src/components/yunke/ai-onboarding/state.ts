import { LiveData } from '@toeverything/infra';

// 在通用对话框和画板对话框之间共享状态，
// 以便在通用对话框打开时避免显示画板对话框
export const showAIOnboardingGeneral$ = new LiveData(false);

// 避免多次通知
export const edgelessNotifyId$ = new LiveData<string | number | undefined>(
  undefined
);

export const localNotifyId$ = new LiveData<string | number | undefined>(
  undefined
);

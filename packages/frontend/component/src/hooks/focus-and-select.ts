import { useLayoutEffect, useRef } from 'react';

export const useAutoFocus = <T extends HTMLElement = HTMLElement>(
  autoFocus?: boolean
) => {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    if (ref.current && autoFocus) {
      // 避免点击可聚焦元素（如菜单项）时，
      // 输入框不会获得焦点
      setTimeout(() => {
        ref.current?.focus();
      }, 0);
    }
  }, [autoFocus]);

  return ref;
};

export const useAutoSelect = <T extends HTMLInputElement = HTMLInputElement>(
  autoSelect?: boolean
) => {
  const ref = useRef<T | null>(null);

  useLayoutEffect(() => {
    if (ref.current && autoSelect) {
      setTimeout(() => {
        ref.current?.select();
      }, 0);
    }
  }, [autoSelect, ref]);

  return ref;
};

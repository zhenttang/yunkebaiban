import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import clsx from 'clsx';
import React, { useCallback, useImperativeHandle, useState } from 'react';

import type { MenuProps } from '../menu.types';
import * as styles from '../styles.css';
import * as desktopStyles from './styles.css';

export const DesktopMenu = ({
  children,
  items,
  noPortal,
  portalOptions,
  rootOptions: {
    defaultOpen,
    modal,
    open,
    onOpenChange,
    onClose,
    ...rootOptions
  } = {},
  contentOptions: {
    className = '',
    style: contentStyle = {},
    ...otherContentOptions
  } = {},
  ref,
}: MenuProps) => {
  const [innerOpen, setInnerOpen] = useState(defaultOpen ?? false);
  
  // 决定是受控还是非受控模式
  // 如果 open 是 undefined，使用内部状态（非受控）
  // 如果 open 有值，使用外部状态（受控）
  const isControlled = open !== undefined;
  const finalOpen = isControlled ? open : innerOpen;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!isControlled) {
        // 非受控模式：更新内部状态
        setInnerOpen(open);
      }
      // 受控和非受控模式都调用外部回调
      onOpenChange?.(open);
      if (!open) {
        onClose?.();
      }
    },
    [onOpenChange, onClose, isControlled]
  );

  useImperativeHandle(
    ref,
    () => ({
      changeOpen: (open: boolean) => {
        setInnerOpen(open);
        onOpenChange?.(open);
      },
    }),
    [onOpenChange]
  );

  const ContentWrapper = noPortal ? React.Fragment : DropdownMenu.Portal;
  
  // 构建传递给 Radix UI 的 props
  // 如果是受控模式，传递 open；如果是非受控模式，不传递 open（使用 defaultOpen）
  const rootProps = {
    modal: modal ?? false,
    onOpenChange: handleOpenChange,
    ...rootOptions,
    // 只在受控模式下传递 open
    ...(isControlled ? { open: finalOpen } : defaultOpen !== undefined ? { defaultOpen } : {}),
  };

  return (
    <DropdownMenu.Root {...rootProps}>
      <DropdownMenu.Trigger
        asChild
        onClick={e => {
          // 注意：不要阻止默认行为，让Radix UI正常处理点击事件
          // 阻止默认行为可能导致遮罩层无法正常关闭
          e.stopPropagation();
        }}
      >
        {children}
      </DropdownMenu.Trigger>

      <ContentWrapper {...portalOptions}>
        <DropdownMenu.Content
          className={clsx(
            styles.menuContent,
            desktopStyles.contentAnimation,
            className
          )}
          sideOffset={4}
          align="start"
          style={{ zIndex: 'var(--yunke-z-index-popover)', ...contentStyle }}
          {...otherContentOptions}
        >
          {items}
        </DropdownMenu.Content>
      </ContentWrapper>
    </DropdownMenu.Root>
  );
};

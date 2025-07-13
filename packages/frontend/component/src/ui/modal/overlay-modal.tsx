import { DialogTrigger } from '@radix-ui/react-dialog';
import { cssVar } from '@toeverything/theme';
import { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';

import type { ButtonProps } from '../button';
import { Button } from '../button';
import type { ModalProps } from './modal';
import { Modal } from './modal';
import * as styles from './overlay-modal.css';

const defaultContentOptions: ModalProps['contentOptions'] = {
  style: {
    padding: 0,
    overflow: 'hidden',
    boxShadow: cssVar('menuShadow'),
  },
};
const defaultOverlayOptions: ModalProps['overlayOptions'] = {
  style: {
    background: cssVar('white80'),
    backdropFilter: 'blur(2px)',
  },
};

export interface OverlayModalProps extends ModalProps {
  to?: string;
  external?: boolean;
  topImage?: React.ReactNode;
  confirmText?: string;
  confirmButtonOptions?: ButtonProps;
  onConfirm?: () => void;
  cancelText?: string;
  cancelButtonOptions?: ButtonProps;
  withoutCancelButton?: boolean;
}

export const OverlayModal = memo(function OverlayModal({
  open,
  topImage,
  onOpenChange,
  title,
  description,
  onConfirm,
  to,
  external,
  confirmButtonOptions,
  cancelButtonOptions,
  withoutCancelButton,
  contentOptions = defaultContentOptions,
  overlayOptions = defaultOverlayOptions,
  // FIXME: 我们需要国际化
  cancelText = '取消',
  confirmText = '确认',
  width = 400,
}: OverlayModalProps) {
  const handleConfirm = useCallback(() => {
    onOpenChange?.(false);
    onConfirm?.();
  }, [onOpenChange, onConfirm]);

  return (
    <Modal
      contentOptions={contentOptions}
      overlayOptions={overlayOptions}
      open={open}
      width={width}
      onOpenChange={onOpenChange}
      withoutCloseButton
    >
      {topImage}
      <div className={styles.title}>{title}</div>
      <div className={styles.content}>{description}</div>
      <div className={styles.footer}>
        {!withoutCancelButton ? (
          <DialogTrigger asChild>
            <Button {...cancelButtonOptions}>{cancelText}</Button>
          </DialogTrigger>
        ) : null}

        {to ? (
          external ? (
            //FIXME: 我们需要一种更标准化的方式来实现这个带有其他点击事件的链接
            <a href={to} target="_blank" rel="noreferrer">
              <Button onClick={handleConfirm} {...confirmButtonOptions}>
                {confirmText}
              </Button>
            </a>
          ) : (
            <Link to={to}>
              <Button onClick={handleConfirm} {...confirmButtonOptions}>
                {confirmText}
              </Button>
            </Link>
          )
        ) : (
          <Button onClick={handleConfirm} {...confirmButtonOptions}>
            {confirmText}
          </Button>
        )}
      </div>
    </Modal>
  );
});

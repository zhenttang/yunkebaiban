import type { Meta } from '@storybook/react';

import { Button } from '../button';
import {
  ConfirmModal,
  type ConfirmModalProps,
  useConfirmModal,
} from './confirm-modal';

export default {
  title: 'UI/Modal/Confirm Modal',
  component: ConfirmModal,
  argTypes: {},
} satisfies Meta<ConfirmModalProps>;

export const UsingHook = () => {
  const { openConfirmModal } = useConfirmModal();

  const onConfirm = () =>
    new Promise<void>(resolve => setTimeout(resolve, 2000));

  const showConfirm = () => {
    openConfirmModal({
      cancelText: '取消',
      confirmText: '确认',
      title: '确认模态框',
      children: '您确定要确认吗？',
      onConfirm,
      onCancel: () => {
        console.log('已取消');
      },
    });
  };

  return <Button onClick={showConfirm}>显示确认</Button>;
};

export const AutoClose = () => {
  const { openConfirmModal } = useConfirmModal();

  const onConfirm = () => {
    openConfirmModal({
      cancelText: '取消',
      confirmText: '确认',
      title: '确认模态框',
      children: '您确定要确认吗？',
      onConfirm: () => console.log('已确认'),
      onCancel: () => {
        console.log('已取消');
      },
    });
  };

  return <Button onClick={onConfirm}>显示确认</Button>;
};

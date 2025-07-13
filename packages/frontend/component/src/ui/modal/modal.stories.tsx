import type { Meta, StoryFn } from '@storybook/react';
import { useCallback, useState } from 'react';

import { Button } from '../button';
import type { InputProps } from '../input';
import { Input } from '../input';
import { RadioGroup } from '../radio';
import type { ConfirmModalProps } from './confirm-modal';
import { ConfirmModal } from './confirm-modal';
import type { ModalProps } from './modal';
import { Modal } from './modal';
import type { OverlayModalProps } from './overlay-modal';
import { OverlayModal } from './overlay-modal';

export default {
  title: 'UI/Modal',
  component: Modal,
  argTypes: {},
} satisfies Meta<ModalProps>;

const Template: StoryFn<ModalProps> = args => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>打开弹窗</Button>
      <Modal open={open} onOpenChange={setOpen} {...args} />
    </>
  );
};

export const Default: StoryFn<ModalProps> = Template.bind(undefined);
Default.args = {
  title: '模态框标题',
  description:
    '这是一个示例模态框的描述内容。如果天色已晚，鸟儿不再歌唱，风也疲倦地停下了脚步，那就让黑暗的面纱厚厚地覆盖我吧，就像你用睡眠的被褥包裹大地，温柔地在黄昏时合上下垂莲花的花瓣一样。',
};

const wait = () => new Promise(resolve => setTimeout(resolve, 1000));
const ConfirmModalTemplate: StoryFn<ConfirmModalProps> = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputStatus, setInputStatus] =
    useState<InputProps['status']>('default');

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    await wait();
    setInputStatus(inputStatus !== 'error' ? 'error' : 'success');
    setLoading(false);
  }, [inputStatus]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>打开确认模态框</Button>
      <ConfirmModal
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
        title="模态框标题"
        description="模态框描述"
        confirmText="确认"
        confirmButtonOptions={{
          loading: loading,
          variant: 'primary',
        }}
      >
        <Input placeholder="输入内容" status={inputStatus} />
      </ConfirmModal>
    </>
  );
};

const OverlayModalTemplate: StoryFn<OverlayModalProps> = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>打开覆盖模态框</Button>
      <OverlayModal
        open={open}
        onOpenChange={setOpen}
        title="模态框标题"
        description="模态框描述"
        confirmButtonOptions={{
          variant: 'primary',
        }}
        topImage={
          <div
            style={{
              width: '400px',
              height: '300px',
              background: '#66ccff',
              opacity: 0.1,
              color: '#fff',
            }}
          ></div>
        }
      />
    </>
  );
};

export const Confirm: StoryFn<ModalProps> =
  ConfirmModalTemplate.bind(undefined);

export const Overlay: StoryFn<ModalProps> =
  OverlayModalTemplate.bind(undefined);

export const Animations = () => {
  const animations = ['fadeScaleTop', 'slideBottom', 'none'];
  const [open, setOpen] = useState(false);
  const [animation, setAnimation] =
    useState<ModalProps['animation']>('fadeScaleTop');

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <RadioGroup
        value={animation}
        onChange={setAnimation}
        items={animations}
      />
      <Button onClick={() => setOpen(true)}>打开对话框</Button>
      <Modal
        contentWrapperStyle={
          animation === 'slideBottom'
            ? {
                alignItems: 'end',
                padding: 10,
              }
            : {}
        }
        open={open}
        onOpenChange={setOpen}
        animation={animation}
      >
        这是一个带有动画效果的对话框：{animation}
      </Modal>
    </div>
  );
};

export const Nested = () => {
  const [openRoot, setOpenRoot] = useState(false);
  const [openNested, setOpenNested] = useState(false);

  return (
    <>
      <Button onClick={() => setOpenRoot(true)}>打开根模态框</Button>
      <Modal
        animation="slideBottom"
        open={openRoot}
        onOpenChange={setOpenRoot}
        contentOptions={{
          style: {
            transition: 'all .3s ease 0.1s',
            transform: openNested
              ? `scale(0.95) translateY(-20px)`
              : 'scale(1) translateY(0)',
          },
        }}
      >
        <Button onClick={() => setOpenNested(true)}>打开嵌套模态框</Button>
      </Modal>
      <Modal
        animation="slideBottom"
        open={openNested}
        onOpenChange={setOpenNested}
        overlayOptions={{ style: { background: 'transparent' } }}
      >
        嵌套模态框
      </Modal>
    </>
  );
};

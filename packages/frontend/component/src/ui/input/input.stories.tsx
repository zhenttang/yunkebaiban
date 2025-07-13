import { InformationIcon } from '@blocksuite/icons/rc';
import type { Meta, StoryFn } from '@storybook/react';

import type { InputProps } from './index';
import { Input } from './index';

export default {
  title: 'UI/Input',
  component: Input,
} satisfies Meta<typeof Input>;

const Template: StoryFn<InputProps> = args => (
  <div style={{ width: '50%' }}>
    <Input {...args} />
  </div>
);

export const Default: StoryFn<InputProps> = Template.bind(undefined);
Default.args = {
  defaultValue: '这是一个默认输入框',
};

export const WithPrefix: StoryFn<InputProps> = Template.bind(undefined);
WithPrefix.args = {
  defaultValue: '这是一个带前缀的输入框',
  preFix: <InformationIcon />,
};

export const Large: StoryFn<InputProps> = Template.bind(undefined);
Large.args = {
  placeholder: '这是一个大尺寸输入框',
  size: 'large',
};
export const ExtraLarge: StoryFn<InputProps> = Template.bind(undefined);
ExtraLarge.args = {
  placeholder: '这是一个超大尺寸输入框',
  size: 'extraLarge',
};

export const CustomWidth: StoryFn<InputProps> = Template.bind(undefined);
CustomWidth.args = {
  width: 300,
  placeholder: '这是一个自定义宽度输入框，默认为100%',
};
export const ErrorStatus: StoryFn<InputProps> = Template.bind(undefined);
ErrorStatus.args = {
  status: 'error',
  placeholder: '这是一个错误状态输入框',
};
export const WarningStatus: StoryFn<InputProps> = Template.bind(undefined);
WarningStatus.args = {
  status: 'warning',
  placeholder: '这是一个警告状态输入框',
};
export const Disabled: StoryFn<InputProps> = Template.bind(undefined);
Disabled.args = {
  disabled: true,
  placeholder: '这是一个禁用状态输入框',
};

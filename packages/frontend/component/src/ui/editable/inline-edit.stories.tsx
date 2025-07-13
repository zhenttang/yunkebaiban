import type { Meta, StoryFn } from '@storybook/react';
import { useCallback, useRef, useState } from 'react';

import { Button } from '../button';
import { ResizePanel } from '../resize-panel/resize-panel';
import type { InlineEditHandle } from './inline-edit';
import { InlineEdit } from './inline-edit';

export default {
  title: 'UI/Editable/Inline Edit',
  component: InlineEdit,
} satisfies Meta<typeof InlineEdit>;

const Template: StoryFn<typeof InlineEdit> = args => {
  const [value, setValue] = useState(args.value || '');
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <span>
            <b>值: </b>
          </span>
          <span
            style={{
              padding: '2px 4px',
              backgroundColor: 'rgba(100, 100, 100, 0.1)',
            }}
          >
            {value}
          </span>
        </div>
      </div>

      <ResizePanel
        width={600}
        height={36}
        minHeight={36}
        minWidth={200}
        maxWidth={1400}
        horizontal={true}
        vertical={false}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <InlineEdit
          style={{ maxWidth: '100%' }}
          value={value}
          onChange={v => setValue(v)}
          {...args}
        />
      </ResizePanel>
    </div>
  );
};

export const Basic: StoryFn<typeof InlineEdit> = Template.bind(undefined);
Basic.args = {
  editable: true,
  placeholder: '未命名',
  trigger: 'doubleClick',
};

export const CustomizeText: StoryFn<typeof InlineEdit> =
  Template.bind(undefined);
CustomizeText.args = {
  value: '自定义文本',
  editable: true,
  placeholder: '未命名',
  style: {
    fontSize: 20,
    fontWeight: 500,
    padding: '10px 20px',
  },
};

export const TriggerEdit: StoryFn<typeof InlineEdit> = args => {
  const ref = useRef<InlineEditHandle>(null);

  const triggerEdit = useCallback(() => {
    if (!ref.current) return;
    ref.current.triggerEdit();
  }, []);

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Button onClick={triggerEdit}>编辑</Button>
      </div>
      <ResizePanel
        width={600}
        height={36}
        minHeight={36}
        minWidth={200}
        maxWidth={1400}
        horizontal={true}
        vertical={false}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <InlineEdit {...args} handleRef={ref} />
      </ResizePanel>
    </>
  );
};
TriggerEdit.args = {
  value: '通过 `handleRef` 在父组件中触发编辑模式',
  editable: true,
};

export const UpdateValue: StoryFn<typeof InlineEdit> = args => {
  const [value, setValue] = useState(args.value || '');

  const appendA = useCallback(() => {
    setValue(v => v + 'a');
  }, []);

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Button onClick={appendA}>追加 &quot;a&quot;</Button>
      </div>
      <ResizePanel
        width={600}
        height={36}
        minHeight={36}
        minWidth={200}
        maxWidth={1400}
        horizontal={true}
        vertical={false}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <InlineEdit {...args} value={value} onChange={setValue} />
      </ResizePanel>
    </>
  );
};
UpdateValue.args = {
  value: '通过 `value` 在父组件中更新值',
  editable: true,
};

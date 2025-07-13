import type { Meta, StoryFn } from '@storybook/react';
import { useState } from 'react';

import { Button } from '../button';
import { RadioGroup } from '../radio';
import type { TooltipProps } from './index';
import Tooltip from './index';

export default {
  title: 'UI/Tooltip',
  component: Tooltip,
} satisfies Meta<typeof Tooltip>;

const Template: StoryFn<TooltipProps> = args => (
  <Tooltip content="这是一个工具提示" {...args}>
    <Button>显示工具提示</Button>
  </Tooltip>
);

export const Default: StoryFn<TooltipProps> = Template.bind(undefined);
Default.args = {};

export const WithShortCut = () => {
  const shortCuts = [
    ['文本', 'T'],
    ['加粗', ['⌘', 'B']],
    ['快速搜索', ['⌘', 'K']],
    ['分享', ['⌘', 'Shift', 'S']],
    ['复制', ['$mod', '$shift', 'C']],
  ] as Array<[string, string | string[]]>;

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {shortCuts.map(([name, shortcut]) => (
        <Tooltip shortcut={shortcut} content={name} key={name}>
          <Button>{name}</Button>
        </Tooltip>
      ))}
    </div>
  );
};

export const CustomAlign = () => {
  const [align, setAlign] = useState('center' as const);
  const _ = undefined;
  const positions = [
    // [top, left, right, bottom, translateX, translateY]
    [0, 0, _, _, _, _],
    [0, '50%', _, _, '-50%', _],
    [0, _, 0, _, _, _],
    ['50%', 0, _, _, _, '-50%'],
    ['50%', _, 0, _, _, '-50%'],
    [_, 0, _, 0, _, _],
    [_, '50%', _, 0, '-50%', _],
    [_, _, 0, 0, _, _],
  ];
  return (
    <div>
      <RadioGroup
        items={['start', 'center', 'end']}
        value={align}
        onChange={setAlign}
      />
      <div
        style={{
          width: '100%',
          height: 200,
          position: 'relative',
          border: '1px solid rgba(100,100,100,0.2)',
          marginTop: 40,
        }}
      >
        {positions.map(pos => {
          const key = pos.join('-');
          const style = {
            position: 'absolute',
            top: pos[0],
            left: pos[1],
            right: pos[2],
            bottom: pos[3],
            transform: `translate(${pos[4] ?? 0}, ${pos[5] ?? 0})`,
          } as const;
          return (
            <Tooltip align={align} content="这是一个工具提示" key={key}>
              <Button style={style}>显示工具提示</Button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

const sides = ['top', 'right', 'bottom', 'left'] as const;
export const CustomSide = () => {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {sides.map(side => (
        <Tooltip content="这是一个工具提示" side={side} key={side}>
          <Button>在{side === 'top' ? '上方' : side === 'right' ? '右侧' : side === 'bottom' ? '下方' : '左侧'}显示工具提示</Button>
        </Tooltip>
      ))}
    </div>
  );
};

export const WithCustomContent: StoryFn<TooltipProps> = args => (
  <Tooltip
    content={
      <ul>
        <li>这是一个工具提示</li>
        <li style={{ color: 'red' }}>带有自定义内容</li>
      </ul>
    }
    {...args}
  >
    <Button>显示工具提示</Button>
  </Tooltip>
);

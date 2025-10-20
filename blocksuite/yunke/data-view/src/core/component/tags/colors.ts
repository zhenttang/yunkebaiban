import { cssVarV2 } from '@toeverything/theme/v2';

export type SelectOptionColor = {
  oldColor: string;
  color: string;
  name: string;
};
export const selectOptionColors: SelectOptionColor[] = [
  {
    oldColor: 'var(--yunke-tag-red)',
    color: cssVarV2('chip/label/red'),
    name: '红色',
  },
  {
    oldColor: 'var(--yunke-tag-pink)',
    color: cssVarV2('chip/label/magenta'),
    name: '品红',
  },
  {
    oldColor: 'var(--yunke-tag-orange)',
    color: cssVarV2('chip/label/orange'),
    name: '橙色',
  },
  {
    oldColor: 'var(--yunke-tag-yellow)',
    color: cssVarV2('chip/label/yellow'),
    name: '黄色',
  },
  {
    oldColor: 'var(--yunke-tag-green)',
    color: cssVarV2('chip/label/green'),
    name: '绿色',
  },
  {
    oldColor: 'var(--yunke-tag-teal)',
    color: cssVarV2('chip/label/teal'),
    name: '青色',
  },
  {
    oldColor: 'var(--yunke-tag-blue)',
    color: cssVarV2('chip/label/blue'),
    name: '蓝色',
  },
  {
    oldColor: 'var(--yunke-tag-purple)',
    color: cssVarV2('chip/label/purple'),
    name: '紫色',
  },
  {
    oldColor: 'var(--yunke-tag-gray)',
    color: cssVarV2('chip/label/grey'),
    name: '灰色',
  },
  {
    oldColor: 'var(--yunke-tag-white)',
    color: cssVarV2('chip/label/white'),
    name: '白色',
  },
];

const oldColorMap = Object.fromEntries(
  selectOptionColors.map(tag => [tag.oldColor, tag.color])
);

export const getColorByColor = (color: string) => {
  if (color.startsWith('--yunke-tag')) {
    return oldColorMap[color] ?? color;
  }
  return color;
};

/** select tag color poll */
const selectTagColorPoll = selectOptionColors.map(color => color.color);

function tagColorHelper() {
  let colors = [...selectTagColorPoll];
  return (): string => {
    if (colors.length === 0) {
      colors = [...selectTagColorPoll];
    }
    const index = Math.floor(Math.random() * colors.length);
    const color = colors.splice(index, 1)[0];
    if (!color) return '';
    return color;
  };
}

export const getTagColor = tagColorHelper();

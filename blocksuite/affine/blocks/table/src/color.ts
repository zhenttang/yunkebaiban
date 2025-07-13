import { cssVarV2 } from '@blocksuite/affine-shared/theme';
type Color = {
  name: string;
  color: string;
};
export const colorList: Color[] = [
  {
    name: '蓝色',
    color: cssVarV2.table.headerBackground.blue,
  },
  {
    name: '绿色',
    color: cssVarV2.table.headerBackground.green,
  },
  {
    name: '灰色',
    color: cssVarV2.table.headerBackground.grey,
  },
  {
    name: '橙色',
    color: cssVarV2.table.headerBackground.orange,
  },
  {
    name: '紫色',
    color: cssVarV2.table.headerBackground.purple,
  },
  {
    name: '红色',
    color: cssVarV2.table.headerBackground.red,
  },
  {
    name: '青色',
    color: cssVarV2.table.headerBackground.teal,
  },
  {
    name: '黄色',
    color: cssVarV2.table.headerBackground.yellow,
  },
];

const colorMap = Object.fromEntries(colorList.map(item => [item.color, item]));

export const getColorByColor = (color: string): Color | undefined => {
  return colorMap[color] ?? undefined;
};

import type { ShapeToolOption } from '@blocksuite/yunke-gfx-shape';
import { ShapeType } from '@blocksuite/yunke-model';
import {
  DiamondIcon,
  EllipseIcon,
  RoundedRectangleIcon,
  SquareIcon,
  TriangleIcon,
} from '@blocksuite/icons/lit';
import type { TemplateResult } from 'lit';

import {
  ScribbledDiamondIcon,
  ScribbledEllipseIcon,
  ScribbledRoundedRectangleIcon,
  ScribbledSquareIcon,
  ScribbledTriangleIcon,
} from './icons';

type Config = {
  name: ShapeToolOption['shapeName'];
  generalIcon: TemplateResult<1>;
  scribbledIcon: TemplateResult<1>;
  tooltip: string;
  disabled: boolean;
};

export const ShapeComponentConfig: Config[] = [
  {
    name: ShapeType.Rect,
    generalIcon: SquareIcon(),
    scribbledIcon: ScribbledSquareIcon,
    tooltip: '正方形',
    disabled: false,
  },
  {
    name: ShapeType.Ellipse,
    generalIcon: EllipseIcon(),
    scribbledIcon: ScribbledEllipseIcon,
    tooltip: '椭圆',
    disabled: false,
  },
  {
    name: ShapeType.Diamond,
    generalIcon: DiamondIcon(),
    scribbledIcon: ScribbledDiamondIcon,
    tooltip: '菱形',
    disabled: false,
  },
  {
    name: ShapeType.Triangle,
    generalIcon: TriangleIcon(),
    scribbledIcon: ScribbledTriangleIcon,
    tooltip: '三角形',
    disabled: false,
  },
  {
    name: 'roundedRect',
    generalIcon: RoundedRectangleIcon(),
    scribbledIcon: ScribbledRoundedRectangleIcon,
    tooltip: '圆角矩形',
    disabled: false,
  },
];

export const ShapeComponentConfigMap = ShapeComponentConfig.reduce(
  (acc, config) => {
    acc[config.name] = config;
    return acc;
  },
  {} as Record<Config['name'], Config>
);

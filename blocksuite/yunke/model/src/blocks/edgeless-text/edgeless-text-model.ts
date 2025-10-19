import type {
  GfxCommonBlockProps,
  GfxElementGeometry,
} from '@blocksuite/std/gfx';
import { GfxCompatible } from '@blocksuite/std/gfx';
import {
  BlockModel,
  BlockSchemaExtension,
  defineBlockSchema,
} from '@blocksuite/store';
import { z } from 'zod';

import {
  FontFamily,
  FontFamilySchema,
  FontStyle,
  FontStyleSchema,
  FontWeight,
  FontWeightSchema,
  TextAlign,
  TextAlignSchema,
  type TextStyleProps,
} from '../../consts/index';
import { ColorSchema } from '../../themes/color';
import { DefaultTheme } from '../../themes/default';

type EdgelessTextProps = {
  hasMaxWidth: boolean;
} & TextStyleProps &
  GfxCommonBlockProps;

export const EdgelessTextZodSchema = z
  .object({
    color: ColorSchema,
    fontFamily: FontFamilySchema,
    fontSize: z.number(),
    fontStyle: FontStyleSchema,
    fontWeight: FontWeightSchema,
    textAlign: TextAlignSchema,
  })
  .default({
    color: DefaultTheme.textColor,
    fontFamily: FontFamily.Inter,
    fontSize: 24,
    fontStyle: FontStyle.Normal,
    fontWeight: FontWeight.Regular,
    textAlign: TextAlign.Left,
  });

export const EdgelessTextBlockSchema = defineBlockSchema({
  flavour: 'yunke:edgeless-text',
  props: (): EdgelessTextProps => ({
    xywh: '[0,0,16,16]',
    index: 'a0',
    lockedBySelf: false,
    scale: 1,
    rotate: 0,
    hasMaxWidth: false,
    ...EdgelessTextZodSchema.parse(undefined),
  }),
  metadata: {
    version: 1,
    role: 'hub',
    parent: ['yunke:surface'],
    children: [
      'yunke:paragraph',
      'yunke:list',
      'yunke:code',
      'yunke:image',
      'yunke:bookmark',
      'yunke:attachment',
      'yunke:embed-!(synced-doc)',
      'yunke:latex',
    ],
  },
  toModel: () => new EdgelessTextBlockModel(),
});

export const EdgelessTextBlockSchemaExtension = BlockSchemaExtension(
  EdgelessTextBlockSchema
);

export class EdgelessTextBlockModel
  extends GfxCompatible<EdgelessTextProps>(BlockModel)
  implements GfxElementGeometry
{
  get color() {
    return this.props.color;
  }

  set color(color: EdgelessTextProps['color']) {
    this.props.color = color;
  }

  get fontSize() {
    return this.props.fontSize;
  }

  set fontSize(fontSize: EdgelessTextProps['fontSize']) {
    this.props.fontSize = fontSize;
  }
}

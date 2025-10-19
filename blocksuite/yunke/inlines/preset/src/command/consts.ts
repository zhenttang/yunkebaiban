// corresponding to `formatText` command
import { TableModelFlavour } from '@blocksuite/yunke-model';

export const FORMAT_TEXT_SUPPORT_FLAVOURS = [
  'yunke:paragraph',
  'yunke:list',
  'yunke:code',
];
// corresponding to `formatBlock` command
export const FORMAT_BLOCK_SUPPORT_FLAVOURS = [
  'yunke:paragraph',
  'yunke:list',
  'yunke:code',
];
// corresponding to `formatNative` command
export const FORMAT_NATIVE_SUPPORT_FLAVOURS = [
  'yunke:database',
  TableModelFlavour,
];

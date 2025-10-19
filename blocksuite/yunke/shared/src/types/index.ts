import type { FootNote, ReferenceInfo } from '@blocksuite/yunke-model';
import type { InlineEditor } from '@blocksuite/std/inline';
import type { BlockModel } from '@blocksuite/store';
export * from './uni-component';

export type NoteChildrenFlavour =
  | 'yunke:paragraph'
  | 'yunke:list'
  | 'yunke:code'
  | 'yunke:divider'
  | 'yunke:database'
  | 'yunke:data-view'
  | 'yunke:image'
  | 'yunke:bookmark'
  | 'yunke:attachment'
  | 'yunke:surface-ref';

export interface Viewport {
  left: number;
  top: number;
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
  scrollHeight: number;
  clientWidth: number;
  clientHeight: number;
}

export type ExtendedModel = BlockModel & Record<string, any>;

export type IndentContext = {
  blockId: string;
  inlineIndex: number;
  flavour: string;
  type: 'indent' | 'dedent';
};

export interface AffineTextAttributes {
  bold?: true | null;
  italic?: true | null;
  underline?: true | null;
  strike?: true | null;
  code?: true | null;
  link?: string | null;
  reference?:
    | ({
        type: 'Subpage' | 'LinkedPage';
      } & ReferenceInfo)
    | null;
  background?: string | null;
  color?: string | null;
  latex?: string | null;
  footnote?: FootNote | null;
  mention?: {
    member: string;
    notification?: string;
  } | null;
}

export type AffineInlineEditor = InlineEditor<AffineTextAttributes>;

export type SelectedRect = {
  left: number;
  top: number;
  width: number;
  height: number;
  borderWidth: number;
  borderStyle: string;
  rotate: number;
};

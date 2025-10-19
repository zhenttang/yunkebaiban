import { FootNoteInlineSpecExtension } from '@blocksuite/yunke-inline-footnote';
import { LatexInlineSpecExtension } from '@blocksuite/yunke-inline-latex';
import { LinkInlineSpecExtension } from '@blocksuite/yunke-inline-link';
import { MentionInlineSpecExtension } from '@blocksuite/yunke-inline-mention';
import { ReferenceInlineSpecExtension } from '@blocksuite/yunke-inline-reference';
import type { AffineTextAttributes } from '@blocksuite/yunke-shared/types';
import { InlineManagerExtension } from '@blocksuite/std/inline';

import {
  BackgroundInlineSpecExtension,
  BoldInlineSpecExtension,
  CodeInlineSpecExtension,
  ColorInlineSpecExtension,
  ItalicInlineSpecExtension,
  StrikeInlineSpecExtension,
  UnderlineInlineSpecExtension,
} from './inline-spec';

export const DefaultInlineManagerExtension =
  InlineManagerExtension<AffineTextAttributes>({
    id: 'DefaultInlineManager',
    specs: [
      BoldInlineSpecExtension.identifier,
      ItalicInlineSpecExtension.identifier,
      UnderlineInlineSpecExtension.identifier,
      StrikeInlineSpecExtension.identifier,
      CodeInlineSpecExtension.identifier,
      BackgroundInlineSpecExtension.identifier,
      ColorInlineSpecExtension.identifier,
      LatexInlineSpecExtension.identifier,
      ReferenceInlineSpecExtension.identifier,
      LinkInlineSpecExtension.identifier,
      FootNoteInlineSpecExtension.identifier,
      MentionInlineSpecExtension.identifier,
    ],
  });

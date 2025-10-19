import { LatexInlineSpecExtension } from '@blocksuite/yunke-inline-latex';
import { LinkInlineSpecExtension } from '@blocksuite/yunke-inline-link';
import {
  BackgroundInlineSpecExtension,
  BoldInlineSpecExtension,
  CodeInlineSpecExtension,
  ColorInlineSpecExtension,
  ItalicInlineSpecExtension,
  StrikeInlineSpecExtension,
  UnderlineInlineSpecExtension,
} from '@blocksuite/yunke-inline-preset';
import type { AffineTextAttributes } from '@blocksuite/yunke-shared/types';
import {
  InlineManagerExtension,
  InlineSpecExtension,
} from '@blocksuite/std/inline';
import { html } from 'lit';
import { z } from 'zod';

export const CodeBlockUnitSpecExtension =
  InlineSpecExtension<AffineTextAttributes>({
    name: 'code-block-unit',
    schema: z.undefined(),
    match: () => true,
    renderer: ({ delta }) => {
      return html`<affine-code-unit .delta=${delta}></affine-code-unit>`;
    },
  });

export const CodeBlockInlineManagerExtension =
  InlineManagerExtension<AffineTextAttributes>({
    id: 'CodeBlockInlineManager',
    enableMarkdown: false,
    specs: [
      BoldInlineSpecExtension.identifier,
      ItalicInlineSpecExtension.identifier,
      UnderlineInlineSpecExtension.identifier,
      StrikeInlineSpecExtension.identifier,
      CodeInlineSpecExtension.identifier,
      BackgroundInlineSpecExtension.identifier,
      ColorInlineSpecExtension.identifier,
      LatexInlineSpecExtension.identifier,
      LinkInlineSpecExtension.identifier,
      CodeBlockUnitSpecExtension.identifier,
    ],
  });

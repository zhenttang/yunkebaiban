import type { YunkeTextAttributes } from '@blocksuite/yunke-shared/types';
import {
  type InlineRootElement,
  InlineSpecExtension,
} from '@blocksuite/std/inline';
import type { ExtensionType } from '@blocksuite/store';
import { html } from 'lit';
import { z } from 'zod';

export type YunkeInlineRootElement = InlineRootElement<YunkeTextAttributes>;

export const BoldInlineSpecExtension =
  InlineSpecExtension<YunkeTextAttributes>({
    name: 'bold',
    schema: z.literal(true).optional().nullable().catch(undefined),
    match: delta => {
      return !!delta.attributes?.bold;
    },
    renderer: ({ delta }) => {
      return html`<yunke-text .delta=${delta}></yunke-text>`;
    },
  });

export const ItalicInlineSpecExtension =
  InlineSpecExtension<YunkeTextAttributes>({
    name: 'italic',
    schema: z.literal(true).optional().nullable().catch(undefined),
    match: delta => {
      return !!delta.attributes?.italic;
    },
    renderer: ({ delta }) => {
      return html`<yunke-text .delta=${delta}></yunke-text>`;
    },
  });

export const UnderlineInlineSpecExtension =
  InlineSpecExtension<YunkeTextAttributes>({
    name: 'underline',
    schema: z.literal(true).optional().nullable().catch(undefined),
    match: delta => {
      return !!delta.attributes?.underline;
    },
    renderer: ({ delta }) => {
      return html`<yunke-text .delta=${delta}></yunke-text>`;
    },
  });

export const StrikeInlineSpecExtension =
  InlineSpecExtension<YunkeTextAttributes>({
    name: 'strike',
    schema: z.literal(true).optional().nullable().catch(undefined),
    match: delta => {
      return !!delta.attributes?.strike;
    },
    renderer: ({ delta }) => {
      return html`<yunke-text .delta=${delta}></yunke-text>`;
    },
  });

export const CodeInlineSpecExtension =
  InlineSpecExtension<YunkeTextAttributes>({
    name: 'code',
    schema: z.literal(true).optional().nullable().catch(undefined),
    match: delta => {
      return !!delta.attributes?.code;
    },
    renderer: ({ delta }) => {
      return html`<yunke-text .delta=${delta}></yunke-text>`;
    },
  });

export const BackgroundInlineSpecExtension =
  InlineSpecExtension<YunkeTextAttributes>({
    name: 'background',
    schema: z.string().optional().nullable().catch(undefined),
    match: delta => {
      return !!delta.attributes?.background;
    },
    renderer: ({ delta }) => {
      return html`<yunke-text .delta=${delta}></yunke-text>`;
    },
  });

export const ColorInlineSpecExtension =
  InlineSpecExtension<YunkeTextAttributes>({
    name: 'color',
    schema: z.string().optional().nullable().catch(undefined),
    match: delta => {
      return !!delta.attributes?.color;
    },
    renderer: ({ delta }) => {
      return html`<yunke-text .delta=${delta}></yunke-text>`;
    },
  });

export const InlineSpecExtensions: ExtensionType[] = [
  BoldInlineSpecExtension,
  ItalicInlineSpecExtension,
  UnderlineInlineSpecExtension,
  StrikeInlineSpecExtension,
  CodeInlineSpecExtension,
  BackgroundInlineSpecExtension,
  ColorInlineSpecExtension,
];

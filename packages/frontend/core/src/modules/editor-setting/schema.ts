import { GeneralSettingSchema } from '@blocksuite/yunke/shared/services';
import { z } from 'zod';

export const BSEditorSettingSchema = GeneralSettingSchema;

export type FontFamily = 'Sans' | 'Serif' | 'Mono' | 'Custom';
export type EdgelessDefaultTheme = 'auto' | 'dark' | 'light' | 'specified';

export const fontStyleOptions = [
  { key: 'Sans', value: 'var(--yunke-font-sans-family)' },
  { key: 'Serif', value: 'var(--yunke-font-serif-family)' },
  { key: 'Mono', value: 'var(--yunke-font-mono-family)' },
  { key: 'Custom', value: 'var(--yunke-font-sans-family)' },
] satisfies {
  key: FontFamily;
  value: string;
}[];

const YunkeEditorSettingSchema = z.object({
  fontFamily: z.enum(['Sans', 'Serif', 'Mono', 'Custom']).default('Sans'),
  customFontFamily: z.string().default(''),
  fontSize: z.number().min(12).max(24).default(16),
  newDocDefaultMode: z.enum(['edgeless', 'page', 'ask']).default('page'),
  fullWidthLayout: z.boolean().default(false),
  displayDocInfo: z.boolean().default(true),
  displayBiDirectionalLink: z.boolean().default(true),
  edgelessDefaultTheme: z
    .enum(['specified', 'dark', 'light', 'auto'])
    .default('specified'),
  openDocMode: z
    .enum([
      'open-in-active-view',
      'open-in-new-view',
      'open-in-new-tab',
      'open-in-center-peek',
    ])
    .default('open-in-active-view'),
  // linux only:
  enableMiddleClickPaste: z.boolean().default(false),
});

export const EditorSettingSchema = BSEditorSettingSchema.merge(
  YunkeEditorSettingSchema
);

// oxlint-disable-next-line no-redeclare
export type EditorSettingSchema = z.infer<typeof EditorSettingSchema>;

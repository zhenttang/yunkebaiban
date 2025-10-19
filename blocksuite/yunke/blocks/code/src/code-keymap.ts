import { textKeymap } from '@blocksuite/yunke-inline-preset';
import { CodeBlockSchema } from '@blocksuite/yunke-model';
import { KeymapExtension } from '@blocksuite/std';

export const CodeKeymapExtension = KeymapExtension(textKeymap, {
  flavour: CodeBlockSchema.model.flavour,
});

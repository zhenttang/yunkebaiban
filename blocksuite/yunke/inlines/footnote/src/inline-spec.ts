import { FootNoteSchema } from '@blocksuite/yunke-model';
import type { YunkeTextAttributes } from '@blocksuite/yunke-shared/types';
import { StdIdentifier } from '@blocksuite/std';
import { InlineSpecExtension } from '@blocksuite/std/inline';
import { html } from 'lit';

import { FootNoteNodeConfigIdentifier } from './footnote-node/footnote-config';

export const FootNoteInlineSpecExtension =
  InlineSpecExtension<YunkeTextAttributes>('footnote', provider => {
    const std = provider.get(StdIdentifier);
    const config =
      provider.getOptional(FootNoteNodeConfigIdentifier) ?? undefined;
    return {
      name: 'footnote',
      schema: FootNoteSchema.optional().nullable().catch(undefined),
      match: delta => {
        return !!delta.attributes?.footnote;
      },
      renderer: ({ delta }) => {
        return html`<yunke-footnote-node
          .delta=${delta}
          .std=${std}
          .config=${config}
        ></yunke-footnote-node>`;
      },
      embed: true,
    };
  });

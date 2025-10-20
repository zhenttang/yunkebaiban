import type { YunkeTextAttributes } from '@blocksuite/yunke-shared/types';
import { StdIdentifier } from '@blocksuite/std';
import { InlineSpecExtension } from '@blocksuite/std/inline';
import { html } from 'lit';
import { z } from 'zod';

export const MentionInlineSpecExtension =
  InlineSpecExtension<YunkeTextAttributes>('mention', provider => {
    const std = provider.get(StdIdentifier);
    return {
      name: 'mention',
      schema: z
        .object({
          member: z.string(),
          notification: z.string().optional(),
        })
        .optional()
        .nullable()
        .catch(undefined),
      match: delta => {
        return !!delta.attributes?.mention?.member;
      },
      renderer: ({ delta, selected }) => {
        return html`<yunke-mention
          .delta=${delta}
          .std=${std}
          .selected=${selected}
        ></yunke-mention>`;
      },
      embed: true,
    };
  });

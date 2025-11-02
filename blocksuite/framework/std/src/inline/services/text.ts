import type { BaseTextAttributes, DeltaInsert } from '@blocksuite/store';

import type { InlineEditor } from '../inline-editor.js';
import type { InlineRange } from '../types.js';
import { intersectInlineRange } from '../utils/inline-range.js';

export class InlineTextService<TextAttributes extends BaseTextAttributes> {
  deleteText = (inlineRange: InlineRange): void => {
    if (this.editor.isReadonly) return;

    this.transact(() => {
      this.yText.delete(inlineRange.index, inlineRange.length);
    });
  };

  formatText = (
    inlineRange: InlineRange,
    attributes: TextAttributes,
    options: {
      match?: (delta: DeltaInsert, deltaInlineRange: InlineRange) => boolean;
      mode?: 'replace' | 'merge';
    } = {}
  ): void => {
    if (this.editor.isReadonly) return;

    const { match = () => true, mode = 'merge' } = options;
    const deltas = this.editor.deltaService.getDeltasByInlineRange(inlineRange);

    deltas
      .filter(([delta, deltaInlineRange]) => match(delta, deltaInlineRange))
      .forEach(([_delta, deltaInlineRange]) => {
        const normalizedAttributes =
          this.editor.attributeService.normalizeAttributes(attributes);
        if (!normalizedAttributes) return;

        const targetInlineRange = intersectInlineRange(
          inlineRange,
          deltaInlineRange
        );
        if (!targetInlineRange) return;

        if (mode === 'replace') {
          this.resetText(targetInlineRange);
        }

        this.transact(() => {
          this.yText.format(
            targetInlineRange.index,
            targetInlineRange.length,
            normalizedAttributes
          );
        });
      });
  };

  insertLineBreak = (inlineRange: InlineRange): void => {
    if (this.editor.isReadonly) return;

    this.transact(() => {
      this.yText.delete(inlineRange.index, inlineRange.length);
      this.yText.insert(inlineRange.index, '\n');
    });
  };

  insertText = (
    inlineRange: InlineRange,
    text: string,
    attributes: TextAttributes = {} as TextAttributes
  ): void => {
    console.log('🔍 [Android调试] insertText 调用', {
      inlineRange,
      text,
      textLength: text.length,
      textCharCodes: Array.from(text).map(c => c.charCodeAt(0)),
      readonly: this.editor.isReadonly,
      yTextLengthBefore: this.yText.length,
      yTextStringBefore: this.yText.toString().substring(0, 50),
    });

    if (this.editor.isReadonly) {
      console.warn('⚠️ [Android调试] insertText 跳过：编辑器只读');
      return;
    }

    if (!text || !text.length) {
      console.warn('⚠️ [Android调试] insertText 跳过：文本为空');
      return;
    }

    if (this.editor.attributeService.marks) {
      attributes = { ...attributes, ...this.editor.attributeService.marks };
    }
    const normalizedAttributes =
      this.editor.attributeService.normalizeAttributes(attributes);

    console.log('🔍 [Android调试] insertText 执行 transact', {
      deleteIndex: inlineRange.index,
      deleteLength: inlineRange.length,
      insertIndex: inlineRange.index,
      insertText: text,
      normalizedAttributes,
    });

    this.transact(() => {
      this.yText.delete(inlineRange.index, inlineRange.length);
      this.yText.insert(inlineRange.index, text, normalizedAttributes);
    });

    console.log('✅ [Android调试] insertText 完成', {
      yTextLengthAfter: this.yText.length,
      yTextStringAfter: this.yText.toString().substring(0, 50),
      textInserted: this.yText.toString().includes(text),
    });
  };

  resetText = (inlineRange: InlineRange): void => {
    if (this.editor.isReadonly) return;

    const coverDeltas: DeltaInsert[] = [];
    for (
      let i = inlineRange.index;
      i <= inlineRange.index + inlineRange.length;
      i++
    ) {
      const delta = this.editor.getDeltaByRangeIndex(i);
      if (delta) {
        coverDeltas.push(delta);
      }
    }

    const unset = Object.fromEntries(
      coverDeltas.flatMap(delta =>
        delta.attributes
          ? Object.keys(delta.attributes).map(key => [key, null])
          : []
      )
    );

    this.transact(() => {
      this.yText.format(inlineRange.index, inlineRange.length, {
        ...unset,
      });
    });
  };

  setText = (
    text: string,
    attributes: TextAttributes = {} as TextAttributes
  ): void => {
    if (this.editor.isReadonly) return;

    this.transact(() => {
      this.yText.delete(0, this.yText.length);
      this.yText.insert(0, text, attributes);
    });
  };

  readonly transact = this.editor.transact;

  get yText() {
    return this.editor.yText;
  }

  constructor(readonly editor: InlineEditor<TextAttributes>) {}
}

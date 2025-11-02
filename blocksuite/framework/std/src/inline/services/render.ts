import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import type { BaseTextAttributes } from '@blocksuite/store';
import { html, render } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import * as Y from 'yjs';

import type { VLine } from '../components/v-line.js';
import type { InlineEditor } from '../inline-editor.js';
import type { InlineRange } from '../types.js';
import { deltaInsertsToChunks } from '../utils/delta-convert.js';

export class RenderService<TextAttributes extends BaseTextAttributes> {
  private readonly _onYTextChange = (
    _: Y.YTextEvent,
    transaction: Y.Transaction
  ) => {
    console.log('🔍 [Android调试] yText 变化触发', {
      yTextLength: this.editor.yText.length,
      yTextString: this.editor.yText.toString().substring(0, 50),
      isLocal: transaction.local,
    });

    this.editor.slots.textChange.next();

    const yText = this.editor.yText;

    if (yText.toString().includes('\r')) {
      throw new BlockSuiteError(
        ErrorCode.InlineEditorError,
        'yText must not contain "\\r" because it will break the range synchronization'
      );
    }

    console.log('🔍 [Android调试] 调用 render');
    this.render();

    const inlineRange = this.editor.inlineRange$.peek();
    if (!inlineRange || transaction.local) return;

    const lastStartRelativePosition = this.editor.lastStartRelativePosition;
    const lastEndRelativePosition = this.editor.lastEndRelativePosition;
    if (!lastStartRelativePosition || !lastEndRelativePosition) return;

    const doc = this.editor.yText.doc;
    if (!doc) {
      console.error('同步yText时未找到文档');
      return;
    }
    const absoluteStart = Y.createAbsolutePositionFromRelativePosition(
      lastStartRelativePosition,
      doc
    );
    const absoluteEnd = Y.createAbsolutePositionFromRelativePosition(
      lastEndRelativePosition,
      doc
    );

    const startIndex = absoluteStart?.index;
    const endIndex = absoluteEnd?.index;
    if (!startIndex || !endIndex) return;

    const newInlineRange: InlineRange = {
      index: startIndex,
      length: endIndex - startIndex,
    };
    if (!this.editor.isValidInlineRange(newInlineRange)) return;

    this.editor.setInlineRange(newInlineRange);
    this.editor.syncInlineRange();
  };

  mount = () => {
    const editor = this.editor;
    const yText = editor.yText;

    yText.observe(this._onYTextChange);
    editor.disposables.add({
      dispose: () => {
        yText.unobserve(this._onYTextChange);
      },
    });
  };

  private _rendering = false;
  get rendering() {
    return this._rendering;
  }
  // render current deltas to VLines
  render = () => {
    if (!this.editor.rootElement) {
      console.warn('⚠️ [Android调试] render 跳过：rootElement 不存在');
      return;
    }

    console.log('🔍 [Android调试] render 开始', {
      yTextLength: this.editor.yText.length,
      yTextString: this.editor.yText.toString().substring(0, 50),
      rootElementFontFamily: window.getComputedStyle(this.editor.rootElement).fontFamily,
      rootElementFontSize: window.getComputedStyle(this.editor.rootElement).fontSize,
    });

    this._rendering = true;

    const rootElement = this.editor.rootElement;
    const embedDeltas = this.editor.deltaService.embedDeltas;
    const chunks = deltaInsertsToChunks(embedDeltas);

    console.log('🔍 [Android调试] render 处理 chunks', {
      chunksCount: chunks.length,
      chunks: chunks.map((chunk, i) => ({
        lineIndex: i,
        deltasCount: chunk.length,
        text: chunk.map(d => d.insert).join('').substring(0, 30),
      })),
    });

    let deltaIndex = 0;
    // every chunk is a line
    const lines = chunks.map((chunk, lineIndex) => {
      if (lineIndex > 0) {
        deltaIndex += 1; // for '\n'
      }

      const lineStartOffset = deltaIndex;
      if (chunk.length > 0) {
        const elements: VLine['elements'] = chunk.map(delta => {
          const startOffset = deltaIndex;
          deltaIndex += delta.insert.length;
          const endOffset = deltaIndex;

          return [
            html`<v-element
              .inlineEditor=${this.editor}
              .delta=${{
                insert: delta.insert,
                attributes: this.editor.attributeService.normalizeAttributes(
                  delta.attributes
                ),
              }}
              .startOffset=${startOffset}
              .endOffset=${endOffset}
              .lineIndex=${lineIndex}
            ></v-element>`,
            delta,
          ];
        });

        return html`<v-line
          .elements=${elements}
          .index=${lineIndex}
          .startOffset=${lineStartOffset}
          .endOffset=${deltaIndex}
        ></v-line>`;
      } else {
        return html`<v-line
          .elements=${[]}
          .index=${lineIndex}
          .startOffset=${lineStartOffset}
          .endOffset=${deltaIndex}
        ></v-line>`;
      }
    });

    console.log('🔍 [Android调试] render 准备渲染到 DOM', {
      linesCount: lines.length,
      rootElementTagName: rootElement.tagName,
    });

    try {
      render(
        repeat(
          lines.map((line, i) => ({ line, index: i })),
          entry => entry.index,
          entry => entry.line
        ),
        rootElement
      );

      // 🔍 渲染后检查 DOM
      setTimeout(() => {
        const domText = rootElement.textContent || '';
        console.log('🔍 [Android调试] render 完成，DOM 检查（延迟50ms）', {
          domTextLength: domText.length,
          domText: domText.substring(0, 50),
          rootElementFontFamily: window.getComputedStyle(rootElement).fontFamily,
          rootElementFontSize: window.getComputedStyle(rootElement).fontSize,
          rootElementColor: window.getComputedStyle(rootElement).color,
          rootElementDisplay: window.getComputedStyle(rootElement).display,
          rootElementVisibility: window.getComputedStyle(rootElement).visibility,
        });

        // 检查是否有中文字符
        const chineseChars = domText.match(/[\u4e00-\u9fff]/g);
        if (chineseChars) {
          console.log('✅ [Android调试] DOM 中发现中文字符', {
            chineseChars: chineseChars.slice(0, 10),
            count: chineseChars.length,
          });
        } else {
          console.warn('⚠️ [Android调试] DOM 中未发现中文字符');
        }
      }, 50);
    } catch (error) {
      console.error('❌ [Android调试] render 失败:', error);
      // Lit may be crashed by IME input and we need to rerender whole editor for it
      this.editor.rerenderWholeEditor();
    }

    this.editor
      .waitForUpdate()
      .then(() => {
        this._rendering = false;
        this.editor.slots.renderComplete.next();
        this.editor.syncInlineRange();
      })
      .catch(console.error);
  };

  rerenderWholeEditor = () => {
    const rootElement = this.editor.rootElement;

    if (!rootElement || !rootElement.isConnected) return;

    rootElement.replaceChildren();
    // Because we bypassed Lit and disrupted the DOM structure, this will cause an inconsistency in the original state of `ChildPart`.
    // Therefore, we need to remove the original `ChildPart`.
    // https://github.com/lit/lit/blob/a2cd76cfdea4ed717362bb1db32710d70550469d/packages/lit-html/src/lit-html.ts#L2248

    delete (rootElement as any)['_$litPart$'];
    this.render();
  };

  waitForUpdate = async () => {
    if (!this.editor.rootElement) return;
    const vLines = Array.from(
      this.editor.rootElement.querySelectorAll('v-line')
    );
    await Promise.all(vLines.map(line => line.updateComplete));
  };

  constructor(readonly editor: InlineEditor<TextAttributes>) {}
}

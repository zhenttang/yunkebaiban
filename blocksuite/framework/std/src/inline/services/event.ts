import type { BaseTextAttributes } from '@blocksuite/store';

import type { InlineEditor } from '../inline-editor.js';
import type { InlineRange } from '../types.js';
import {
  isInEmbedElement,
  isInEmbedGap,
  isInEmptyLine,
} from '../utils/index.js';
import { isMaybeInlineRangeEqual } from '../utils/inline-range.js';
import { transformInput } from '../utils/transform-input.js';
import type { BeforeinputHookCtx, CompositionEndHookCtx } from './hook.js';

export class EventService<TextAttributes extends BaseTextAttributes> {
  private _compositionInlineRange: InlineRange | null = null;

  private _isComposing = false;

  // 🔧 修复 Bug #3: Android 输入重复检测 - 追踪最近一次输入
  private _lastAndroidInput: {
    data: string;
    position: number;
    timestamp: number;
  } | null = null;

  private readonly _isRangeCompletelyInRoot = (range: Range) => {
    if (range.commonAncestorContainer.ownerDocument !== document) return false;

    const rootElement = this.editor.rootElement;
    if (!rootElement) return false;

    const rootRange = document.createRange();
    rootRange.selectNode(rootElement);

    if (
      range.startContainer.compareDocumentPosition(range.endContainer) &
      Node.DOCUMENT_POSITION_FOLLOWING
    ) {
      return (
        rootRange.comparePoint(range.startContainer, range.startOffset) >= 0 &&
        rootRange.comparePoint(range.endContainer, range.endOffset) <= 0
      );
    } else {
      return (
        rootRange.comparePoint(range.endContainer, range.startOffset) >= 0 &&
        rootRange.comparePoint(range.startContainer, range.endOffset) <= 0
      );
    }
  };

  private readonly _onBeforeInput = (event: InputEvent) => {
    const range = this.editor.rangeService.getNativeRange();

    if (
      this.editor.isReadonly ||
      this._isComposing ||
      !range ||
      !this._isRangeCompletelyInRoot(range)
    ) {
      return;
    }

    let inlineRange = this.editor.toInlineRange(range);
    if (!inlineRange) {
      return;
    }

    let ifHandleTargetRange = true;

    if (event.inputType.startsWith('delete')) {
      if (
        isInEmbedGap(range.commonAncestorContainer) &&
        inlineRange.length === 0 &&
        inlineRange.index > 0
      ) {
        inlineRange = {
          index: inlineRange.index - 1,
          length: 1,
        };
        ifHandleTargetRange = false;
      } else if (
        isInEmptyLine(range.commonAncestorContainer) &&
        inlineRange.length === 0 &&
        inlineRange.index > 0
        // eslint-disable-next-line sonarjs/no-duplicated-branches
      ) {
        // do not use target range when deleting across lines
        // https://github.com/toeverything/blocksuite/issues/5381
        inlineRange = {
          index: inlineRange.index - 1,
          length: 1,
        };
        ifHandleTargetRange = false;
      }
    }

    if (ifHandleTargetRange) {
      const targetRanges = event.getTargetRanges();
      if (targetRanges.length > 0) {
        const staticRange = targetRanges[0];
        const range = document.createRange();
        range.setStart(staticRange.startContainer, staticRange.startOffset);
        range.setEnd(staticRange.endContainer, staticRange.endOffset);
        const targetInlineRange = this.editor.toInlineRange(range);

        if (!isMaybeInlineRangeEqual(inlineRange, targetInlineRange)) {
          inlineRange = targetInlineRange;
        }
      }
    }

    if (!inlineRange) return;

    event.preventDefault();

    // 🔧 Android WebView 修复：多途径获取文本数据
    // Android WebView 中，inputMode="text" 时 event.data 可能为空
    // 注意：如果 event.data 为空，我们仍然会调用 transformInput，但不会插入文本
    // 作为补充，我们在 mount 方法中添加了 input 事件监听来捕获这些情况
    let inputData = event.data ?? event.dataTransfer?.getData('text/plain') ?? null;

    const ctx: BeforeinputHookCtx<TextAttributes> = {
      inlineEditor: this.editor,
      raw: event,
      inlineRange,
      data: inputData,
      attributes: {} as TextAttributes,
    };
    this.editor.hooks.beforeinput?.(ctx);

    transformInput<TextAttributes>(
      ctx.raw.inputType,
      ctx.data,
      ctx.attributes,
      ctx.inlineRange,
      this.editor as never
    );

    this.editor.slots.inputting.next();
  };

  private readonly _onClick = (event: MouseEvent) => {
    // select embed element when click on it
    if (event.target instanceof Node && isInEmbedElement(event.target)) {
      const selection = document.getSelection();
      if (!selection) return;
      if (event.target instanceof HTMLElement) {
        const vElement = event.target.closest('v-element');
        if (vElement) {
          selection.selectAllChildren(vElement);
        }
      } else {
        const vElement = event.target.parentElement?.closest('v-element');
        if (vElement) {
          selection.selectAllChildren(vElement);
        }
      }
    }
  };

  private readonly _onCompositionEnd = async (event: CompositionEvent) => {
    this._isComposing = false;
    if (!this.editor.rootElement || !this.editor.rootElement.isConnected) {
      return;
    }

    const range = this.editor.rangeService.getNativeRange();

    if (
      this.editor.isReadonly ||
      !range ||
      !this._isRangeCompletelyInRoot(range)
    )
      return;

    // 🔧 Android WebView 修复：在 rerender 之前保存更多信息
    let inlineRange = this._compositionInlineRange;

    if (!inlineRange) {
      // 尝试从当前 range 重新获取
      const fallbackInlineRange = this.editor.toInlineRange(range);
      if (fallbackInlineRange) {
        inlineRange = fallbackInlineRange;
      } else {
        return;
      }
    }

    // 🔧 Android WebView 修复：多途径获取文本
    // Android WebView 中，compositionend 事件的 event.data 可能为空
    let compositionText = event.data;

    // 如果 event.data 为空（Android WebView 常见问题）
    if (!compositionText || compositionText.length === 0) {
      // 方法1: 从 range 中读取文本
      try {
        const textNode = range.startContainer;

        if (textNode.nodeType === Node.TEXT_NODE) {
          const textContent = textNode.textContent || '';
          const startOffset = range.startOffset;
          const endOffset = range.endOffset;

          // 如果 range 有选中文本，可能是替换
          if (endOffset > startOffset) {
            compositionText = textContent.substring(startOffset, endOffset);
          }
        }
      } catch (e) {
        // 忽略错误
      }

      // 方法2: 从 selection 中读取（最后的备选）
      if (!compositionText || compositionText.length === 0) {
        try {
          const selection = window.getSelection();

          if (selection && selection.rangeCount > 0) {
            const selectedText = selection.toString();

            // 如果选中了文本，可能是替换操作
            if (selectedText && selectedText.length > 0 && selectedText.length < 100) {
              compositionText = selectedText;
            }
          }
        } catch (e) {
          // 忽略错误
        }
      }
    }

    this.editor.rerenderWholeEditor();
    await this.editor.waitForUpdate();

    // 🔧 重新获取 range（可能在 rerender 后改变）
    const currentRange = this.editor.rangeService.getNativeRange();
    let finalInlineRange = inlineRange;

    if (currentRange) {
      const currentInlineRange = this.editor.toInlineRange(currentRange);
      if (currentInlineRange) {
        finalInlineRange = currentInlineRange;
      }
    }

    if (!finalInlineRange) return;

    event.preventDefault();

    const ctx: CompositionEndHookCtx<TextAttributes> = {
      inlineEditor: this.editor,
      raw: event,
      inlineRange: finalInlineRange,
      data: compositionText,
      attributes: {} as TextAttributes,
    };
    this.editor.hooks.compositionEnd?.(ctx);

    const { inlineRange: newInlineRange, data: newData } = ctx;

    // 🔧 确保有数据才插入
    if (newData && newData.length > 0) {
      this.editor.insertText(newInlineRange, newData, ctx.attributes);

      this.editor.setInlineRange({
        index: newInlineRange.index + newData.length,
        length: 0,
      });
    }

    this.editor.slots.inputting.next();
  };

  private readonly _onCompositionStart = () => {
    this._isComposing = true;
    if (!this.editor.rootElement) {
      return;
    }
    
    // embeds is not editable and it will break IME
    const embeds = this.editor.rootElement.querySelectorAll(
      '[data-v-embed="true"]'
    );
    embeds.forEach(embed => {
      embed.removeAttribute('contenteditable');
    });

    const range = this.editor.rangeService.getNativeRange();

    if (range) {
      this._compositionInlineRange = this.editor.toInlineRange(range);
    } else {
      this._compositionInlineRange = null;
    }
  };

  private readonly _onCompositionUpdate = () => {
    if (!this.editor.rootElement || !this.editor.rootElement.isConnected) {
      return;
    }

    const range = this.editor.rangeService.getNativeRange();
    if (
      this.editor.isReadonly ||
      !range ||
      !this._isRangeCompletelyInRoot(range)
    )
      return;

    this.editor.slots.inputting.next();
  };

  private readonly _onKeyDown = (event: KeyboardEvent) => {
    const inlineRange = this.editor.getInlineRange();
    if (!inlineRange) return;

    this.editor.slots.keydown.next(event);

    if (
      !event.shiftKey &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      if (inlineRange.length !== 0) return;

      const prevent = () => {
        event.preventDefault();
        event.stopPropagation();
      };

      const deltas = this.editor.getDeltasByInlineRange(inlineRange);
      if (deltas.length === 2) {
        if (event.key === 'ArrowLeft' && this.editor.isEmbed(deltas[0][0])) {
          prevent();
          this.editor.setInlineRange({
            index: inlineRange.index - 1,
            length: 1,
          });
        } else if (
          event.key === 'ArrowRight' &&
          this.editor.isEmbed(deltas[1][0])
        ) {
          prevent();
          this.editor.setInlineRange({
            index: inlineRange.index,
            length: 1,
          });
        }
      } else if (deltas.length === 1) {
        const delta = deltas[0][0];
        if (this.editor.isEmbed(delta)) {
          if (event.key === 'ArrowLeft' && inlineRange.index - 1 >= 0) {
            prevent();
            this.editor.setInlineRange({
              index: inlineRange.index - 1,
              length: 1,
            });
          } else if (
            event.key === 'ArrowRight' &&
            inlineRange.index + 1 <= this.editor.yTextLength
          ) {
            prevent();
            this.editor.setInlineRange({
              index: inlineRange.index,
              length: 1,
            });
          }
        }
      }
    }
  };

  private readonly _onSelectionChange = () => {
    const rootElement = this.editor.rootElement;
    if (!rootElement) return;

    const previousInlineRange = this.editor.getInlineRange();
    if (this._isComposing) {
      return;
    }

    const selection = document.getSelection();
    if (!selection) return;
    if (selection.rangeCount === 0) {
      if (previousInlineRange !== null) {
        this.editor.setInlineRange(null);
      }

      return;
    }

    const range = selection.getRangeAt(0);
    if (!range.intersectsNode(rootElement)) {
      const isContainerSelected =
        range.endContainer.contains(rootElement) &&
        Array.from(range.endContainer.childNodes).filter(
          node => node instanceof HTMLElement
        ).length === 1 &&
        range.startContainer.contains(rootElement) &&
        Array.from(range.startContainer.childNodes).filter(
          node => node instanceof HTMLElement
        ).length === 1;
      if (isContainerSelected) {
        this.editor.focusEnd();
        return;
      } else {
        if (previousInlineRange !== null) {
          this.editor.setInlineRange(null);
        }
        return;
      }
    }

    const inlineRange = this.editor.toInlineRange(selection.getRangeAt(0));
    if (!isMaybeInlineRangeEqual(previousInlineRange, inlineRange)) {
      this.editor.rangeService.lockSyncInlineRange();
      this.editor.setInlineRange(inlineRange);
      this.editor.rangeService.unlockSyncInlineRange();
    }
  };

  mount = () => {
    const eventSource = this.editor.eventSource;
    const rootElement = this.editor.rootElement;

    if (!this.editor.inlineRangeProviderOverride) {
      this.editor.disposables.addFromEvent(
        document,
        'selectionchange',
        this._onSelectionChange
      );
    }

    if (!eventSource) {
      return;
    }

    this.editor.disposables.addFromEvent(
      eventSource,
      'beforeinput',
      this._onBeforeInput
    );
    this.editor.disposables.addFromEvent(
      eventSource,
      'compositionstart',
      this._onCompositionStart
    );
    this.editor.disposables.addFromEvent(
      eventSource,
      'compositionupdate',
      this._onCompositionUpdate
    );
    this.editor.disposables.addFromEvent(
      eventSource,
      'compositionend',
      (event: CompositionEvent) => {
        this._onCompositionEnd(event).catch(console.error);
      }
    );
    this.editor.disposables.addFromEvent(
      eventSource,
      'keydown',
      this._onKeyDown
    );
    // 🔧 Android WebView 修复：添加 input 事件监听作为补充
    // Android WebView 中，input 事件的 event.data 可能比 beforeinput 更可靠
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      this.editor.disposables.addFromEvent(
        eventSource,
        'input',
        (event: Event) => {
          // 只有在非 composing 状态下才处理
          // 因为 composing 状态下应该由 compositionend 处理
          if (!this._isComposing && event instanceof InputEvent) {
            const range = this.editor.rangeService.getNativeRange();
            if (
              !this.editor.isReadonly &&
              range &&
              this._isRangeCompletelyInRoot(range) &&
              event.inputType === 'insertText'
            ) {
              // 检查是否有数据
              if (event.data && event.data.length > 0) {
                const inlineRange = this.editor.toInlineRange(range);
                if (inlineRange) {
                  // 🔧 修复 Bug #3: 使用时间戳和位置精确判断重复,而不是 includes()
                  // 旧逻辑: beforeText.includes(event.data) 会误删合法的连续相同字符
                  // 新逻辑: 检查是否是极短时间内(<100ms)在相同位置输入相同内容的重复事件
                  const now = Date.now();
                  const currentPosition = inlineRange.index;
                  const inputData = event.data;

                  const isDuplicate =
                    this._lastAndroidInput &&
                    this._lastAndroidInput.data === inputData &&
                    this._lastAndroidInput.position === currentPosition &&
                    now - this._lastAndroidInput.timestamp < 100;

                  if (!isDuplicate) {
                    this.editor.insertText(inlineRange, event.data, {} as TextAttributes);
                    this.editor.setInlineRange({
                      index: inlineRange.index + event.data.length,
                      length: 0,
                    });

                    // 记录本次输入,用于下次重复检测
                    this._lastAndroidInput = {
                      data: inputData,
                      position: currentPosition,
                      timestamp: now,
                    };
                  }
                }
              }
            }
          }
        }
      );
    }
    if (rootElement) {
      this.editor.disposables.addFromEvent(rootElement, 'click', this._onClick);
    }
  };

  get isComposing() {
    return this._isComposing;
  }

  constructor(readonly editor: InlineEditor<TextAttributes>) {}
}

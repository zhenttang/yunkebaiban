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
    console.log('🔍 [Android调试] beforeinput 事件触发', {
      inputType: event.inputType,
      data: event.data,
      isComposing: this._isComposing,
      timestamp: Date.now(),
    });

    const range = this.editor.rangeService.getNativeRange();
    console.log('🔍 [Android调试] beforeinput range 检查', {
      hasRange: !!range,
      readonly: this.editor.isReadonly,
      isComposing: this._isComposing,
      rangeInRoot: range ? this._isRangeCompletelyInRoot(range) : false,
    });

    if (
      this.editor.isReadonly ||
      this._isComposing ||
      !range ||
      !this._isRangeCompletelyInRoot(range)
    ) {
      console.warn('⚠️ [Android调试] beforeinput 跳过', {
        readonly: this.editor.isReadonly,
        isComposing: this._isComposing,
        hasRange: !!range,
        rangeInRoot: range ? this._isRangeCompletelyInRoot(range) : false,
      });
      return;
    }

    let inlineRange = this.editor.toInlineRange(range);
    if (!inlineRange) {
      console.warn('⚠️ [Android调试] beforeinput 无法转换 inlineRange');
      return;
    }

    console.log('🔍 [Android调试] beforeinput 继续处理', {
      inlineRange,
      inputType: event.inputType,
      data: event.data,
    });

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

    console.log('✅ [Android调试] beforeinput 准备插入', {
      inputData,
      inlineRange,
      inputType: event.inputType,
    });

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

    console.log('✅ [Android调试] beforeinput 处理完成');

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
    console.log('🔍 [Android调试] compositionend 开始', {
      eventData: event.data,
      eventType: event.type,
      isComposing: this._isComposing,
    });

    this._isComposing = false;
    if (!this.editor.rootElement || !this.editor.rootElement.isConnected) {
      console.warn('⚠️ [Android调试] compositionend 跳过：rootElement 不存在或未连接');
      return;
    }

    const range = this.editor.rangeService.getNativeRange();
    console.log('🔍 [Android调试] compositionend range 检查', {
      hasRange: !!range,
      readonly: this.editor.isReadonly,
      rangeInRoot: range ? this._isRangeCompletelyInRoot(range) : false,
    });

    if (
      this.editor.isReadonly ||
      !range ||
      !this._isRangeCompletelyInRoot(range)
    )
      return;

    // 🔧 Android WebView 修复：在 rerender 之前保存更多信息
    let inlineRange = this._compositionInlineRange;
    console.log('🔍 [Android调试] compositionend inlineRange 检查', {
      hasSavedRange: !!this._compositionInlineRange,
      savedRange: this._compositionInlineRange,
    });

    if (!inlineRange) {
      // 尝试从当前 range 重新获取
      const fallbackInlineRange = this.editor.toInlineRange(range);
      console.log('🔍 [Android调试] compositionend fallback inlineRange', {
        fallbackRange: fallbackInlineRange,
      });
      if (fallbackInlineRange) {
        inlineRange = fallbackInlineRange;
      } else {
        console.warn('⚠️ [Android调试] compositionend 跳过：无法获取 inlineRange');
        return;
      }
    }

    // 🔧 Android WebView 修复：多途径获取文本
    // Android WebView 中，compositionend 事件的 event.data 可能为空
    let compositionText = event.data;
    console.log('🔍 [Android调试] compositionend 文本获取 - 初始', {
      eventData: event.data,
      eventDataLength: event.data?.length,
      eventDataType: typeof event.data,
    });

    // 如果 event.data 为空（Android WebView 常见问题）
    if (!compositionText || compositionText.length === 0) {
      console.log('⚠️ [Android调试] compositionend event.data 为空，尝试其他方法获取文本');
      
      // 方法1: 从 range 中读取文本
      try {
        const textNode = range.startContainer;
        console.log('🔍 [Android调试] compositionend 尝试从 range 读取文本', {
          nodeType: textNode.nodeType,
          isTextNode: textNode.nodeType === Node.TEXT_NODE,
        });

        if (textNode.nodeType === Node.TEXT_NODE) {
          const textContent = textNode.textContent || '';
          const startOffset = range.startOffset;
          const endOffset = range.endOffset;
          console.log('🔍 [Android调试] compositionend range 文本内容', {
            textContentLength: textContent.length,
            startOffset,
            endOffset,
            hasSelection: endOffset > startOffset,
            textContent: textContent.substring(Math.max(0, startOffset - 10), Math.min(textContent.length, endOffset + 10)),
          });

          // 如果 range 有选中文本，可能是替换
          if (endOffset > startOffset) {
            compositionText = textContent.substring(startOffset, endOffset);
            console.log('✅ [Android调试] compositionend 从 range 选中文本获取:', compositionText);
          } else {
            // 尝试读取光标位置附近的文本（可能是刚输入的）
            // 检查光标位置是否有新文本
            const afterText = textContent.substring(startOffset);
            // 如果光标后有文本，可能是刚输入的
            if (afterText.length > 0 && afterText.length <= 50) {
              // 但这样不准确，优先使用 event.data
              console.log('🔍 [Android调试] compositionend 光标后文本:', afterText.substring(0, 20));
            }
          }
        }
      } catch (e) {
        console.error('❌ [Android调试] compositionend 从 range 读取文本失败:', e);
      }

      // 方法2: 从 selection 中读取（最后的备选）
      if (!compositionText || compositionText.length === 0) {
        try {
          const selection = window.getSelection();
          console.log('🔍 [Android调试] compositionend 尝试从 selection 读取文本', {
            hasSelection: !!selection,
            rangeCount: selection?.rangeCount || 0,
          });

          if (selection && selection.rangeCount > 0) {
            const selectedText = selection.toString();
            console.log('🔍 [Android调试] compositionend selection 文本', {
              selectedText,
              selectedTextLength: selectedText.length,
            });

            // 如果选中了文本，可能是替换操作
            if (selectedText && selectedText.length > 0 && selectedText.length < 100) {
              compositionText = selectedText;
              console.log('✅ [Android调试] compositionend 从 selection 获取:', compositionText);
            }
          }
        } catch (e) {
          console.error('❌ [Android调试] compositionend 从 selection 读取文本失败:', e);
        }
      }
    }

    console.log('🔍 [Android调试] compositionend 最终获取的文本', {
      compositionText,
      compositionTextLength: compositionText?.length,
      compositionTextCharCodes: compositionText ? Array.from(compositionText).map(c => c.charCodeAt(0)) : null,
    });

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
    console.log('🔍 [Android调试] compositionend 准备插入文本', {
      hasNewData: !!newData,
      newDataLength: newData?.length,
      newData: newData,
      newInlineRange,
      yTextLengthBefore: this.editor.yTextLength,
      yTextStringBefore: this.editor.yTextString.substring(0, 50),
    });

    if (newData && newData.length > 0) {
      console.log('✅ [Android调试] compositionend 调用 insertText', {
        inlineRange: newInlineRange,
        text: newData,
        textLength: newData.length,
        attributes: ctx.attributes,
      });

      this.editor.insertText(newInlineRange, newData, ctx.attributes);

      console.log('🔍 [Android调试] compositionend insertText 后', {
        yTextLengthAfter: this.editor.yTextLength,
        yTextStringAfter: this.editor.yTextString.substring(0, 50),
        textInserted: this.editor.yTextString.includes(newData),
      });

      this.editor.setInlineRange({
        index: newInlineRange.index + newData.length,
        length: 0,
      });

      console.log('🔍 [Android调试] compositionend 设置光标位置', {
        index: newInlineRange.index + newData.length,
      });

      // 🔍 检查 DOM 是否已更新
      setTimeout(() => {
        const rootElement = this.editor.rootElement;
        if (rootElement) {
          const domText = rootElement.textContent || '';
          console.log('🔍 [Android调试] compositionend DOM 检查（延迟100ms）', {
            domTextLength: domText.length,
            domText: domText.substring(0, 50),
            textInDOM: domText.includes(newData),
            rootElementFontFamily: window.getComputedStyle(rootElement).fontFamily,
            rootElementFontSize: window.getComputedStyle(rootElement).fontSize,
          });
        }
      }, 100);
    } else {
      // 🔧 如果还是没有数据，记录警告
      console.error(
        '❌ [Android调试] compositionend 事件中没有文本数据，无法插入',
        {
          eventData: event.data,
          compositionText,
          range: currentRange,
          inlineRange: finalInlineRange,
          ctxData: ctx.data,
          newData,
        }
      );
    }

    this.editor.slots.inputting.next();
  };

  private readonly _onCompositionStart = () => {
    console.log('🔍 [Android调试] compositionstart 开始');
    this._isComposing = true;
    if (!this.editor.rootElement) {
      console.warn('⚠️ [Android调试] compositionstart 跳过：rootElement 不存在');
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
    console.log('🔍 [Android调试] compositionstart range 信息', {
      hasRange: !!range,
      range: range ? {
        startContainer: range.startContainer.nodeType,
        startOffset: range.startOffset,
        endOffset: range.endOffset,
      } : null,
    });

    if (range) {
      this._compositionInlineRange = this.editor.toInlineRange(range);
      console.log('🔍 [Android调试] compositionstart 保存 inlineRange', {
        inlineRange: this._compositionInlineRange,
      });
    } else {
      this._compositionInlineRange = null;
      console.warn('⚠️ [Android调试] compositionstart 无法获取 range');
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

    console.log('🔍 [Android调试] EventService mount 开始', {
      hasEventSource: !!eventSource,
      hasRootElement: !!rootElement,
      eventSourceTagName: eventSource?.tagName,
      rootElementTagName: rootElement?.tagName,
      eventSourceId: eventSource?.id,
      rootElementId: rootElement?.id,
      eventSourceClass: eventSource?.className,
      rootElementClass: rootElement?.className,
    });

    // 🔍 全局事件监听 - 检查是否有其他代码拦截事件
    const globalDebugListener = (event: Event) => {
      // 只记录输入相关事件
      if (['keydown', 'keypress', 'beforeinput', 'input', 'compositionstart', 'compositionend'].includes(event.type)) {
        const target = event.target as HTMLElement;
        const isInEventSource = eventSource && (eventSource === target || eventSource.contains(target));
        const isInRootElement = rootElement && (rootElement === target || rootElement.contains(target));
        
        console.log(`🔍 [Android调试] 全局事件捕获 [${event.type}]`, {
          target: target?.tagName,
          targetId: target?.id,
          targetClass: target?.className,
          isInEventSource,
          isInRootElement,
          currentTarget: (event.currentTarget as HTMLElement)?.tagName,
          bubbles: event.bubbles,
          cancelable: event.cancelable,
          defaultPrevented: event.defaultPrevented,
          stopPropagation: 'N/A',
        });
      }
    };

    // 在 document 上添加全局监听（捕获阶段）
    document.addEventListener('keydown', globalDebugListener, true);
    document.addEventListener('keypress', globalDebugListener, true);
    document.addEventListener('beforeinput', globalDebugListener, true);
    document.addEventListener('input', globalDebugListener, true);
    document.addEventListener('compositionstart', globalDebugListener, true);
    document.addEventListener('compositionend', globalDebugListener, true);

    // 清理函数
    this.editor.disposables.add(() => {
      document.removeEventListener('keydown', globalDebugListener, true);
      document.removeEventListener('keypress', globalDebugListener, true);
      document.removeEventListener('beforeinput', globalDebugListener, true);
      document.removeEventListener('input', globalDebugListener, true);
      document.removeEventListener('compositionstart', globalDebugListener, true);
      document.removeEventListener('compositionend', globalDebugListener, true);
    });

    if (!this.editor.inlineRangeProviderOverride) {
      this.editor.disposables.addFromEvent(
        document,
        'selectionchange',
        this._onSelectionChange
      );
    }

    if (!eventSource) {
      console.error('❌ [Android调试] Mount inline editor without event source ready');
      return;
    }
    
    console.log('✅ [Android调试] EventService mount 成功，事件监听器已绑定');
    console.log('🔍 [Android调试] eventSource 详细信息:', {
      tagName: eventSource.tagName,
      id: eventSource.id,
      className: eventSource.className,
      contentEditable: eventSource.contentEditable,
      inputMode: (eventSource as HTMLElement).inputMode,
      isConnected: eventSource.isConnected,
      parentElement: eventSource.parentElement?.tagName,
    });

    // 🔍 添加全局测试函数，方便在控制台测试
    (window as any).__testInputEvents = () => {
      console.log('🧪 [Android调试测试] 手动测试输入事件');
      const eventSource = this.editor.eventSource;
      const rootElement = this.editor.rootElement;
      console.log('🧪 [Android调试测试] eventSource:', eventSource);
      console.log('🧪 [Android调试测试] rootElement:', rootElement);
      console.log('🧪 [Android调试测试] contentEditable:', rootElement?.contentEditable);
      console.log('🧪 [Android调试测试] inputMode:', rootElement?.inputMode);
      
      // 手动触发测试事件
      if (eventSource) {
        const testEvent = new InputEvent('beforeinput', {
          inputType: 'insertText',
          data: '测试',
          bubbles: true,
          cancelable: true,
        });
        eventSource.dispatchEvent(testEvent);
      }
    };

    // 🔍 监听所有输入相关事件，用于调试
    const debugListener = (event: Event) => {
      console.log('🔍 [Android调试] 原生事件监听:', {
        type: event.type,
        target: event.target,
        currentTarget: event.currentTarget,
        event,
      });
    };

    // 添加调试监听器（仅在开发环境）
    if (eventSource) {
      console.log('🔍 [Android调试] 绑定事件监听器到 eventSource');
      
      eventSource.addEventListener('keydown', debugListener, true);
      eventSource.addEventListener('keyup', debugListener, true);
      eventSource.addEventListener('keypress', debugListener, true);
      eventSource.addEventListener('input', debugListener, true);
      eventSource.addEventListener('beforeinput', debugListener, true);
      eventSource.addEventListener('compositionstart', debugListener, true);
      eventSource.addEventListener('compositionupdate', debugListener, true);
      eventSource.addEventListener('compositionend', debugListener, true);
      
      console.log('✅ [Android调试] 调试监听器已绑定');
    } else {
      console.error('❌ [Android调试] eventSource 不存在，无法绑定调试监听器');
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
                  // 检查是否已经有这个文本（避免重复插入）
                  const currentText = this.editor.yTextString;
                  const beforeText = currentText.substring(
                    Math.max(0, inlineRange.index - event.data.length),
                    inlineRange.index
                  );

                  // 如果刚插入的文本不在编辑器中，才插入
                  if (!beforeText.includes(event.data)) {
                    this.editor.insertText(inlineRange, event.data, {} as TextAttributes);
                    this.editor.setInlineRange({
                      index: inlineRange.index + event.data.length,
                      length: 0,
                    });
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

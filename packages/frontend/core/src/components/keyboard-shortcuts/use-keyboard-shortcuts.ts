import { updateBlockType } from '@blocksuite/yunke/blocks/note';
import { BlockSelection, TextSelection } from '@blocksuite/std';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useEffect } from 'react';

import { EditorService } from '../../modules/editor';

// 快捷键定义
const SHORTCUTS = {
  // 文本格式 (Ctrl+Alt+数字)
  'ctrl+alt+0': { flavour: 'yunke:paragraph', type: 'text', name: '段落' },
  'ctrl+alt+1': { flavour: 'yunke:paragraph', type: 'h1', name: '一级标题' },
  'ctrl+alt+2': { flavour: 'yunke:paragraph', type: 'h2', name: '二级标题' },
  'ctrl+alt+3': { flavour: 'yunke:paragraph', type: 'h3', name: '三级标题' },

  // 列表 (Ctrl+Shift+数字)
  'ctrl+shift+8': { flavour: 'yunke:list', type: 'bulleted', name: '无序列表' },
  'ctrl+shift+7': { flavour: 'yunke:list', type: 'numbered', name: '有序列表' },

  // 块操作 (Alt+方向键)
  'alt+arrowup': { action: 'move-up', name: '上移块' },
  'alt+arrowdown': { action: 'move-down', name: '下移块' },

  // 其他
  'ctrl+shift+d': { action: 'duplicate', name: '复制块' },
  'ctrl+shift+q': { flavour: 'yunke:paragraph', type: 'quote', name: '引用' },
} as const;

type ShortcutKey = keyof typeof SHORTCUTS;

export function useKeyboardShortcuts(enabled: boolean = true) {
  const editorService = useService(EditorService);
  const editorContainer = useLiveData(editorService.editor.editorContainer$);

  // 获取当前选中的块
  const getCurrentSelectedBlock = useCallback((std: any) => {
    const textSelection = std.selection.find(TextSelection);
    if (textSelection) {
      const blockId = textSelection.from.blockId;
      return std.store.getBlock(blockId)?.model;
    }

    const blockSelections = std.selection.filter(BlockSelection);
    if (blockSelections && blockSelections.length > 0) {
      const blockId = blockSelections[0].blockId;
      return std.store.getBlock(blockId)?.model;
    }

    return null;
  }, []);

  // 执行块操作
  const executeBlockAction = useCallback(
    (action: string, std: any) => {
      try {
        const currentModel = getCurrentSelectedBlock(std);
        if (!currentModel) return false;

        const parent = std.store.getParent(currentModel);
        if (!parent) return false;

        const currentIndex = parent.children.indexOf(currentModel);
        if (currentIndex === -1) return false;

        std.store.captureSync();

        switch (action) {
          case 'duplicate': {
            const blockProps = {
              type: currentModel.type || currentModel.props?.type,
              text: currentModel.text?.clone(),
              children: [],
            };

            std.store.addBlock(
              currentModel.flavour,
              blockProps,
              parent,
              currentIndex + 1
            );
            return true;
          }
          case 'move-up': {
            if (currentIndex === 0) return false;

            const previousSibling = parent.children[currentIndex - 1];
            std.store.moveBlocks([currentModel], parent, previousSibling, true);
            return true;
          }
          case 'move-down': {
            if (currentIndex === parent.children.length - 1) return false;

            const nextSibling = parent.children[currentIndex + 1];
            std.store.moveBlocks([currentModel], parent, nextSibling, false);
            return true;
          }
          default:
            return false;
        }
      } catch (error) {
        console.error(`执行操作失败: ${action}`, error);
        return false;
      }
    },
    [getCurrentSelectedBlock]
  );

  // 执行格式化命令
  const executeFormatCommand = useCallback(
    (flavour: string, type?: string) => {
      if (!editorContainer?.host?.std) return false;

      try {
        const std = editorContainer.host.std;
        const result = std.command.exec(updateBlockType, {
          flavour,
          props: type ? { type } : {},
        });
        return Boolean(result);
      } catch (error) {
        console.error('执行格式化命令失败:', error);
        return false;
      }
    },
    [editorContainer]
  );

  // 监听键盘事件
  useEffect(() => {
    // 如果未启用或编辑器未初始化，不注册监听器
    if (!enabled || !editorContainer?.host?.std) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 有些环境下 KeyboardEvent 可能没有 key 字段，需兼容处理
      const key = e.key?.toLowerCase?.();
      if (!key) return;

      // 构建快捷键字符串
      const keys: string[] = [];
      if (e.ctrlKey || e.metaKey) keys.push('ctrl');
      if (e.altKey) keys.push('alt');
      if (e.shiftKey) keys.push('shift');
      keys.push(key);

      const shortcutKey = keys.join('+') as ShortcutKey;
      const shortcut = SHORTCUTS[shortcutKey];

      if (shortcut) {
        // 阻止默认行为和冒泡
        e.preventDefault();
        e.stopPropagation();

        let success = false;

        if ('action' in shortcut) {
          // 执行块操作
          success = executeBlockAction(shortcut.action, std);
        } else if ('flavour' in shortcut) {
          // 执行格式化命令
          success = executeFormatCommand(shortcut.flavour, shortcut.type);
        }

        if (success) {
          console.log(`✅ 执行快捷键: ${shortcut.name} (${shortcutKey})`);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editorContainer, executeBlockAction, executeFormatCommand, enabled]);

  return { shortcuts: SHORTCUTS };
}

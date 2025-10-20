import {
  ArrowDownBigIcon,
  ArrowUpBigIcon,
  CodeIcon,
  CopyIcon,
  DeleteIcon,
  DualLinkIcon,
  NowIcon,
  TodayIcon,
  TomorrowIcon,
  YesterdayIcon,
} from '@blocksuite/icons/rc';
import { updateBlockType } from '@blocksuite/yunke/blocks/note';
import { BlockSelection, TextSelection } from '@blocksuite/std';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import { type ReactElement, useCallback, useState } from 'react';

import { EditorService } from '../../modules/editor';
import * as styles from './block-commands-sidebar.css';

interface BlockCommand {
  id: string;
  name: string;
  description: string;
  icon: ReactElement;
  group: string;
  action: () => void;
}

interface BlockCommandGroup {
  name: string;
  commands: BlockCommand[];
}

export function BlockCommandsSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>('basic');
  const editorService = useService(EditorService);
  const editorContainer = useLiveData(editorService.editor.editorContainer$);

  // 日期格式化函数
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 时间格式化函数
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 显示简短提示的辅助函数
  const showToast = useCallback((message: string) => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 50%;
      transform: translateX(50%);
      background: #333;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 10000;
      pointer-events: none;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }, []);

  // 降级处理：复制到剪贴板
  const fallbackToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`已复制到剪贴板: ${text}`);
    }).catch(() => {
      alert(`无法插入文本，请手动输入: ${text}`);
    });
  }, [showToast]);

  // 在编辑器中插入文本
  const insertTextInEditor = useCallback((std: any, text: string) => {
    try {
      const textSelection = std.selection.find(TextSelection);
      if (textSelection) {
        const model = std.store.getBlock(textSelection.from.blockId)?.model;
        if (model && model.text) {
          const insertIndex = textSelection.from.index;
          std.store.captureSync();
          model.text.insert(text, insertIndex);
          
          const newTextSelection = std.selection.create(TextSelection, {
            from: {
              blockId: textSelection.from.blockId,
              index: insertIndex + text.length,
              length: 0,
            },
            to: null,
          });
          std.selection.setGroup('note', [newTextSelection]);
          
          console.log(`成功插入文本: ${text}`);
          return;
        }
      }
      
      fallbackToClipboard(text);
    } catch (error) {
      console.error('插入文本失败:', error);
      fallbackToClipboard(text);
    }
  }, [fallbackToClipboard]);

  // 获取当前选中的块
  const getCurrentSelectedBlock = useCallback((std: any) => {
    const textSelection = std.selection.find(TextSelection);
    if (textSelection) {
      const blockId = textSelection.from.blockId;
      const model = std.store.getBlock(blockId)?.model;
      return model;
    }

    const blockSelections = std.selection.filter(BlockSelection);
    if (blockSelections && blockSelections.length > 0) {
      const blockId = blockSelections[0].blockId;
      const model = std.store.getBlock(blockId)?.model;
      return model;
    }

    return null;
  }, []);

  // 执行操作命令
  const executeActionCommand = useCallback((std: any, commandName: string) => {
    try {
      switch (commandName) {
        case 'copy': {
          try {
            const success = document.execCommand('copy');
            if (success) {
              showToast('已复制到剪贴板');
            } else {
              const selection = window.getSelection();
              if (selection && selection.toString()) {
                navigator.clipboard.writeText(selection.toString()).then(() => {
                  showToast('已复制到剪贴板');
                }).catch(() => {
                  alert('复制失败');
                });
              } else {
                alert('请先选中要复制的内容');
              }
            }
          } catch (error) {
            console.error('复制失败:', error);
            alert('复制失败，请先选中要复制的内容');
          }
          break;
        }
        case 'duplicate': {
          const currentModel = getCurrentSelectedBlock(std);
          if (!currentModel) {
            alert('请先选中一个块');
            return;
          }

          const parent = std.store.getParent(currentModel);
          if (!parent) {
            alert('无法复制顶级块');
            return;
          }

          const currentIndex = parent.children.indexOf(currentModel);
          if (currentIndex === -1) {
            alert('获取块位置失败');
            return;
          }

          std.store.captureSync();
          
          const blockProps = {
            type: currentModel.type || currentModel.props?.type,
            text: currentModel.text?.clone(),
            children: [],
          };

          const newBlockId = std.store.addBlock(
            currentModel.flavour,
            blockProps,
            parent,
            currentIndex + 1
          );

          if (newBlockId) {
            showToast('已复制块');
            console.log('成功复制块');
          } else {
            alert('复制块失败');
          }
          break;
        }
        case 'move-up': {
          const currentModel = getCurrentSelectedBlock(std);
          if (!currentModel) {
            alert('请先选中一个块');
            return;
          }

          const parent = std.store.getParent(currentModel);
          if (!parent) {
            alert('无法移动顶级块');
            return;
          }

          const currentIndex = parent.children.indexOf(currentModel);
          if (currentIndex === -1) {
            alert('获取块位置失败');
            return;
          }

          if (currentIndex === 0) {
            alert('已经是第一个块了');
            return;
          }

          std.store.captureSync();
          const previousSibling = parent.children[currentIndex - 1];
          std.store.moveBlocks([currentModel], parent, previousSibling, true);
          
          showToast('已上移块');
          console.log('成功上移块');
          break;
        }
        case 'move-down': {
          const currentModel = getCurrentSelectedBlock(std);
          if (!currentModel) {
            alert('请先选中一个块');
            return;
          }

          const parent = std.store.getParent(currentModel);
          if (!parent) {
            alert('无法移动顶级块');
            return;
          }

          const currentIndex = parent.children.indexOf(currentModel);
          if (currentIndex === -1) {
            alert('获取块位置失败');
            return;
          }

          if (currentIndex === parent.children.length - 1) {
            alert('已经是最后一个块了');
            return;
          }

          std.store.captureSync();
          const nextSibling = parent.children[currentIndex + 1];
          std.store.moveBlocks([currentModel], parent, nextSibling, false);
          
          showToast('已下移块');
          console.log('成功下移块');
          break;
        }
        case 'delete': {
          const confirmed = window.confirm('确定要删除选中的块吗？');
          if (confirmed) {
            const currentModel = getCurrentSelectedBlock(std);
            if (!currentModel) {
              alert('请先选中一个块');
              return;
            }

            std.store.captureSync();
            std.store.deleteBlock(currentModel);
            
            showToast('已删除块');
            console.log('成功删除块');
          }
          break;
        }
        default:
          alert(`命令 "${commandName}" 暂未实现，这是演示功能。`);
      }
    } catch (error) {
      console.error(`执行操作命令失败: ${commandName}`, error);
      alert(`操作失败: ${error}`);
    }
  }, [getCurrentSelectedBlock, showToast]);

  const executeSlashCommand = useCallback((commandName: string, params?: { flavour?: string; type?: string }) => {
    try {
      console.log('执行命令:', commandName, params);
      
      if (!editorContainer?.host?.std) {
        console.warn('编辑器未准备好');
        alert('编辑器未准备好，请稍后再试');
        return;
      }

      const std = editorContainer.host.std;
      
      if (params?.flavour) {
        const result = std.command.exec(updateBlockType, {
          flavour: params.flavour,
          props: params.type ? { type: params.type } : {},
        });
        
        if (result) {
          console.log(`成功转换为 ${commandName}`);
        } else {
          console.warn(`转换失败: ${commandName}`);
          alert(`转换失败，请确保当前有选中的文本或块`);
        }
      } else {
        switch (commandName) {
          case 'today':
            insertTextInEditor(std, formatDate(new Date()));
            break;
          case 'tomorrow':
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            insertTextInEditor(std, formatDate(tomorrow));
            break;
          case 'yesterday':
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            insertTextInEditor(std, formatDate(yesterday));
            break;
          case 'now':
            insertTextInEditor(std, formatTime(new Date()));
            break;
          default:
            executeActionCommand(std, commandName);
        }
      }
    } catch (error) {
      console.error('执行命令失败:', error);
      alert(`执行命令失败: ${error}`);
    }
  }, [editorContainer, insertTextInEditor, executeActionCommand]);

  const blockGroups: BlockCommandGroup[] = [
    {
      name: '基础块',
      commands: [
        {
          id: 'paragraph',
          name: '段落',
          description: '转换为普通文本段落',
          icon: <div style={{ fontSize: '14px', fontWeight: 'bold' }}>¶</div>,
          group: 'basic',
          action: () => executeSlashCommand('paragraph', { flavour: 'yunke:paragraph', type: 'text' }),
        },
        {
          id: 'heading1',
          name: '一级标题',
          description: '转换为大号标题',
          icon: <div style={{ fontSize: '12px', fontWeight: 'bold' }}>H1</div>,
          group: 'basic',
          action: () => executeSlashCommand('heading1', { flavour: 'yunke:paragraph', type: 'h1' }),
        },
        {
          id: 'heading2',
          name: '二级标题',
          description: '转换为中号标题',
          icon: <div style={{ fontSize: '12px', fontWeight: 'bold' }}>H2</div>,
          group: 'basic',
          action: () => executeSlashCommand('heading2', { flavour: 'yunke:paragraph', type: 'h2' }),
        },
        {
          id: 'heading3',
          name: '三级标题',
          description: '转换为小号标题',
          icon: <div style={{ fontSize: '12px', fontWeight: 'bold' }}>H3</div>,
          group: 'basic',
          action: () => executeSlashCommand('heading3', { flavour: 'yunke:paragraph', type: 'h3' }),
        },
        {
          id: 'bulleted-list',
          name: '项目符号列表',
          description: '转换为项目符号列表',
          icon: <div style={{ fontSize: '16px', fontWeight: 'bold' }}>•</div>,
          group: 'basic',
          action: () => executeSlashCommand('bulleted-list', { flavour: 'yunke:list', type: 'bulleted' }),
        },
        {
          id: 'numbered-list',
          name: '编号列表',
          description: '转换为编号列表',
          icon: <div style={{ fontSize: '12px', fontWeight: 'bold' }}>1.</div>,
          group: 'basic',
          action: () => executeSlashCommand('numbered-list', { flavour: 'yunke:list', type: 'numbered' }),
        },
        {
          id: 'quote',
          name: '引用',
          description: '转换为引用块',
          icon: <div style={{ fontSize: '16px', fontWeight: 'bold' }}>"</div>,
          group: 'basic',
          action: () => executeSlashCommand('quote', { flavour: 'yunke:paragraph', type: 'quote' }),
        },
        {
          id: 'code',
          name: '代码',
          description: '转换为代码块',
          icon: <CodeIcon />,
          group: 'basic',
          action: () => executeSlashCommand('code', { flavour: 'yunke:code' }),
        },
        {
          id: 'divider',
          name: '分隔线',
          description: '插入分隔线',
          icon: <div style={{ fontSize: '16px', fontWeight: 'bold' }}>—</div>,
          group: 'basic',
          action: () => executeSlashCommand('divider', { flavour: 'yunke:divider' }),
        },
      ],
    },
    {
      name: '日期时间',
      commands: [
        {
          id: 'today',
          name: '今天',
          description: '插入今天的日期',
          icon: <TodayIcon />,
          group: 'date',
          action: () => executeSlashCommand('today'),
        },
        {
          id: 'tomorrow',
          name: '明天',
          description: '插入明天的日期',
          icon: <TomorrowIcon />,
          group: 'date',
          action: () => executeSlashCommand('tomorrow'),
        },
        {
          id: 'yesterday',
          name: '昨天',
          description: '插入昨天的日期',
          icon: <YesterdayIcon />,
          group: 'date',
          action: () => executeSlashCommand('yesterday'),
        },
        {
          id: 'now',
          name: '现在',
          description: '插入当前时间',
          icon: <NowIcon />,
          group: 'date',
          action: () => executeSlashCommand('now'),
        },
      ],
    },
    {
      name: '操作',
      commands: [
        {
          id: 'copy',
          name: '复制',
          description: '复制选中内容到剪贴板',
          icon: <CopyIcon />,
          group: 'actions',
          action: () => executeSlashCommand('copy'),
        },
        {
          id: 'duplicate',
          name: '复制行',
          description: '复制选中的块',
          icon: <DualLinkIcon />,
          group: 'actions',
          action: () => executeSlashCommand('duplicate'),
        },
        {
          id: 'move-up',
          name: '上移',
          description: '将选中块向上移动',
          icon: <ArrowUpBigIcon />,
          group: 'actions',
          action: () => executeSlashCommand('move-up'),
        },
        {
          id: 'move-down',
          name: '下移',
          description: '将选中块向下移动',
          icon: <ArrowDownBigIcon />,
          group: 'actions',
          action: () => executeSlashCommand('move-down'),
        },
        {
          id: 'delete',
          name: '删除',
          description: '删除选中的块',
          icon: <DeleteIcon />,
          group: 'actions',
          action: () => executeSlashCommand('delete'),
        },
      ],
    },
  ];

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  const handleGroupClick = useCallback((groupName: string) => {
    if (selectedGroup === groupName) {
      setSelectedGroup(null);
    } else {
      setSelectedGroup(groupName);
    }
  }, [selectedGroup]);

  const handleCommandClick = useCallback((command: BlockCommand, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('点击命令:', command.name);
    command.action();
  }, []);

  // 检查编辑器是否可用
  const isEditorReady = Boolean(editorContainer?.host?.std);

  return (
    <div 
      className={clsx(
        styles.sidebarContainer,
        isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded,
        !isEditorReady && styles.sidebarDisabled
      )}
    >
      {/* 状态指示器 */}
      <div 
        className={clsx(
          styles.statusIndicator,
          !isEditorReady && styles.statusIndicatorDisabled
        )}
      />
      
      <div className={styles.header}>
        <button 
          className={styles.toggleButton}
          onClick={toggleSidebar}
        >
          {isCollapsed ? '◀' : '▶'}
        </button>
        {!isCollapsed && (
          <span className={styles.title}>
            块命令 {!isEditorReady && '(等待编辑器...)'}
          </span>
        )}
      </div>

      {!isCollapsed && (
        <div className={styles.content}>
          {blockGroups.map((group) => (
            <div key={group.name} className={styles.group}>
              <button
                className={clsx(
                  styles.groupHeader,
                  selectedGroup === group.commands[0].group && styles.groupHeaderActive
                )}
                onClick={() => handleGroupClick(group.commands[0].group)}
              >
                <span>{group.name}</span>
                <span className={styles.groupIcon}>
                  {selectedGroup === group.commands[0].group ? '−' : '+'}
                </span>
              </button>

              {selectedGroup === group.commands[0].group && (
                <div className={styles.commands}>
                  {group.commands.map((command) => (
                    <button
                      key={command.id}
                      className={clsx(
                        styles.commandItem,
                        !isEditorReady && styles.commandItemDisabled
                      )}
                      onClick={(e) => isEditorReady && handleCommandClick(command, e)}
                      title={isEditorReady ? command.description : '等待编辑器准备就绪...'}
                    >
                      <div className={styles.commandIcon}>{command.icon}</div>
                      <div className={styles.commandInfo}>
                        <div className={styles.commandName}>{command.name}</div>
                        <div className={styles.commandDescription}>
                          {command.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {blockGroups.length === 0 && (
            <div className={styles.emptyState}>
              暂无可用命令
            </div>
          )}
        </div>
      )}

      {/* 折叠状态下的功能指示器 */}
      <div className={styles.collapsedIndicators}>
        {blockGroups.map((group, index) => (
          <div
            key={group.name}
            className={clsx(
              styles.collapsedIndicator,
              selectedGroup === group.commands[0].group && styles.collapsedIndicatorActive
            )}
            onClick={() => {
              setIsCollapsed(false);
              setTimeout(() => handleGroupClick(group.commands[0].group), 100);
            }}
            title={`${group.name} (${group.commands.length} 个命令)`}
          >
            {index === 0 && '¶'}  {/* 基础块 */}
            {index === 1 && '📅'} {/* 日期时间 */}
            {index === 2 && '⚡'}  {/* 操作 */}
          </div>
        ))}
      </div>
    </div>
  );
} 
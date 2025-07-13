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
import { updateBlockType } from '@blocksuite/affine/blocks/note';
import { BlockSelection, TextSelection } from '@blocksuite/std';
import { useLiveData, useService } from '@toeverything/infra';
import { type ReactElement, useCallback, useState } from 'react';

import { EditorService } from '../../modules/editor';

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
          action: () => executeSlashCommand('paragraph', { flavour: 'affine:paragraph', type: 'text' }),
        },
        {
          id: 'heading1',
          name: '一级标题',
          description: '转换为大号标题',
          icon: <div style={{ fontSize: '12px', fontWeight: 'bold' }}>H1</div>,
          group: 'basic',
          action: () => executeSlashCommand('heading1', { flavour: 'affine:paragraph', type: 'h1' }),
        },
        {
          id: 'heading2',
          name: '二级标题',
          description: '转换为中号标题',
          icon: <div style={{ fontSize: '12px', fontWeight: 'bold' }}>H2</div>,
          group: 'basic',
          action: () => executeSlashCommand('heading2', { flavour: 'affine:paragraph', type: 'h2' }),
        },
        {
          id: 'heading3',
          name: '三级标题',
          description: '转换为小号标题',
          icon: <div style={{ fontSize: '12px', fontWeight: 'bold' }}>H3</div>,
          group: 'basic',
          action: () => executeSlashCommand('heading3', { flavour: 'affine:paragraph', type: 'h3' }),
        },
        {
          id: 'bulleted-list',
          name: '项目符号列表',
          description: '转换为项目符号列表',
          icon: <div style={{ fontSize: '16px', fontWeight: 'bold' }}>•</div>,
          group: 'basic',
          action: () => executeSlashCommand('bulleted-list', { flavour: 'affine:list', type: 'bulleted' }),
        },
        {
          id: 'numbered-list',
          name: '编号列表',
          description: '转换为编号列表',
          icon: <div style={{ fontSize: '12px', fontWeight: 'bold' }}>1.</div>,
          group: 'basic',
          action: () => executeSlashCommand('numbered-list', { flavour: 'affine:list', type: 'numbered' }),
        },
        {
          id: 'quote',
          name: '引用',
          description: '转换为引用块',
          icon: <div style={{ fontSize: '16px', fontWeight: 'bold' }}>"</div>,
          group: 'basic',
          action: () => executeSlashCommand('quote', { flavour: 'affine:paragraph', type: 'quote' }),
        },
        {
          id: 'code',
          name: '代码',
          description: '转换为代码块',
          icon: <CodeIcon />,
          group: 'basic',
          action: () => executeSlashCommand('code', { flavour: 'affine:code' }),
        },
        {
          id: 'divider',
          name: '分隔线',
          description: '插入分隔线',
          icon: <div style={{ fontSize: '16px', fontWeight: 'bold' }}>—</div>,
          group: 'basic',
          action: () => executeSlashCommand('divider', { flavour: 'affine:divider' }),
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
    console.log('切换侧边栏:', !isCollapsed);
  }, [isCollapsed]);

  const handleGroupClick = useCallback((groupName: string) => {
    console.log('点击分组:', groupName);
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

  // 样式对象
  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    top: '60px',
    right: '20px',
    width: isCollapsed ? '48px' : '280px',
    height: 'calc(100vh - 80px)',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    transition: 'width 0.3s ease',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    opacity: isEditorReady ? 1 : 0.5,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    minHeight: '48px',
    cursor: 'default',
  };

  const toggleButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 10px',
    borderRadius: '4px',
    color: '#374151',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  };

  const titleStyle: React.CSSProperties = {
    marginLeft: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    userSelect: 'none',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
  };

  const groupStyle: React.CSSProperties = {
    marginBottom: '8px',
  };

  const groupHeaderStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: '#f9fafb',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    transition: 'all 0.2s ease',
    userSelect: 'none',
  };

  const activeStyle: React.CSSProperties = {
    backgroundColor: '#3b82f6',
    color: 'white',
  };

  const commandsStyle: React.CSSProperties = {
    marginTop: '4px',
    paddingLeft: '8px',
  };

  const commandItemStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: isEditorReady ? 'pointer' : 'not-allowed',
    textAlign: 'left',
    marginBottom: '2px',
    transition: 'background-color 0.2s ease',
    userSelect: 'none',
    opacity: isEditorReady ? 1 : 0.6,
  };

  const commandIconStyle: React.CSSProperties = {
    width: '20px',
    height: '20px',
    marginRight: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    flexShrink: 0,
  };

  const commandInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const commandNameStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '2px',
    lineHeight: '1.2',
  };

  const commandDescriptionStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#6b7280',
    lineHeight: '1.3',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>
        <button 
          style={toggleButtonStyle} 
          onClick={toggleSidebar}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {isCollapsed ? '<' : '>'}
        </button>
        {!isCollapsed && (
          <span style={titleStyle}>
            块命令 {!isEditorReady && '(等待编辑器...)'}
          </span>
        )}
      </div>

      {!isCollapsed && (
        <div style={contentStyle}>
          {blockGroups.map((group) => (
            <div key={group.name} style={groupStyle}>
              <button
                style={{
                  ...groupHeaderStyle,
                  ...(selectedGroup === group.commands[0].group ? activeStyle : {}),
                }}
                onClick={() => handleGroupClick(group.commands[0].group)}
                onMouseEnter={(e) => {
                  if (selectedGroup !== group.commands[0].group) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedGroup !== group.commands[0].group) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
              >
                <span>{group.name}</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {selectedGroup === group.commands[0].group ? '−' : '+'}
                </span>
              </button>

              {selectedGroup === group.commands[0].group && (
                <div style={commandsStyle}>
                  {group.commands.map((command) => (
                    <button
                      key={command.id}
                      style={commandItemStyle}
                      onClick={(e) => isEditorReady && handleCommandClick(command, e)}
                      title={isEditorReady ? command.description : '等待编辑器准备就绪...'}
                      onMouseEnter={(e) => {
                        if (isEditorReady) {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={commandIconStyle}>{command.icon}</div>
                      <div style={commandInfoStyle}>
                        <div style={commandNameStyle}>{command.name}</div>
                        <div style={commandDescriptionStyle}>
                          {command.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
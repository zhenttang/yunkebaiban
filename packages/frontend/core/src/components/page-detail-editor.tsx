import './page-detail-editor.css';

import { useLiveData, useService } from '@toeverything/infra';
import { DebugLogger } from '@yunke/debug';
import clsx from 'clsx';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import type { Awareness } from 'y-protocols/awareness.js';

import type { YunkeEditorContainer } from '../blocksuite/block-suite-editor';
import { BlockSuiteEditor } from '../blocksuite/block-suite-editor';
import { DocService } from '../modules/doc';
import { EditorService } from '../modules/editor';
import { EditorSettingService } from '../modules/editor-setting';
import { deckerIntegrationManager } from '../modules/decker-integration/decker-integration-manager';
import * as styles from './page-detail-editor.css';
import { TemporaryUserCursorDecorator } from '../modules/temporary-user/components/temporary-user-cursor';
import { TemporaryUserCollaboration } from '../modules/temporary-user/utils/collaboration';

const deckLogger = new DebugLogger('yunke:decker-modal');
const editorLogger = new DebugLogger('yunke:page-detail-editor');

type Collaborator = {
  label: string;
  id?: string;
  color?: string;
  avatar?: string;
  self?: boolean;
  cursor?: { x: number; y: number };
  selection?: any; // BlockSuite Selection
  caretRect?: DOMRect; // Calculated caret position
};

// 简化版本的Decker集成组件
const SimpleDeckModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onGifReceived?: (gifBlob: Blob, metadata: any) => void;
}> = ({ open, onClose, onGifReceived }) => {
  useEffect(() => {
    if (!open) return;

    const handleMessage = (event: MessageEvent) => {
      // 检查消息来源
      if (event.origin !== window.location.origin) return;

      deckLogger.debug('收到来自Decker的消息', event.data);

      if (event.data?.type === 'DECK_GIF_EXPORT') {
        const { data, filename, timestamp, size } = event.data;

        try {
          // 将数组转换为Uint8Array再创建Blob
          const uint8Array = new Uint8Array(data);
          const gifBlob = new Blob([uint8Array], { type: 'image/gif' });

          const metadata = {
            filename: filename || 'decker-drawing.gif',
            timestamp: timestamp || Date.now(),
            size: size || gifBlob.size,
            source: 'decker'
          };

          deckLogger.debug('GIF数据接收成功', metadata);

          if (onGifReceived) {
            onGifReceived(gifBlob, metadata);
          }

          // 自动关闭模态框
          onClose();

        } catch (error) {
          deckLogger.error('处理GIF数据失败', error as Error);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [open, onGifReceived, onClose]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '95vw',
        height: '90vh',
        maxWidth: '1200px',
        maxHeight: '800px',
        backgroundColor: '#000',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 头部 */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1a1a1a'
        }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>
            🎨 Decker 绘画工具
          </h3>
          <button
            onClick={onClose}
            style={{
              color: '#fff',
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* iframe */}
        <div style={{ flex: 1, position: 'relative' }}>
          <iframe
            src="/yunke_whiteboard.html?whiteboard=true"
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            title="Decker 绘画工具"
            sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
          />
        </div>
      </div>
    </div>
  );
};

declare global {
  // oxlint-disable-next-line no-var 禁用no-var规则
  var currentEditor: YunkeEditorContainer | undefined;
}

export type OnLoadEditor = (
  editor: YunkeEditorContainer
) => (() => void) | void;

export interface PageDetailEditorProps {
  onLoad?: OnLoadEditor;
  readonly?: boolean;
}

export const PageDetailEditor = ({
  onLoad,
  readonly,
}: PageDetailEditorProps) => {
  const editor = useService(EditorService).editor;
  const mode = useLiveData(editor.mode$);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  const defaultOpenProperty = useLiveData(editor.defaultOpenProperty$);

  // ✅ 安全地获取 doc：Editor.doc 可能返回 null（如果 DocScope 未初始化）
  const doc = editor.doc;

  // ✅ 如果 doc 未初始化，返回加载占位符（而不是 null，避免 Lit 组件更新错误）
  if (!doc) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999'
      }}>
        加载中...
      </div>
    );
  }

  const pageWidth = useLiveData(doc.properties$.selector(p => p.pageWidth));

  const isSharedMode = editor.isSharedMode;
  const editorSetting = useService(EditorSettingService).editorSetting;
  const settings = useLiveData(
    editorSetting.settings$.selector(s => ({
      fontFamily: s.fontFamily,
      customFontFamily: s.customFontFamily,
      fullWidthLayout: s.fullWidthLayout,
    }))
  );
  const fullWidthLayout = pageWidth
    ? pageWidth === 'fullWidth'
    : settings.fullWidthLayout;

  // 协作者列表（含自身），用于显示头像/名称
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);

  // Decker模态框状态
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);

  // 聚合 awareness 状态，驱动协作气泡显示
  useEffect(() => {
    const awareness: Awareness | undefined = (doc as any)?.awarenessStore?.awareness;
    if (!awareness) return;

    const compute = () => {
      const list: Collaborator[] = [];
      const std = globalThis.currentEditor?.std;

      awareness.getStates().forEach((state, clientId) => {
        const user = state?.user;
        if (!user) return;

        let caretRect: DOMRect | undefined;

        // 如果是文档模式，尝试计算文本光标位置
        if (mode === 'page' && state.selection && Array.isArray(state.selection) && state.selection.length > 0 && std && clientId !== awareness.clientID) {
          try {
            // 尝试获取第一个选区
            const sel = state.selection[0];
            if (sel && sel.blockId) {
              // 尝试获取对应的块元素
              const block = std.view.getBlock(sel.blockId);
              if (block) {
                const rect = block.getBoundingClientRect();
                // 将光标定位在块的起始位置（作为降级方案）
                // TODO: 如果能找到 getRangeRects API，可以实现更精确的字符级定位
                caretRect = {
                  left: rect.left,
                  top: rect.top,
                  width: 2,
                  height: 20, // 假设行高
                  right: rect.left + 2,
                  bottom: rect.top + 20,
                  x: rect.left,
                  y: rect.top,
                  toJSON: () => ({})
                } as DOMRect;
              }
            }
          } catch (e) {
            // 忽略错误
          }
        }

        list.push({
          label: user.name || user.rawName || '协作者',
          id: user.id || user.temporaryId,
          avatar: user.avatar,
          color: user.color,
          self: clientId === awareness.clientID,
          cursor: state?.cursor,
          selection: state?.selection,
          caretRect,
        });
      });
      setCollaborators(list);
    };

    compute();
    const handler = () => compute();
    awareness.on('change', handler);

    // 监听编辑器更新以重新计算光标位置（例如滚动或内容变化）
    let rafId: number;
    const loop = () => {
      compute();
      rafId = requestAnimationFrame(loop);
    };
    // 只有在有协作者且处于页面模式时才开启循环检测
    if (mode === 'page') {
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      awareness.off('change', handler);
      cancelAnimationFrame(rafId);
    };
  }, [doc, mode]);

  // 将本地鼠标位置写入 awareness.cursor，供远端显示
  useEffect(() => {
    const awareness: Awareness | undefined = (doc as any)?.awarenessStore?.awareness;
    if (!awareness) return;

    let ticking = false;

    const updateCursor = (e: MouseEvent) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const rect = editorContainerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        if (x < 0 || y < 0 || x > 1 || y > 1) return;
        awareness.setLocalStateField('cursor', { x, y });
      });
    };

    const target = editorContainerRef.current ?? window;
    target.addEventListener('mousemove', updateCursor as EventListener, { passive: true });

    return () => {
      target.removeEventListener('mousemove', updateCursor);
      awareness.setLocalStateField('cursor', null);
    };
  }, [doc]);

  // 监听本地 selection 变化并广播到 awareness
  useEffect(() => {
    const awareness: Awareness | undefined = (doc as any)?.awarenessStore?.awareness;
    if (!awareness || mode !== 'page') return;

    const std = globalThis.currentEditor?.std;
    if (!std) return;

    const updateSelection = () => {
      const selection = std.selection.value;
      if (selection && Array.isArray(selection)) {
        const jsonSelection = selection.map((s: any) => s.toJSON());
        awareness.setLocalStateField('selection', jsonSelection);
      } else {
        awareness.setLocalStateField('selection', null);
      }
    };

    const disposable = std.selection.slots.changed.subscribe(updateSelection);

    return () => {
      disposable.unsubscribe();
      awareness.setLocalStateField('selection', null);
    };
  }, [doc, mode]);

  // 监听来自工具栏的打开事件以及Decker的导出完成事件
  useEffect(() => {
    const handleOpenDecker = () => {
      editorLogger.debug('收到打开Decker事件');
      setIsDeckModalOpen(true);
    };

    const handleDeckerExport = async (event: MessageEvent) => {
      // 检查消息来源和类型
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'DECK_EXPORT_COMPLETE') return;

      editorLogger.debug('收到Decker导出完成消息');

      try {
        const { gifData, deckData, metadata } = event.data;

        // 将GIF数据转换为Blob
        const gifBlob = new Blob([new Uint8Array(gifData)], { type: 'image/gif' });

        // 获取当前文档和编辑器
        const blockSuiteDoc = editor.doc?.blockSuiteDoc;

        if (!blockSuiteDoc || !blockSuiteDoc.blobSync) {
          editorLogger.error('无法获取白板存储系统');
          alert('上传失败：无法访问白板存储系统');
          return;
        }

        const currentMode = modeRef.current;
        editorLogger.debug('插入Decker绘图', { mode: currentMode });

        // 上传到白板存储系统
        const sourceId = await blockSuiteDoc.blobSync.set(gifBlob);
        editorLogger.info('GIF上传成功', { sourceId });

        // 准备自定义数据，包含deck信息用于重新编辑（暂时不使用）
        const customData = JSON.stringify({
          type: 'deck',
          deckData: deckData,
          metadata: {
            ...metadata,
            createdAt: Date.now(),
            editor: 'decker'
          }
        });

        // 根据编辑器模式决定插入方式
        if (currentMode === 'edgeless' || currentMode === 'page') {
          // 使用正确的API获取surface
          const surfaces = blockSuiteDoc.getBlocksByFlavour('yunke:surface');

          if (surfaces.length === 0) {
            editorLogger.warn('未找到surface块');
            alert('插入失败：无法找到无限白板surface');
            return;
          }

          const surface = surfaces[0];

          // 在surface中添加图片块（注意：图片是block，不是element）
          try {
            // 修复：使用 addBlock 添加 yunke:image 块到 surface 中
            const imageId = blockSuiteDoc.addBlock(
              'yunke:image',
              {
                sourceId: sourceId,
                xywh: '[100,100,200,150]', // [x,y,width,height]
                caption: `Decker绘图 - ${metadata.filename}`,
                width: 0, // 自动宽度
                height: 0, // 自动高度
                rotate: 0,
                size: -1,
              },
              surface.id // 添加到 surface 块中
            );

            editorLogger.info('Decker绘图已插入无限白板', { imageId, sourceId });
          } catch (surfaceError: any) {
            editorLogger.error('Surface插入失败，改为页面模式', surfaceError);
            // 回退到block模式
            insertAsBlock(blockSuiteDoc, sourceId, metadata);
          }

        } else {
          insertAsBlock(blockSuiteDoc, sourceId, metadata);
        }

        // 自动关闭模态框
        setIsDeckModalOpen(false);

        // 显示成功提示
        alert(`🎉 Decker绘图已成功插入白板！\n文件大小: ${Math.round(gifBlob.size / 1024)}KB`);

      } catch (error: any) {
        editorLogger.error('处理Decker导出失败', error);
        alert(`上传失败: ${error?.message || '未知错误'}`);
      }
    };

    window.addEventListener('open-decker-modal', handleOpenDecker as EventListener);
    window.addEventListener('message', handleDeckerExport);

    return () => {
      window.removeEventListener('open-decker-modal', handleOpenDecker as EventListener);
      window.removeEventListener('message', handleDeckerExport);
    };
  }, [editor]);

  const closeDeckModal = useCallback(() => {
    setIsDeckModalOpen(false);
  }, []);

  // 辅助函数：作为block插入到文档页面
  const insertAsBlock = useCallback((blockSuiteDoc: any, sourceId: string, metadata: any) => {
    const doc = blockSuiteDoc;
    const rootModel = doc.root;

    if (!rootModel) {
      editorLogger.error('未找到根模型');
      alert('插入失败：无法找到页面根模型');
      return;
    }

    // 在根块的末尾添加图片块
    const imageBlockId = doc.addBlock(
      'yunke:image',
      {
        sourceId: sourceId,
        caption: `Decker绘图 - ${metadata.filename}`,
        width: 0, // 自动宽度
        height: 0, // 自动高度
      },
      rootModel.id
    );

    editorLogger.info('Decker绘图已插入文档页面', { imageBlockId, sourceId });
  }, []);

  useEffect(() => {
    if (!editor.doc) {
      editorLogger.warn('DocScope未初始化，无法设置readonly');
      return;
    }

    editor.doc.blockSuiteDoc.readonly = readonly ?? false;

    // 设置DeckerIntegrationManager的Store
    const blockSuiteDoc = editor.doc.blockSuiteDoc;
    if (blockSuiteDoc) {
      try {
        // 尝试设置Store，如果有collection属性的话
        if ('collection' in blockSuiteDoc && blockSuiteDoc.collection) {
          deckerIntegrationManager.setStore(blockSuiteDoc.collection);
          // DeckerIntegrationManager Store已设置
        }
      } catch (storeError) {
        editorLogger.warn('设置DeckerIntegrationManager Store失败', storeError as Error);
      }
    } else {
      editorLogger.warn('无法获取BlockSuite Store');
    }
  }, [editor, readonly]);

  return (
    <>
      <div className={styles.editorWrapper} ref={editorContainerRef}>
        {collaborators.length > 0 && (
          <div className={styles.presenceBar}>
            {collaborators.map(collab => (
              <div
                key={`${collab.id ?? collab.label}-${collab.self ? 'self' : ''}`}
                className={styles.presenceItem}
                title={collab.label}
              >
                <div
                  className={styles.presenceAvatar}
                  style={{
                    backgroundColor: collab.avatar ? undefined : collab.color || '#85C1E9',
                    backgroundImage: collab.avatar ? `url(${collab.avatar})` : undefined,
                  }}
                >
                  {!collab.avatar && (collab.label?.[0] || '协')}
                </div>
                <span className={styles.presenceName}>
                  {collab.self ? '我' : collab.label}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.cursorLayer}>
          {collaborators
            .filter(c => !c.self)
            .map(c => {
              // 优先显示文本光标（如果在文档模式且有有效位置）
              if (mode === 'page' && c.caretRect) {
                return (
                  <div
                    key={`caret-${c.id ?? c.label}`}
                    style={{
                      position: 'absolute',
                      left: `${c.caretRect.left}px`,
                      top: `${c.caretRect.top}px`,
                      height: `${c.caretRect.height}px`,
                      pointerEvents: 'none',
                      zIndex: 10,
                    }}
                  >
                    <TemporaryUserCursorDecorator
                      userId={c.id || 'unknown'}
                      userName={c.label}
                      isTemporary={true}
                    />
                  </div>
                );
              }

              // 否则显示鼠标气泡（无限画板模式或作为备用）
              if (c.cursor) {
                return (
                  <div
                    key={`cursor-${c.id ?? c.label}`}
                    className={styles.cursorBadge}
                    style={{
                      left: `${(c.cursor?.x ?? 0) * 100}%`,
                      top: `${(c.cursor?.y ?? 0) * 100}%`,
                      borderColor: c.color || '#85C1E9',
                      background: c.color ? `${c.color}22` : 'rgba(133,193,233,0.2)',
                    }}
                  >
                    <span className={styles.cursorDot} style={{ background: c.color || '#85C1E9' }} />
                    <span className={styles.cursorLabel}>{c.label}</span>
                  </div>
                );
              }

              return null;
            })}
        </div>

        <BlockSuiteEditor
          className={clsx(styles.editor, {
            'full-screen': !isSharedMode && fullWidthLayout,
            'is-public': isSharedMode,
          })}
          mode={mode}
          defaultOpenProperty={defaultOpenProperty}
          page={doc.blockSuiteDoc}
          shared={isSharedMode}
          readonly={readonly}
          onEditorReady={onLoad}
        />
      </div>

      {/* Decker模态框 */}
      <SimpleDeckModal
        open={isDeckModalOpen}
        onClose={closeDeckModal}
      />
    </>
  );
};

import './page-detail-editor.css';

import { useLiveData, useService } from '@toeverything/infra';
import { DebugLogger } from '@yunke/debug';
import clsx from 'clsx';
import React, { useEffect, useState, useCallback, useRef } from 'react';

import type { YunkeEditorContainer } from '../blocksuite/block-suite-editor';
import { BlockSuiteEditor } from '../blocksuite/block-suite-editor';
import { DocService } from '../modules/doc';
import { EditorService } from '../modules/editor';
import { EditorSettingService } from '../modules/editor-setting';
import { deckerIntegrationManager } from '../modules/decker-integration/decker-integration-manager';
import * as styles from './page-detail-editor.css';

const deckLogger = new DebugLogger('yunke:decker-modal');
const editorLogger = new DebugLogger('yunke:page-detail-editor');

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

  // Decker模态框状态
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);

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
      
      {/* Decker模态框 */}
      <SimpleDeckModal
        open={isDeckModalOpen}
        onClose={closeDeckModal}
      />
    </>
  );
};

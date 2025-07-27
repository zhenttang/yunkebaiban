import { type Doc, DocsService } from '@affine/core/modules/doc';
import type { Editor } from '@affine/core/modules/editor';
import { EditorsService } from '@affine/core/modules/editor';
import { preprocessParams, paramsParseOptions } from '@affine/core/modules/navigation/utils';
import { ViewService } from '@affine/core/modules/workbench/services/view';
import { WorkspaceService } from '@affine/core/modules/workspace';
import { Bound } from '@blocksuite/affine/global/gfx';
import { GfxControllerIdentifier } from '@blocksuite/affine/std/gfx';
import { HighlightSelection } from '@blocksuite/affine/shared/selection';
import { FrameworkScope, useLiveData, useService } from '@toeverything/infra';
import {
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import queryString from 'query-string';

// Android专用服务包装器
const AndroidEditorsServiceWrapper = {
  createEditorSafe: async (docScope: any, viewService: any) => {
    try {
      // 延迟一帧，确保scope完全初始化
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // 在Android环境下，添加额外的延迟
      if ((window as any).BUILD_CONFIG?.isAndroid) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const editorsService = docScope.get(EditorsService);
      const editor = editorsService.createEditor();
      const unbind = editor.bindWorkbenchView(viewService.view);
      
      return { editor, unbind };
    } catch (error) {
      console.error('[AndroidEditorsServiceWrapper] 创建编辑器失败:', error);
      return null;
    }
  }
};

const useLoadDoc = (pageId: string) => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const docsService = useService(DocsService);
  const docRecordList = docsService.list;
  
  // 🛡️ 防御性修复：安全地使用 useLiveData
  const docListReady = useLiveData(
    docRecordList?.isReady$ || undefined
  );
  const docRecord = useLiveData(
    docRecordList?.doc$ ? docRecordList.doc$(pageId) : undefined
  );
  const viewService = useService(ViewService);
  
  // 使用 ref 跟踪组件挂载状态，避免竞态条件
  const isMountedRef = useRef(true);
  const resourcesRef = useRef<{
    unbind?: () => void;
    editor?: Editor;
    release?: () => void;
  }>({});

  const [doc, setDoc] = useState<Doc | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  useLayoutEffect(() => {
    // 标记组件为已挂载
    isMountedRef.current = true;
    
    // 如果 docRecord 存在，直接打开文档
    if (docRecord) {
      try {
        const { doc, release } = docsService.open(pageId);
        
        // 检查组件是否仍然挂载
        if (!isMountedRef.current) {
          release();
          return;
        }
        
        setDoc(doc);
        
        // Android环境下使用异步创建编辑器
        if ((window as any).BUILD_CONFIG?.isAndroid) {
          
          AndroidEditorsServiceWrapper.createEditorSafe(doc.scope, viewService)
            .then(result => {
              if (!result) {
                return;
              }
              
              // 再次检查组件状态
              if (!isMountedRef.current) {
                result.unbind();
                result.editor.dispose();
                return;
              }
              
              // 保存资源引用
              resourcesRef.current = { 
                unbind: result.unbind, 
                editor: result.editor, 
                release 
              };
              
              setEditor(result.editor);
            })
            .catch(error => {
              console.error('[useLoadDoc] 异步创建编辑器失败:', error);
            });
        } else {
          // 非Android环境，使用同步方式 - 添加防御性检查
          try {
            if (!doc || !doc.scope) {
              return;
            }
            
            const editor = doc.scope.get(EditorsService).createEditor();
            const unbind = editor.bindWorkbenchView(viewService.view);
            
            // 保存资源引用
            resourcesRef.current = { unbind, editor, release };
            
            setEditor(editor);
          } catch (error) {
            console.error('[useLoadDoc] 同步创建编辑器失败:', error);
            // 如果出错，至少保存release函数
            resourcesRef.current = { release };
          }
        }
        
        // 清理函数
        return () => {
          isMountedRef.current = false;
          
          // 延迟清理，给渲染一些时间完成
          setTimeout(() => {
            const resources = resourcesRef.current;
            
            // 使用 try-catch 包装每个清理操作
            try {
              if (resources.unbind && typeof resources.unbind === 'function') {
                resources.unbind();
              }
            } catch (error) {
              console.warn('[useLoadDoc] unbind 清理失败:', error);
            }
            
            try {
              if (resources.editor && typeof resources.editor.dispose === 'function') {
                resources.editor.dispose();
              }
            } catch (error) {
              console.warn('[useLoadDoc] editor.dispose 清理失败:', error);
            }
            
            try {
              if (resources.release && typeof resources.release === 'function') {
                resources.release();
              }
            } catch (error) {
              console.warn('[useLoadDoc] release 清理失败:', error);
            }
            
            // 清空引用
            resourcesRef.current = {};
          }, 100); // 延迟100ms清理
        };
      } catch (error) {
        console.error('[useLoadDoc] 打开文档失败:', pageId, error);
        return () => {};
      }
    }
    
    // 如果 docRecord 不存在，尝试监听其变化（解决服务器模式下的同步延迟问题）
    
    const subscription = docRecordList.doc$(pageId).subscribe(record => {
      
      // 检查组件是否仍然挂载
      if (!isMountedRef.current) {
        return;
      }
      
      if (record) {
        try {
          const { doc, release } = docsService.open(pageId);
          
          // 再次检查组件状态
          if (!isMountedRef.current) {
            release();
            return;
          }
          
          setDoc(doc);
          
          // Android环境下使用异步创建编辑器
          if ((window as any).BUILD_CONFIG?.isAndroid) {
            
            AndroidEditorsServiceWrapper.createEditorSafe(doc.scope, viewService)
              .then(result => {
                if (!result) {
                  return;
                }
                
                // 再次检查组件状态
                if (!isMountedRef.current) {
                  result.unbind();
                  result.editor.dispose();
                  return;
                }
                
                // 保存资源引用
                resourcesRef.current = { 
                  unbind: result.unbind, 
                  editor: result.editor, 
                  release 
                };
                
                setEditor(result.editor);
              })
              .catch(error => {
                console.error('[useLoadDoc] 延迟模式下异步创建编辑器失败:', error);
              });
          } else {
            // 非Android环境，使用同步方式 - 添加防御性检查
            try {
              if (!doc || !doc.scope) {
                return;
              }
              
              const editor = doc.scope.get(EditorsService).createEditor();
              const unbind = editor.bindWorkbenchView(viewService.view);
              
              // 保存资源引用
              resourcesRef.current = { unbind, editor, release };
              
              setEditor(editor);
            } catch (error) {
              console.error('[useLoadDoc] 延迟模式同步创建编辑器失败:', error);
              // 如果出错，至少保存release函数
              resourcesRef.current = { release };
            }
          }
          
          // 清理订阅
          subscription.unsubscribe();
        } catch (error) {
          console.error('[useLoadDoc] 延迟打开文档失败:', pageId, error);
        }
      }
    });

    return () => {
      isMountedRef.current = false;
      
      // 清理订阅
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      } catch (error) {
        console.warn('[useLoadDoc] 订阅清理失败:', error);
      }
      
      // 延迟清理资源
      setTimeout(() => {
        const resources = resourcesRef.current;
        
        if (resources.unbind) {
          try {
            resources.unbind();
          } catch (e) {
            console.warn('[useLoadDoc] 延迟模式 unbind 清理失败:', e);
          }
        }
        
        if (resources.editor) {
          try {
            resources.editor.dispose();
          } catch (e) {
            console.warn('[useLoadDoc] 延迟模式 editor.dispose 清理失败:', e);
          }
        }
        
        if (resources.release) {
          try {
            resources.release();
          } catch (e) {
            console.warn('[useLoadDoc] 延迟模式 release 清理失败:', e);
          }
        }
        
        resourcesRef.current = {};
      }, 100);
    };
  }, [docRecord, docsService, pageId, viewService.view, docRecordList]);
  
  // 组件卸载时确保标记为未挂载
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // set sync engine priority target - 修复Android WebView环境下的undefined访问
  useEffect(() => {
    
    // 🛡️ 增强防御性检查 - 深度验证对象链
    const validateEngineAccess = () => {
      if (!currentWorkspace) {
        return false;
      }
      
      if (!currentWorkspace.engine) {
        return false;
      }
      
      if (!currentWorkspace.engine.doc) {
        return false;
      }
      
      if (typeof currentWorkspace.engine.doc.addPriority !== 'function') {
        return false;
      }
      
      return true;
    };
    
    if (!validateEngineAccess()) {
      return () => {};
    }
    
    
    let dispose: (() => void) | null = null;
    
    try {
      dispose = currentWorkspace.engine.doc.addPriority(pageId, 10);
    } catch (error) {
      console.error('[useLoadDoc] 设置同步引擎优先级失败:', error);
    }
    
    return () => {
      
      // 🛡️ 安全清理 - 再次验证对象链有效性
      try {
        if (dispose && typeof dispose === 'function') {
          // 在调用 dispose 之前再次验证引擎状态
          if (currentWorkspace && 
              currentWorkspace.engine && 
              currentWorkspace.engine.doc &&
              typeof dispose === 'function') {
            dispose();
          }
        }
      } catch (error) {
        console.error('[useLoadDoc] 同步引擎优先级清理失败:', error);
      }
    };
  }, [currentWorkspace, pageId]);

  // 🛡️ 安全的isInTrash计算 - 使用ref和防御性检查
  const isInTrashData = useLiveData(
    useMemo(() => {
      try {
        
        // 检查组件是否仍然挂载和doc是否有效
        if (!isMountedRef.current || !doc || !doc.meta$) {
          return undefined;
        }
        
        return doc.meta$.map(meta => meta?.trash || false);
      } catch (error) {
        console.error('[useLoadDoc] 创建isInTrash Observable失败:', error);
        return undefined;
      }
    }, [doc, doc?.meta$, isMountedRef.current])
  );
  
  const isInTrash = isInTrashData || false;

  useEffect(() => {
    if (doc && isInTrash) {
      doc.blockSuiteDoc.readonly = true;
    }
  }, [doc, isInTrash]);

  return {
    doc,
    editor,
    docListReady,
  };
};

/**
 * A common wrapper for detail page for both mobile and desktop page.
 * It only contains the logic for page loading, context setup, but not the page content.
 */
export const DetailPageWrapper = ({
  pageId,
  children,
  skeleton,
  notFound,
  canAccess,
}: PropsWithChildren<{
  pageId: string;
  skeleton: ReactNode;
  notFound: ReactNode;
  canAccess?: boolean;
}>) => {
  const { doc, editor, docListReady } = useLoadDoc(pageId);
  const [searchParams] = useSearchParams();
  
  // 解析 URL 参数并设置到 editor 的 selector
  useEffect(() => {
    if (!editor) {
      return;
    }

    const params = preprocessParams(
      queryString.parse(searchParams.toString(), paramsParseOptions)
    );

    // 如果有 blockIds，直接进行文本定位和滚动
    if (params.blockIds?.length) {
      const blockId = params.blockIds[0];
      
      // 延迟执行，确保编辑器已完全渲染
      setTimeout(() => {
        locateAndScrollToBlock(blockId, editor);
      }, 1000); // 增加延迟到 1000ms
      
      // 同时设置 editor selector（用于 BlockSuite 的内部处理）
      editor.selector$.next(params);
    } else if (params.elementIds?.length || params.mode) {
      editor.selector$.next(params);
    }
  }, [editor, searchParams.toString()]);

  // 文本定位和滚动的核心函数
  const locateAndScrollToBlock = async (blockId: string, editor: any) => {
    // 先尝试通过 BlockSuite API，这是更准确的方法
    await tryBlockSuiteLocate(blockId, editor);
  };
  
  // 通过 BlockSuite API 尝试定位
  const tryBlockSuiteLocate = async (blockId: string, editor: any) => {
    try {
      // 获取 BlockSuite 编辑器容器
      let editorContainer = editor.editorContainer$.value;
      
      if (!editorContainer || !editorContainer.host) {
        // 等待编辑器容器准备好
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryContainer = editor.editorContainer$.value;
        if (!retryContainer || !retryContainer.host) {
          return;
        }
        // 使用重试后的容器
        editorContainer = retryContainer;
      }
      
      // 获取文档和块
      const host = editorContainer.host;
      const doc = host.doc;
      
      // 尝试不同的方式获取块
      let block = null;
      
      // 方法1: 通过 doc.getBlock
      if (doc && typeof doc.getBlock === 'function') {
        block = doc.getBlock(blockId);
      }
      
      // 方法2: 通过 host.view.getBlock
      if (!block && host.view && typeof host.view.getBlock === 'function') {
        block = host.view.getBlock(blockId);
      }
      
      // 方法3: 通过 store
      if (!block && doc && doc.store) {
        block = doc.store.getBlock(blockId);
      }
      
      if (block) {
        // 检查当前是否在 Edgeless 模式
        const currentMode = editor.mode$.value;
        
        if (currentMode === 'edgeless') {
          // Edgeless 模式下的处理
          const model = block.model || block;
          
          if (model && model.xywh) {
            // 获取 GFX controller
            const gfx = host.std?.get(GfxControllerIdentifier);
            
            if (gfx && gfx.viewport) {
              // 解析边界
              const bound = Bound.deserialize(model.xywh);
              
              // 获取当前视口中心点
              const currentCenterX = gfx.viewport.centerX;
              const currentCenterY = gfx.viewport.centerY;
              
              // 计算目标中心点
              const targetX = bound.center[0];
              const targetY = bound.center[1];
              
              // 创建超流畅动画效果
              const startTime = performance.now();
              const animationDuration = 1200; // 缩短到1.2秒，感觉更快
              
              const animateToTarget = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / animationDuration, 1);
                
                // 使用更平滑的缓动函数 (ease-in-out-cubic)
                const easeProgress = progress < 0.5 
                  ? 4 * progress * progress * progress 
                  : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                
                const currentX = currentCenterX + (targetX - currentCenterX) * easeProgress;
                const currentY = currentCenterY + (targetY - currentCenterY) * easeProgress;
                
                gfx.viewport.setCenter(currentX, currentY);
                
                if (progress < 1) {
                  requestAnimationFrame(animateToTarget);
                }
              };
              
              requestAnimationFrame(animateToTarget);
              
              // 等待视口动画完成
              await new Promise(resolve => setTimeout(resolve, 800));
              
              // 设置选择以高亮块
              const selection = host.std?.selection;
              if (selection) {
                // 清除现有选择
                selection.clear();
                
                // 创建块选择
                selection.setGroup('scene', [
                  selection.create(HighlightSelection, {
                    mode: 'edgeless',
                    blockIds: [blockId],
                  })
                ]);
                
                // 添加超流畅脉冲高亮动画
                setTimeout(() => {
                  const blockElement = host.querySelector(`[data-block-id="${blockId}"]`);
                  
                  if (blockElement instanceof HTMLElement) {
                    const originalBg = blockElement.style.backgroundColor;
                    const originalTransform = blockElement.style.transform;
                    const originalBoxShadow = blockElement.style.boxShadow;
                    
                    // 创建CSS关键帧动画
                    const styleSheet = document.createElement('style');
                    styleSheet.textContent = `
                      @keyframes pulse-highlight {
                        0% { 
                          background-color: ${originalBg || 'transparent'};
                          transform: scale(1);
                          box-shadow: none;
                        }
                        15% { 
                          background-color: #ffd700;
                          transform: scale(1.05);
                          box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
                        }
                        30% { 
                          background-color: #ffd700;
                          transform: scale(1.02);
                          box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
                        }
                        45% { 
                          background-color: #ffd700;
                          transform: scale(1.05);
                          box-shadow: 0 0 25px rgba(255, 215, 0, 0.9);
                        }
                        60% { 
                          background-color: #ffd700;
                          transform: scale(1.03);
                          box-shadow: 0 0 18px rgba(255, 215, 0, 0.7);
                        }
                        100% { 
                          background-color: ${originalBg || 'transparent'};
                          transform: scale(1);
                          box-shadow: none;
                        }
                      }
                    `;
                    document.head.appendChild(styleSheet);
                    
                    // 应用动画
                    blockElement.style.animation = 'pulse-highlight 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
                    
                    // 清理
                    setTimeout(() => {
                      blockElement.style.animation = '';
                      document.head.removeChild(styleSheet);
                    }, 2500);
                  }
                }, 150);
              }
            }
          } else {
            // 对于没有 xywh 的块（如文本块），使用 DOM 坐标定位
            const blockElement = host.querySelector(`[data-block-id="${blockId}"]`);
            
            if (blockElement) {
              // 获取 GFX controller
              const gfx = host.std?.get(GfxControllerIdentifier);
              
              if (gfx && gfx.viewport) {
                // 获取元素的边界矩形
                const rect = blockElement.getBoundingClientRect();
                
                // 获取编辑器容器的边界矩形，用于坐标转换
                const editorContainer = host.closest('.affine-editor-container') || host;
                const containerRect = editorContainer.getBoundingClientRect();
                
                // 计算相对于编辑器的坐标
                const relativeX = rect.left - containerRect.left + rect.width / 2;
                const relativeY = rect.top - containerRect.top + rect.height / 2;
                
                // 转换为 Edgeless 坐标系
                const viewportRect = gfx.viewport.viewportBounds;
                const zoom = gfx.viewport.zoom;
                
                // 计算目标坐标（考虑缩放和偏移）
                const targetX = viewportRect.x + relativeX / zoom;
                const targetY = viewportRect.y + relativeY / zoom;
                
                // 获取当前视口中心点
                const currentCenterX = gfx.viewport.centerX;
                const currentCenterY = gfx.viewport.centerY;
                
                // 创建超流畅动画效果
                const startTime = performance.now();
                const animationDuration = 1200; // 缩短到1.2秒，感觉更快
                
                const animateToTarget = (currentTime: number) => {
                  const elapsed = currentTime - startTime;
                  const progress = Math.min(elapsed / animationDuration, 1);
                  
                  // 使用更平滑的缓动函数 (ease-in-out-cubic)
                  const easeProgress = progress < 0.5 
                    ? 4 * progress * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                  
                  const currentX = currentCenterX + (targetX - currentCenterX) * easeProgress;
                  const currentY = currentCenterY + (targetY - currentCenterY) * easeProgress;
                  
                  gfx.viewport.setCenter(currentX, currentY);
                  
                  if (progress < 1) {
                    requestAnimationFrame(animateToTarget);
                  }
                };
                
                requestAnimationFrame(animateToTarget);
                
                // 等待视口动画完成
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // 设置选择
                const selection = host.std?.selection;
                if (selection) {
                  selection.clear();
                  selection.setGroup('scene', [
                    selection.create(HighlightSelection, {
                      mode: 'edgeless',
                      blockIds: [blockId],
                    })
                  ]);
                  
                  // 添加超流畅脉冲高亮动画
                  setTimeout(() => {
                    const originalBg = blockElement.style.backgroundColor;
                    const originalTransform = blockElement.style.transform;
                    const originalBoxShadow = blockElement.style.boxShadow;
                    
                    // 创建CSS关键帧动画
                    const styleSheet = document.createElement('style');
                    styleSheet.textContent = `
                      @keyframes pulse-highlight {
                        0% { 
                          background-color: ${originalBg || 'transparent'};
                          transform: scale(1);
                          box-shadow: none;
                        }
                        15% { 
                          background-color: #ffd700;
                          transform: scale(1.05);
                          box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
                        }
                        30% { 
                          background-color: #ffd700;
                          transform: scale(1.02);
                          box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
                        }
                        45% { 
                          background-color: #ffd700;
                          transform: scale(1.05);
                          box-shadow: 0 0 25px rgba(255, 215, 0, 0.9);
                        }
                        60% { 
                          background-color: #ffd700;
                          transform: scale(1.03);
                          box-shadow: 0 0 18px rgba(255, 215, 0, 0.7);
                        }
                        100% { 
                          background-color: ${originalBg || 'transparent'};
                          transform: scale(1);
                          box-shadow: none;
                        }
                      }
                    `;
                    document.head.appendChild(styleSheet);
                    
                    // 应用动画
                    blockElement.style.animation = 'pulse-highlight 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
                    
                    // 清理
                    setTimeout(() => {
                      blockElement.style.animation = '';
                      document.head.removeChild(styleSheet);
                    }, 2500);
                  }, 150);
                }
              }
            }
          }
        } else {
          // Page 模式下的处理（原有逻辑）
          const selection = host.std?.selection;
          if (selection) {
            selection.setGroup('note', [
              selection.create('text', {
                from: { blockId: blockId, index: 0, length: 0 },
                to: null
              })
            ]);
            
            // 滚动到视图
            const blockElement = host.querySelector(`[data-block-id="${blockId}"]`);
            if (blockElement) {
              blockElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          }
        }
      } else {
        // 尝试通过 DOM 查找作为后备方案
        const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
        
        if (blockElement && editorContainer.host) {
          const currentMode = editor.mode$.value;
          if (currentMode === 'edgeless') {
            // 尝试从 DOM 元素获取位置信息
            const rect = blockElement.getBoundingClientRect();
            
            // 这里可能需要更复杂的坐标转换逻辑
          } else {
            // Page 模式下直接滚动
            blockElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }
      }
    } catch (error) {
      console.error('[DetailPageWrapper] Error in BlockSuite locate:', error);
    }
  };
  
  // 使用 ref 缓存渲染结果，避免因为状态快速变化导致的频繁重渲染
  const renderCacheRef = useRef<{
    lastDoc: Doc | null;
    lastEditor: Editor | null;
    lastRenderTime: number;
  }>({
    lastDoc: null,
    lastEditor: null,
    lastRenderTime: 0,
  });
  
  // 防止在极短时间内的重复渲染
  const now = Date.now();
  const timeSinceLastRender = now - renderCacheRef.current.lastRenderTime;
  
  // 如果在50ms内且doc/editor没有变化，使用缓存的结果
  if (timeSinceLastRender < 50 && 
      renderCacheRef.current.lastDoc === doc && 
      renderCacheRef.current.lastEditor === editor) {
  } else {
    // 更新缓存
    renderCacheRef.current = {
      lastDoc: doc,
      lastEditor: editor,
      lastRenderTime: now,
    };
  }
  
  // if sync engine has been synced and the page is null, show 404 page.
  if (docListReady && !doc) {
    return notFound;
  }

  if (canAccess === undefined || !doc || !editor) {
    return skeleton;
  } else if (!canAccess) {
    return notFound;
  }

  return (
    <FrameworkScope scope={doc.scope}>
      <FrameworkScope scope={editor.scope}>{children}</FrameworkScope>
    </FrameworkScope>
  );
};

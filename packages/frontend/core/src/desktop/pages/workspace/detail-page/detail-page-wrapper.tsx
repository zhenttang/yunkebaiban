import { type Doc, DocsService } from '@affine/core/modules/doc';
import type { Editor } from '@affine/core/modules/editor';
import { EditorsService } from '@affine/core/modules/editor';
import { ViewService } from '@affine/core/modules/workbench/services/view';
import { WorkspaceService } from '@affine/core/modules/workspace';
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

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
      console.error('❌ [AndroidEditorsServiceWrapper] 创建编辑器失败:', error);
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

  console.log('🔍 [useLoadDoc] pageId:', pageId);
  console.log('🔍 [useLoadDoc] docListReady:', docListReady);
  console.log('🔍 [useLoadDoc] docRecord:', docRecord);
  console.log('🔍 [useLoadDoc] workspaceId:', currentWorkspace.id);

  const [doc, setDoc] = useState<Doc | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  useLayoutEffect(() => {
    console.log('🚀 [useLoadDoc] useLayoutEffect 开始执行');
    console.log('🚀 [useLoadDoc] docRecord 存在:', !!docRecord);
    
    // 标记组件为已挂载
    isMountedRef.current = true;
    
    // 如果 docRecord 存在，直接打开文档
    if (docRecord) {
      console.log('✅ [useLoadDoc] docRecord 存在，直接打开文档');
      try {
        const { doc, release } = docsService.open(pageId);
        console.log('✅ [useLoadDoc] 成功打开文档:', doc);
        
        // 检查组件是否仍然挂载
        if (!isMountedRef.current) {
          console.log('⚠️ [useLoadDoc] 组件已卸载，直接清理资源');
          release();
          return;
        }
        
        setDoc(doc);
        
        // Android环境下使用异步创建编辑器
        if ((window as any).BUILD_CONFIG?.isAndroid) {
          console.log('🤖 [useLoadDoc] Android环境，使用异步创建编辑器');
          
          AndroidEditorsServiceWrapper.createEditorSafe(doc.scope, viewService)
            .then(result => {
              if (!result) {
                console.error('❌ [useLoadDoc] 无法创建编辑器');
                return;
              }
              
              // 再次检查组件状态
              if (!isMountedRef.current) {
                console.log('⚠️ [useLoadDoc] 组件已卸载，清理编辑器');
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
              console.log('✅ [useLoadDoc] 异步创建编辑器成功');
            })
            .catch(error => {
              console.error('❌ [useLoadDoc] 异步创建编辑器失败:', error);
            });
        } else {
          // 非Android环境，使用同步方式 - 添加防御性检查
          try {
            if (!doc || !doc.scope) {
              console.error('❌ [useLoadDoc] doc或doc.scope已被清理，跳过编辑器创建');
              return;
            }
            
            const editor = doc.scope.get(EditorsService).createEditor();
            const unbind = editor.bindWorkbenchView(viewService.view);
            
            // 保存资源引用
            resourcesRef.current = { unbind, editor, release };
            
            setEditor(editor);
            console.log('✅ [useLoadDoc] 成功创建编辑器');
          } catch (error) {
            console.error('❌ [useLoadDoc] 同步创建编辑器失败:', error);
            // 如果出错，至少保存release函数
            resourcesRef.current = { release };
          }
        }
        
        // 清理函数
        return () => {
          console.log('🧹 [useLoadDoc] 清理资源');
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
              console.warn('⚠️ [useLoadDoc] unbind 清理失败:', error);
            }
            
            try {
              if (resources.editor && typeof resources.editor.dispose === 'function') {
                resources.editor.dispose();
              }
            } catch (error) {
              console.warn('⚠️ [useLoadDoc] editor.dispose 清理失败:', error);
            }
            
            try {
              if (resources.release && typeof resources.release === 'function') {
                resources.release();
              }
            } catch (error) {
              console.warn('⚠️ [useLoadDoc] release 清理失败:', error);
            }
            
            // 清空引用
            resourcesRef.current = {};
          }, 100); // 延迟100ms清理
        };
      } catch (error) {
        console.error('❌ [useLoadDoc] 打开文档失败:', pageId, error);
        return () => {};
      }
    }
    
    // 如果 docRecord 不存在，尝试监听其变化（解决服务器模式下的同步延迟问题）
    console.log('⏳ [useLoadDoc] docRecord 不存在，开始监听变化');
    
    const subscription = docRecordList.doc$(pageId).subscribe(record => {
      console.log('📡 [useLoadDoc] 监听到 docRecord 变化:', record);
      
      // 检查组件是否仍然挂载
      if (!isMountedRef.current) {
        console.log('⚠️ [useLoadDoc] 组件已卸载，忽略变化');
        return;
      }
      
      if (record) {
        try {
          console.log('✅ [useLoadDoc] 延迟打开文档');
          const { doc, release } = docsService.open(pageId);
          
          // 再次检查组件状态
          if (!isMountedRef.current) {
            console.log('⚠️ [useLoadDoc] 组件已卸载，直接清理');
            release();
            return;
          }
          
          setDoc(doc);
          
          // Android环境下使用异步创建编辑器
          if ((window as any).BUILD_CONFIG?.isAndroid) {
            console.log('🤖 [useLoadDoc] Android环境，延迟模式下使用异步创建编辑器');
            
            AndroidEditorsServiceWrapper.createEditorSafe(doc.scope, viewService)
              .then(result => {
                if (!result) {
                  console.error('❌ [useLoadDoc] 延迟模式下无法创建编辑器');
                  return;
                }
                
                // 再次检查组件状态
                if (!isMountedRef.current) {
                  console.log('⚠️ [useLoadDoc] 组件已卸载，清理编辑器');
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
                console.log('✅ [useLoadDoc] 延迟模式下异步创建编辑器成功');
              })
              .catch(error => {
                console.error('❌ [useLoadDoc] 延迟模式下异步创建编辑器失败:', error);
              });
          } else {
            // 非Android环境，使用同步方式 - 添加防御性检查
            try {
              if (!doc || !doc.scope) {
                console.error('❌ [useLoadDoc] 延迟模式：doc或doc.scope已被清理，跳过编辑器创建');
                return;
              }
              
              const editor = doc.scope.get(EditorsService).createEditor();
              const unbind = editor.bindWorkbenchView(viewService.view);
              
              // 保存资源引用
              resourcesRef.current = { unbind, editor, release };
              
              setEditor(editor);
              console.log('✅ [useLoadDoc] 延迟创建编辑器成功');
            } catch (error) {
              console.error('❌ [useLoadDoc] 延迟模式同步创建编辑器失败:', error);
              // 如果出错，至少保存release函数
              resourcesRef.current = { release };
            }
          }
          
          // 清理订阅
          subscription.unsubscribe();
        } catch (error) {
          console.error('❌ [useLoadDoc] 延迟打开文档失败:', pageId, error);
        }
      }
    });

    return () => {
      console.log('🧹 [useLoadDoc] 清理订阅和资源');
      isMountedRef.current = false;
      
      // 清理订阅
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      } catch (error) {
        console.warn('⚠️ [useLoadDoc] 订阅清理失败:', error);
      }
      
      // 延迟清理资源
      setTimeout(() => {
        const resources = resourcesRef.current;
        
        if (resources.unbind) {
          try {
            resources.unbind();
          } catch (e) {
            console.warn('⚠️ [useLoadDoc] 延迟模式 unbind 清理失败:', e);
          }
        }
        
        if (resources.editor) {
          try {
            resources.editor.dispose();
          } catch (e) {
            console.warn('⚠️ [useLoadDoc] 延迟模式 editor.dispose 清理失败:', e);
          }
        }
        
        if (resources.release) {
          try {
            resources.release();
          } catch (e) {
            console.warn('⚠️ [useLoadDoc] 延迟模式 release 清理失败:', e);
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
    console.log('🎯 [useLoadDoc] 设置同步引擎优先级 pageId:', pageId);
    
    // 🛡️ 增强防御性检查 - 深度验证对象链
    const validateEngineAccess = () => {
      if (!currentWorkspace) {
        console.warn('⚠️ [useLoadDoc] currentWorkspace 未定义');
        return false;
      }
      
      if (!currentWorkspace.engine) {
        console.warn('⚠️ [useLoadDoc] currentWorkspace.engine 未定义');
        return false;
      }
      
      if (!currentWorkspace.engine.doc) {
        console.warn('⚠️ [useLoadDoc] currentWorkspace.engine.doc 未定义');
        return false;
      }
      
      if (typeof currentWorkspace.engine.doc.addPriority !== 'function') {
        console.warn('⚠️ [useLoadDoc] currentWorkspace.engine.doc.addPriority 不是函数');
        return false;
      }
      
      return true;
    };
    
    if (!validateEngineAccess()) {
      console.warn('⚠️ [useLoadDoc] 无法访问同步引擎，跳过优先级设置');
      return () => {
        console.log('🎯 [useLoadDoc] 无操作清理函数');
      };
    }
    
    console.log('🎯 [useLoadDoc] 工作空间引擎状态验证通过');
    
    let dispose: (() => void) | null = null;
    
    try {
      dispose = currentWorkspace.engine.doc.addPriority(pageId, 10);
      console.log('🎯 [useLoadDoc] 成功设置同步引擎优先级');
    } catch (error) {
      console.error('❌ [useLoadDoc] 设置同步引擎优先级失败:', error);
      console.error('错误详情:', {
        errorMessage: error.message,
        errorStack: error.stack,
        currentWorkspace: !!currentWorkspace,
        engine: !!currentWorkspace?.engine,
        doc: !!currentWorkspace?.engine?.doc,
        addPriority: typeof currentWorkspace?.engine?.doc?.addPriority
      });
    }
    
    return () => {
      console.log('🎯 [useLoadDoc] 清理同步引擎优先级');
      
      // 🛡️ 安全清理 - 再次验证对象链有效性
      try {
        if (dispose && typeof dispose === 'function') {
          // 在调用 dispose 之前再次验证引擎状态
          if (currentWorkspace && 
              currentWorkspace.engine && 
              currentWorkspace.engine.doc &&
              typeof dispose === 'function') {
            dispose();
            console.log('✅ [useLoadDoc] 同步引擎优先级清理成功');
          } else {
            console.warn('⚠️ [useLoadDoc] 引擎已释放，跳过清理');
          }
        }
      } catch (error) {
        console.error('❌ [useLoadDoc] 同步引擎优先级清理失败:', error);
        console.error('清理错误详情:', {
          errorMessage: error.message,
          errorStack: error.stack,
          disposeType: typeof dispose,
          currentWorkspace: !!currentWorkspace,
          engine: !!currentWorkspace?.engine,
          doc: !!currentWorkspace?.engine?.doc
        });
        
        // 检查是否是目标错误
        if (error.message?.includes("Cannot read properties of undefined (reading 'get')")) {
          console.error('🔥 [Android错误调试] 确认在同步引擎清理中发现目标错误!');
        }
      }
    };
  }, [currentWorkspace, pageId]);

  // 🛡️ 安全的isInTrash计算 - 使用ref和防御性检查
  const isInTrashData = useLiveData(
    useMemo(() => {
      try {
        console.log('🔍 [useLoadDoc] 创建isInTrash Observable - doc:', !!doc, 'meta$:', !!doc?.meta$, 'isMounted:', isMountedRef.current);
        
        // 检查组件是否仍然挂载和doc是否有效
        if (!isMountedRef.current || !doc || !doc.meta$) {
          console.log('⚠️ [useLoadDoc] 组件已卸载或doc无效，返回undefined Observable');
          return undefined;
        }
        
        return doc.meta$.map(meta => meta?.trash || false);
      } catch (error) {
        console.error('❌ [useLoadDoc] 创建isInTrash Observable失败:', error);
        return undefined;
      }
    }, [doc, doc?.meta$, isMountedRef.current])
  );
  
  const isInTrash = isInTrashData || false;

  useEffect(() => {
    if (doc && isInTrash) {
      console.log('🗑️ [useLoadDoc] 文档在回收站，设置为只读');
      doc.blockSuiteDoc.readonly = true;
    }
  }, [doc, isInTrash]);

  console.log('🔍 [useLoadDoc] 返回状态 - doc:', !!doc, 'editor:', !!editor, 'docListReady:', docListReady);
  
  // 🔍 调试信息：检查 useLiveData 调用
  console.log('🔍 [useLoadDoc] isInTrash计算开始 - doc存在:', !!doc, 'doc.meta$存在:', !!doc?.meta$);

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
  console.log('🎭 [DetailPageWrapper] 渲染开始 pageId:', pageId);
  console.log('🎭 [DetailPageWrapper] canAccess:', canAccess);
  
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
  
  console.log('🎭 [DetailPageWrapper] 从 useLoadDoc 获取的状态:');
  console.log('  - doc:', !!doc);
  console.log('  - editor:', !!editor);
  console.log('  - docListReady:', docListReady);
  
  // 防止在极短时间内的重复渲染
  const now = Date.now();
  const timeSinceLastRender = now - renderCacheRef.current.lastRenderTime;
  
  // 如果在50ms内且doc/editor没有变化，使用缓存的结果
  if (timeSinceLastRender < 50 && 
      renderCacheRef.current.lastDoc === doc && 
      renderCacheRef.current.lastEditor === editor) {
    console.log('⚡ [DetailPageWrapper] 使用缓存的渲染结果，避免快速重渲染');
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
    console.log('🚫 [DetailPageWrapper] 文档列表已就绪但文档不存在，显示 404');
    return notFound;
  }

  if (canAccess === undefined || !doc || !editor) {
    console.log('🔄 [DetailPageWrapper] 显示加载骨架屏，原因:');
    console.log('  - canAccess === undefined:', canAccess === undefined);
    console.log('  - !doc:', !doc);
    console.log('  - !editor:', !editor);
    return skeleton;
  } else if (!canAccess) {
    console.log('🚫 [DetailPageWrapper] 无权限访问，显示 404');
    return notFound;
  }

  console.log('✅ [DetailPageWrapper] 渲染文档内容');
  return (
    <FrameworkScope scope={doc.scope}>
      <FrameworkScope scope={editor.scope}>{children}</FrameworkScope>
    </FrameworkScope>
  );
};

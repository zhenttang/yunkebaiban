import { WriterInfoServiceExtension } from '@blocksuite/affine/shared/services';
import { OnEvent, Service } from '@toeverything/infra';

import { WorkspaceInitialized, type Workspace } from '../../workspace';
import { DocImpl } from '../../workspace/impls/doc';
import { TemporaryUserService } from './temporary-user';
import { TemporaryUserCollaboration } from '../utils/collaboration';

/**
 * 临时用户Awareness服务
 * 负责在Y.js协作系统中设置临时用户的身份信息
 */
@OnEvent(WorkspaceInitialized, i => i.onWorkspaceInitialized)
export class TemporaryUserAwarenessService extends Service {
  private initialized = new Set<string>(); // 跟踪已初始化的文档

  constructor(private readonly temporaryUserService: TemporaryUserService) {
    super();
  }

  onWorkspaceInitialized(workspace: Workspace) {
    // 只在分享模式下启用临时用户Awareness
    if (!workspace.openOptions.isSharedMode) {
      return;
    }

    console.log('[TemporaryUser] Setting up awareness for shared workspace');

    const setTemporaryUserInfo = (doc: DocImpl, force = false) => {
      // 避免重复初始化
      const docKey = `${workspace.meta.id}:${doc.id}`;
      if (!force && this.initialized.has(docKey)) {
        return;
      }
      this.initialized.add(docKey);

      const currentUser = this.temporaryUserService.getCurrentTemporaryUser();
      
      if (currentUser) {
        console.log('[TemporaryUser] Setting temporary user info in awareness:', {
          id: currentUser.id,
          name: currentUser.name,
        });

        // 使用协作工具设置临时用户状态
        TemporaryUserCollaboration.setTemporaryUserAwareness(
          doc.awarenessStore.awareness,
          currentUser
        );

        // 检查是否已有WriterInfo扩展，避免重复添加
        const hasWriterInfo = doc.storeExtensions.some(ext => 
          ext.setup && ext.setup.toString().includes('affine-writer-info-service')
        );

        if (!hasWriterInfo) {
          // 添加WriterInfo扩展以支持编辑历史
          doc.storeExtensions.push(
            WriterInfoServiceExtension({
              getWriterInfo: () => {
                return TemporaryUserCollaboration.createTemporaryUserWriterInfo(currentUser);
              },
            })
          );
        }
      } else {
        console.log('[TemporaryUser] No temporary user found, setting anonymous state');
        
        // 使用协作工具设置匿名用户状态
        TemporaryUserCollaboration.setAnonymousUserAwareness(
          doc.awarenessStore.awareness
        );
      }
    };

    // 为现有文档设置临时用户信息
    workspace.docCollection.docs.forEach((doc) => {
      if (doc instanceof DocImpl) {
        setTemporaryUserInfo(doc);
      }
    });

    // 监听新创建的文档
    const subscription = workspace.docCollection.meta.docMetaAdded.subscribe(
      docId => {
        const doc = workspace.docCollection.docs.get(docId);
        if (doc instanceof DocImpl) {
          setTemporaryUserInfo(doc);
        }
      }
    );

    // 监听临时用户状态变化
    const userChangeSubscription = this.temporaryUserService.session.user$.subscribe(
      (user) => {
        console.log('[TemporaryUser] User state changed, updating all docs:', user);
        
        // 清除初始化状态，强制更新所有文档的用户信息
        this.initialized.clear();
        workspace.docCollection.docs.forEach((doc) => {
          if (doc instanceof DocImpl) {
            setTemporaryUserInfo(doc, true); // 强制更新
          }
        });
      }
    );

    // 清理订阅
    this.disposables.push(() => {
      subscription.unsubscribe();
      userChangeSubscription.unsubscribe();
    });

    console.log('[TemporaryUser] Temporary user awareness service initialized');
  }
} 
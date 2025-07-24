import type { EditorsService } from '@affine/core/modules/editor';
import type { DocScope } from '@affine/core/modules/doc';

/**
 * Android WebView 环境下的服务包装器
 * 用于处理服务生命周期和防止竞态条件
 */
export class AndroidServiceWrapper {
  private static serviceCache = new WeakMap<any, Map<any, any>>();
  private static pendingOperations = new Map<string, Promise<any>>();

  /**
   * 安全地获取服务，带有缓存和错误处理
   */
  static async getSafeService<T>(
    scope: any,
    serviceIdentifier: any,
    operationKey: string
  ): Promise<T | null> {
    // 检查是否有正在进行的相同操作
    if (this.pendingOperations.has(operationKey)) {
      console.log(`⏳ [AndroidServiceWrapper] 等待操作完成: ${operationKey}`);
      try {
        return await this.pendingOperations.get(operationKey);
      } catch (error) {
        console.error(`❌ [AndroidServiceWrapper] 操作失败: ${operationKey}`, error);
        return null;
      }
    }

    // 创建新的操作Promise
    const operation = this._performServiceGet<T>(scope, serviceIdentifier);
    this.pendingOperations.set(operationKey, operation);

    try {
      const result = await operation;
      return result;
    } finally {
      // 延迟清理，给其他调用者一个使用缓存的机会
      setTimeout(() => {
        this.pendingOperations.delete(operationKey);
      }, 100);
    }
  }

  private static async _performServiceGet<T>(
    scope: any,
    serviceIdentifier: any
  ): Promise<T | null> {
    try {
      // 检查缓存
      if (!this.serviceCache.has(scope)) {
        this.serviceCache.set(scope, new Map());
      }
      
      const scopeCache = this.serviceCache.get(scope)!;
      if (scopeCache.has(serviceIdentifier)) {
        console.log('✅ [AndroidServiceWrapper] 从缓存返回服务');
        return scopeCache.get(serviceIdentifier);
      }

      // 延迟一帧，确保scope完全初始化
      await new Promise(resolve => requestAnimationFrame(resolve));

      // 获取服务
      const service = scope.get(serviceIdentifier);
      if (service) {
        scopeCache.set(serviceIdentifier, service);
        console.log('✅ [AndroidServiceWrapper] 成功获取并缓存服务');
        return service;
      }

      console.warn('⚠️ [AndroidServiceWrapper] 服务不存在');
      return null;
    } catch (error) {
      console.error('❌ [AndroidServiceWrapper] 获取服务失败:', error);
      return null;
    }
  }

  /**
   * 安全地创建编辑器
   */
  static async createEditorSafe(
    docScope: DocScope,
    docId: string
  ): Promise<{ editor: any; unbind: () => void } | null> {
    const operationKey = `createEditor-${docId}`;
    
    try {
      const editorsService = await this.getSafeService<EditorsService>(
        docScope,
        EditorsService,
        operationKey
      );

      if (!editorsService) {
        console.error('❌ [AndroidServiceWrapper] 无法获取EditorsService');
        return null;
      }

      // 在Android环境下，添加额外的延迟以确保服务稳定
      if ((window as any).BUILD_CONFIG?.isAndroid) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const editor = editorsService.createEditor();
      console.log('✅ [AndroidServiceWrapper] 成功创建编辑器');

      // 返回包装的unbind函数，确保安全清理
      return {
        editor,
        unbind: () => {
          try {
            if (editor && typeof editor.dispose === 'function') {
              editor.dispose();
            }
          } catch (error) {
            console.warn('⚠️ [AndroidServiceWrapper] 编辑器清理失败:', error);
          }
        }
      };
    } catch (error) {
      console.error('❌ [AndroidServiceWrapper] 创建编辑器失败:', error);
      return null;
    }
  }

  /**
   * 清理特定scope的缓存
   */
  static clearScopeCache(scope: any) {
    if (this.serviceCache.has(scope)) {
      console.log('🧹 [AndroidServiceWrapper] 清理scope缓存');
      this.serviceCache.delete(scope);
    }
  }
}
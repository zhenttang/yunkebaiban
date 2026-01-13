import { Service } from '@toeverything/infra';

import { Doc } from '../entities/doc';

export class DocService extends Service {
  // ✅ 使用私有字段缓存 Doc 实例
  private _doc: Doc | null = null;

  // ✅ 使用 getter 延迟创建 Doc，确保 DocScope.props 已经初始化
  // 注意：这个方法应该在 DocScope 创建并初始化 props 之后才被调用
  public get doc(): Doc {
    // 如果已经创建，直接返回
    if (this._doc) {
      return this._doc;
    }

    // 延迟创建 Doc 实体并缓存
    // 框架会自动注入 DocScope、DocsStore 和 WorkspaceService
    // 如果 DocScope.props 未初始化，Doc 构造函数会抛出错误
    try {
      this._doc = this.framework.createEntity(Doc);
      return this._doc;
    } catch (error) {
      // 如果创建失败，提供更清晰的错误信息
      if (error instanceof Error && error.message.includes('DocScope props')) {
        throw new Error(
          'DocService.doc cannot be accessed before DocScope is initialized. ' +
          'Make sure to call docScope.get(DocService).doc only after creating the scope with props.'
        );
      }
      throw error;
    }
  }
}

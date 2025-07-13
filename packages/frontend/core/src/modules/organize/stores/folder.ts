import { Store } from '@toeverything/infra';

import type { WorkspaceDBService } from '../../db';

export class FolderStore extends Store {
  constructor(private readonly dbService: WorkspaceDBService) {
    super();
  }

  watchNodeInfo(nodeId: string) {
    return this.dbService.db.folders.get$(nodeId);
  }

  watchNodeChildren(parentId: string | null) {
    return this.dbService.db.folders.find$({
      parentId: parentId,
    });
  }

  watchIsLoading() {
    return this.dbService.db.folders.isLoading$;
  }

  isAncestor(childId: string, ancestorId: string): boolean {
    if (childId === ancestorId) {
      return false;
    }
    const history = new Set<string>([childId]);
    let current: string = childId;
    while (current) {
      const info = this.dbService.db.folders.get(current);
      if (info === null || !info.parentId) {
        return false;
      }
      current = info.parentId;
      if (history.has(current)) {
        return false; // loop detected
      }
      history.add(current);
      if (current === ancestorId) {
        return true;
      }
    }
    return false;
  }

  createLink(
    parentId: string,
    type: 'doc' | 'tag' | 'collection',
    nodeId: string,
    index: string
  ) {
    const parent = this.dbService.db.folders.get(parentId);
    if (parent === null || parent.type !== 'folder') {
      throw new Error('未找到父文件夹');
    }

    this.dbService.db.folders.create({
      parentId,
      type,
      data: nodeId,
      index: index,
    });
  }

  renameNode(nodeId: string, name: string) {
    const node = this.dbService.db.folders.get(nodeId);
    if (node === null) {
      throw new Error('未找到节点');
    }
    if (node.type !== 'folder') {
      throw new Error('无法重命名非文件夹节点');
    }
    this.dbService.db.folders.update(nodeId, {
      data: name,
    });
  }

  createFolder(parentId: string | null, name: string, index: string) {
    if (parentId) {
      const parent = this.dbService.db.folders.get(parentId);
      if (parent === null || parent.type !== 'folder') {
        throw new Error('未找到父文件夹');
      }
    }

    return this.dbService.db.folders.create({
      parentId: parentId,
      type: 'folder',
      data: name,
      index: index,
    }).id;
  }

  removeFolder(folderId: string) {
    const info = this.dbService.db.folders.get(folderId);
    if (info === null || info.type !== 'folder') {
      throw new Error('未找到文件夹');
    }
    const stack = [info];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }
      if (current.type !== 'folder') {
        this.dbService.db.folders.delete(current.id);
      } else {
        const children = this.dbService.db.folders.find({
          parentId: current.id,
        });
        stack.push(...children);
        this.dbService.db.folders.delete(current.id);
      }
    }
  }

  removeLink(linkId: string) {
    const link = this.dbService.db.folders.get(linkId);
    if (link === null || link.type === 'folder') {
      throw new Error('未找到链接');
    }
    this.dbService.db.folders.delete(linkId);
  }

  moveNode(nodeId: string, parentId: string | null, index: string) {
    const node = this.dbService.db.folders.get(nodeId);
    if (node === null) {
      throw new Error('未找到节点');
    }

    if (parentId) {
      if (nodeId === parentId) {
        throw new Error('无法将节点移动到自身');
      }
      if (this.isAncestor(parentId, nodeId)) {
        throw new Error('无法将节点移动到其子节点');
      }
      const parent = this.dbService.db.folders.get(parentId);
      if (parent === null || parent.type !== 'folder') {
        throw new Error('未找到父文件夹');
      }
    } else {
      if (node.type !== 'folder') {
        throw new Error('根节点只能包含文件夹');
      }
    }
    this.dbService.db.folders.update(nodeId, {
      parentId,
      index,
    });
  }
}

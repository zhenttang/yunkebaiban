import { Entity, LiveData } from '@toeverything/infra';
import { combineLatest, map, of, switchMap } from 'rxjs';

import type { WorkspaceMetadata } from '../metadata';
import type { WorkspaceFlavoursService } from '../services/flavours';

export class WorkspaceList extends Entity {
  workspaces$ = LiveData.from<WorkspaceMetadata[]>(
    this.flavoursService.flavours$.pipe(
      switchMap(flavours => {
        // console.log('📚 [WorkspaceList] flavours 变化:', {
        //   count: flavours.length,
        //   flavourTypes: flavours.map(f => f.flavour)
        // });
        
        return combineLatest(flavours.map(flavour => flavour.workspaces$)).pipe(
          map(workspacesList => {
            // console.log('📚 [WorkspaceList] 接收到各 flavour 的工作区列表:', {
            //   listsCount: workspacesList.length,
            //   listsDetail: workspacesList.map((list, idx) => ({
            //     flavour: flavours[idx]?.flavour,
            //     count: list.length,
            //     ids: list.map(w => w.id)
            //   }))
            // });
            
            // 聚合所有 flavour 的工作区
            const allWorkspaces = workspacesList.flat();
            
            // console.log('📚 [WorkspaceList] 扁平化后的所有工作区:', {
            //   total: allWorkspaces.length,
            //   workspaces: allWorkspaces.map(w => ({ id: w.id, flavour: w.flavour }))
            // });
            
            // 去重：如果同一个 ID 在多个 flavour 中存在，优先使用 cloud
            const workspaceMap = new Map<string, WorkspaceMetadata>();
            const duplicates: { id: string; flavours: string[] }[] = [];
            
            allWorkspaces.forEach(workspace => {
              const existing = workspaceMap.get(workspace.id);
              if (existing) {
                // 发现重复
                const dupEntry = duplicates.find(d => d.id === workspace.id);
                if (dupEntry) {
                  dupEntry.flavours.push(workspace.flavour);
                } else {
                  duplicates.push({
                    id: workspace.id,
                    flavours: [existing.flavour, workspace.flavour]
                  });
                }
                
                // cloud 优先于 local
                if (workspace.flavour === 'cloud' && existing.flavour === 'local') {
                  console.warn(`⚠️ [WorkspaceList] 检测到重复工作区，使用 cloud 版本:`, {
                    id: workspace.id,
                    conflictingFlavours: [existing.flavour, workspace.flavour]
                  });
                  workspaceMap.set(workspace.id, workspace);
                } else if (workspace.flavour !== 'local' && existing.flavour === 'local') {
                  // 任何云端 flavour 都优先于 local
                  console.warn(`⚠️ [WorkspaceList] 检测到重复工作区，使用云端版本:`, {
                    id: workspace.id,
                    conflictingFlavours: [existing.flavour, workspace.flavour]
                  });
                  workspaceMap.set(workspace.id, workspace);
                }
              } else {
                workspaceMap.set(workspace.id, workspace);
              }
            });
            
            // 输出重复检测结果
            if (duplicates.length > 0) {
              // console.warn(`🔍 [WorkspaceList] 发现 ${duplicates.length} 个重复的工作区:`, duplicates);
              // 触发清理逻辑
              this.cleanupDuplicateWorkspaces(duplicates);
            } else {
              // console.log('✅ [WorkspaceList] 没有发现重复的工作区');
            }
            
            const result = Array.from(workspaceMap.values());
            // console.log('📚 [WorkspaceList] 去重后的最终工作区列表:', {
            //   count: result.length,
            //   workspaces: result.map(w => ({ id: w.id, flavour: w.flavour }))
            // });
            
            return result;
          })
        );
      })
    ),
    []
  );

  isRevalidating$ = LiveData.from<boolean>(
    this.flavoursService.flavours$.pipe(
      switchMap(flavours =>
        combineLatest(
          flavours.map(flavour => flavour.isRevalidating$ ?? of(false))
        ).pipe(map(isLoadings => isLoadings.some(isLoading => isLoading)))
      )
    ),
    false
  );

  workspace$(id: string) {
    return this.workspaces$.map(workspaces =>
      workspaces.find(workspace => workspace.id === id)
    );
  }

  constructor(private readonly flavoursService: WorkspaceFlavoursService) {
    super();
  }

  revalidate() {
    this.flavoursService.flavours$.value.forEach(provider => {
      provider.revalidate?.();
    });
  }

  waitForRevalidation(signal?: AbortSignal) {
    this.revalidate();
    return this.isRevalidating$.waitFor(isLoading => !isLoading, signal);
  }

  private cleanupDuplicateWorkspaces(duplicates: { id: string; flavours: string[] }[]) {
    // console.log('🧹 [WorkspaceList] 开始清理重复工作区...');
    
    duplicates.forEach(({ id, flavours }) => {
      // 如果同时存在 local 和 cloud，从 local 移除
      if (flavours.includes('local') && flavours.includes('cloud')) {
        // console.log(`🧹 [WorkspaceList] 从本地列表移除云端工作区: ${id}`);
        
        // 动态导入以避免循环依赖
        import('../../workspace-engine/impls/local').then(({ setLocalWorkspaceIds }) => {
          setLocalWorkspaceIds(ids => {
            const filtered = ids.filter(workspaceId => workspaceId !== id);
            // if (filtered.length !== ids.length) {
            //   console.log(`✅ [WorkspaceList] 已从本地列表移除: ${id}`);
            // }
            return filtered;
          });
        }).catch(err => {
          console.error('❌ [WorkspaceList] 清理本地工作区失败:', err);
        });
      }
    });
  }
}

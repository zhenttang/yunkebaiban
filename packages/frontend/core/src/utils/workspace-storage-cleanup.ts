/**
 * 工作空间存储数据清理工具
 * 
 * 用于清理localStorage中的无效工作空间数据，
 * 确保前端使用正确的工作空间ID
 */

import { DebugLogger } from '@affine/debug';

const logger = new DebugLogger('affine:workspace-storage-cleanup');

export interface ValidWorkspace {
  id: string;
  flavour: string;
}

/**
 * 清理localStorage中的无效工作空间数据
 */
export function cleanupInvalidWorkspaceStorage(validWorkspaces: ValidWorkspace[] = []) {
  logger.info('🧹 开始清理无效的工作空间存储数据');
  
  try {
    const validWorkspaceIds = new Set(validWorkspaces.map(ws => ws.id));
    let cleanupCount = 0;
    
    // 1. 清理last_workspace_id
    const lastWorkspaceId = localStorage.getItem('last_workspace_id');
    if (lastWorkspaceId && !validWorkspaceIds.has(lastWorkspaceId)) {
      logger.warn(`🚫 清理无效的last_workspace_id: ${lastWorkspaceId}`);
      localStorage.removeItem('last_workspace_id');
      cleanupCount++;
      
      // 如果有有效工作空间，设置第一个为默认
      if (validWorkspaces.length > 0) {
        localStorage.setItem('last_workspace_id', validWorkspaces[0].id);
        logger.info(`✅ 设置新的last_workspace_id: ${validWorkspaces[0].id}`);
      }
    }
    
    // 2. 清理工作空间相关的缓存数据
    const keysToCheck = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keysToCheck.push(key);
      }
    }
    
    keysToCheck.forEach(key => {
      // 检查是否是工作空间相关的缓存键
      if (key.includes('workspace') || key.includes('cloud-workspace')) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            // 尝试解析JSON数据
            let data;
            try {
              data = JSON.parse(value);
            } catch {
              data = value;
            }
            
            // 检查是否包含无效的工作空间ID
            const hasInvalidWorkspaceId = checkForInvalidWorkspaceIds(data, validWorkspaceIds);
            
            if (hasInvalidWorkspaceId) {
              logger.warn(`🚫 清理包含无效工作空间ID的缓存键: ${key}`);
              localStorage.removeItem(key);
              cleanupCount++;
            }
          }
        } catch (error) {
          logger.error(`💥 检查缓存键时出错: ${key}`, error);
        }
      }
    });
    
    // 3. 清理会话存储中的相关数据
    try {
      const sessionKeysToCheck = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          sessionKeysToCheck.push(key);
        }
      }
      
      sessionKeysToCheck.forEach(key => {
        if (key.includes('workspace')) {
          try {
            const value = sessionStorage.getItem(key);
            if (value) {
              let data;
              try {
                data = JSON.parse(value);
              } catch {
                data = value;
              }
              
              const hasInvalidWorkspaceId = checkForInvalidWorkspaceIds(data, validWorkspaceIds);
              
              if (hasInvalidWorkspaceId) {
                logger.warn(`🚫 清理sessionStorage中包含无效工作空间ID的键: ${key}`);
                sessionStorage.removeItem(key);
                cleanupCount++;
              }
            }
          } catch (error) {
            logger.error(`💥 检查sessionStorage键时出错: ${key}`, error);
          }
        }
      });
    } catch (error) {
      logger.error('💥 清理sessionStorage时出错', error);
    }
    
    logger.info(`✅ 工作空间存储数据清理完成，共清理 ${cleanupCount} 项无效数据`);
    
    // 4. 记录当前有效的工作空间
    if (validWorkspaces.length > 0) {
      logger.info('📋 当前有效的工作空间:', validWorkspaces.map(ws => ({ 
        id: ws.id, 
        flavour: ws.flavour 
      })));
    }
    
    return cleanupCount;
    
  } catch (error) {
    logger.error('💥 清理工作空间存储数据时发生错误', error);
    return 0;
  }
}

/**
 * 检查数据中是否包含无效的工作空间ID
 */
function checkForInvalidWorkspaceIds(data: any, validWorkspaceIds: Set<string>): boolean {
  if (typeof data === 'string') {
    // 检查字符串是否是无效的工作空间ID格式
    if (isWorkspaceIdLike(data) && !validWorkspaceIds.has(data)) {
      return true;
    }
  } else if (Array.isArray(data)) {
    return data.some(item => checkForInvalidWorkspaceIds(item, validWorkspaceIds));
  } else if (data && typeof data === 'object') {
    // 检查对象的所有值
    return Object.values(data).some(value => 
      checkForInvalidWorkspaceIds(value, validWorkspaceIds)
    );
  }
  
  return false;
}

/**
 * 判断字符串是否像工作空间ID
 */
function isWorkspaceIdLike(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }
  
  // UUID格式
  if (str.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return true;
  }
  
  // 其他可能的工作空间ID格式（长度在10-50之间的字母数字字符串）
  if (str.length >= 10 && str.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(str)) {
    return true;
  }
  
  return false;
}

/**
 * 获取当前存储的工作空间ID（如果有效）
 */
export function getCurrentStoredWorkspaceId(validWorkspaceIds: Set<string>): string | null {
  try {
    const storedId = localStorage.getItem('last_workspace_id');
    if (storedId && validWorkspaceIds.has(storedId)) {
      return storedId;
    }
  } catch (error) {
    logger.error('💥 获取存储的工作空间ID时出错', error);
  }
  
  return null;
}

/**
 * 设置有效的工作空间ID到存储
 */
export function setValidWorkspaceId(workspaceId: string, validWorkspaceIds: Set<string>): boolean {
  try {
    if (validWorkspaceIds.has(workspaceId)) {
      localStorage.setItem('last_workspace_id', workspaceId);
      logger.info(`✅ 已设置有效的工作空间ID: ${workspaceId}`);
      return true;
    } else {
      logger.warn(`🚫 尝试设置无效的工作空间ID: ${workspaceId}`);
      return false;
    }
  } catch (error) {
    logger.error('💥 设置工作空间ID时出错', error);
    return false;
  }
}

/**
 * 获取推荐的工作空间ID（从有效列表中选择）
 */
export function getRecommendedWorkspaceId(validWorkspaces: ValidWorkspace[]): string | null {
  if (validWorkspaces.length === 0) {
    return null;
  }
  
  // 1. 优先返回存储的有效ID
  const validIds = new Set(validWorkspaces.map(ws => ws.id));
  const storedId = getCurrentStoredWorkspaceId(validIds);
  if (storedId) {
    return storedId;
  }
  
  // 2. 返回第一个有效工作空间ID
  return validWorkspaces[0].id;
}
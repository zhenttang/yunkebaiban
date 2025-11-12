/**
 * 管理斜杠菜单的最近使用和收藏功能
 */

const RECENT_ITEMS_KEY = 'yunke-slash-recent-items';
const FAVORITE_ITEMS_KEY = 'yunke-slash-favorite-items';
const MAX_RECENT_ITEMS = 8;

export interface RecentItem {
  name: string;
  count: number; // 使用次数
  lastUsed: number; // 最后使用时间戳
}

/**
 * 获取最近使用的命令项
 */
export function getRecentItems(): RecentItem[] {
  try {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    if (!stored) return [];

    const items = JSON.parse(stored) as RecentItem[];
    // 按最后使用时间排序
    return items.sort((a, b) => b.lastUsed - a.lastUsed).slice(0, MAX_RECENT_ITEMS);
  } catch (error) {
    console.error('Failed to get recent items:', error);
    return [];
  }
}

/**
 * 记录命令使用
 */
export function recordItemUsage(itemName: string): void {
  try {
    const items = getRecentItems();
    const existingIndex = items.findIndex(item => item.name === itemName);

    if (existingIndex !== -1) {
      // 更新已有项
      items[existingIndex].count++;
      items[existingIndex].lastUsed = Date.now();
    } else {
      // 添加新项
      items.push({
        name: itemName,
        count: 1,
        lastUsed: Date.now(),
      });
    }

    // 保持最多 MAX_RECENT_ITEMS 项
    const sortedItems = items
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, MAX_RECENT_ITEMS);

    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(sortedItems));
  } catch (error) {
    console.error('Failed to record item usage:', error);
  }
}

/**
 * 获取命令使用次数（用于搜索权重计算）
 */
export function getItemUsageCount(itemName: string): number {
  const items = getRecentItems();
  const item = items.find(i => i.name === itemName);
  return item?.count ?? 0;
}

/**
 * 获取收藏的命令项
 */
export function getFavoriteItems(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITE_ITEMS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as string[];
  } catch (error) {
    console.error('Failed to get favorite items:', error);
    return [];
  }
}

/**
 * 切换收藏状态
 */
export function toggleFavorite(itemName: string): boolean {
  try {
    const favorites = getFavoriteItems();
    const index = favorites.indexOf(itemName);

    if (index !== -1) {
      // 取消收藏
      favorites.splice(index, 1);
    } else {
      // 添加收藏
      favorites.push(itemName);
    }

    localStorage.setItem(FAVORITE_ITEMS_KEY, JSON.stringify(favorites));
    return index === -1; // 返回新的收藏状态
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    return false;
  }
}

/**
 * 检查是否已收藏
 */
export function isFavorited(itemName: string): boolean {
  const favorites = getFavoriteItems();
  return favorites.includes(itemName);
}

/**
 * 清除最近使用记录
 */
export function clearRecentItems(): void {
  try {
    localStorage.removeItem(RECENT_ITEMS_KEY);
  } catch (error) {
    console.error('Failed to clear recent items:', error);
  }
}

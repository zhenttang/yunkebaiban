import { useState, useEffect } from 'react';
import { checkPermission } from '../forum-api';

const CACHE_KEY_PREFIX = 'perm_';
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

interface CacheItem {
  value: boolean;
  timestamp: number;
}

function getCachedPermission(forumId: number, permission: string): boolean | null {
  try {
    const key = `${CACHE_KEY_PREFIX}${forumId}_${permission}`;
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;

    const item: CacheItem = JSON.parse(cached);
    const now = Date.now();

    if (now - item.timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(key);
      return null;
    }

    return item.value;
  } catch {
    return null;
  }
}

function setCachedPermission(forumId: number, permission: string, value: boolean) {
  try {
    const key = `${CACHE_KEY_PREFIX}${forumId}_${permission}`;
    const item: CacheItem = { value, timestamp: Date.now() };
    sessionStorage.setItem(key, JSON.stringify(item));
  } catch {
    // Ignore cache errors
  }
}

export function usePermission(forumId: number | undefined, permission: string) {
  const [hasPermission, setHasPermission] = useState<boolean>(true); // Default true to avoid button flicker
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!forumId) {
      setHasPermission(false);
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = getCachedPermission(forumId, permission);
    if (cached !== null) {
      setHasPermission(cached);
      setLoading(false);
      return;
    }

    // Fetch from API
    setLoading(true);
    const currentUserId = 1; // TODO: Get from auth context

    checkPermission(forumId, currentUserId, permission)
      .then(result => {
        setHasPermission(result);
        setCachedPermission(forumId, permission, result);
      })
      .catch(err => {
        console.error('Permission check failed:', err);
        setHasPermission(true); // On error, show button (backend will validate)
      })
      .finally(() => setLoading(false));
  }, [forumId, permission]);

  return { hasPermission, loading };
}


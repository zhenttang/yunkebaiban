import { nanoid } from 'nanoid';

const STORAGE_KEY = 'nbstore_session_id';
let cachedSessionId: string | null = null;

export function getOrCreateSessionId(): string {
  if (cachedSessionId) {
    return cachedSessionId;
  }

  if (typeof window === 'undefined') {
    cachedSessionId = nanoid();
    return cachedSessionId;
  }

  try {
    const storage = window.localStorage;
    const existing = storage.getItem(STORAGE_KEY);
    if (existing && existing.length > 0) {
      cachedSessionId = existing;
      return cachedSessionId;
    }
    cachedSessionId = nanoid();
    storage.setItem(STORAGE_KEY, cachedSessionId);
    return cachedSessionId;
  } catch (error) {
    // localStorage 可能被禁用，退化为内存缓存
    cachedSessionId = nanoid();
    return cachedSessionId;
  }
}

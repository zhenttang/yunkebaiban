/**
 * 全局存储错误监听 Hook
 * 
 * 监听 yunke-storage-error 事件，并显示 toast 通知用户
 * 用于处理以下场景：
 * - SQLite 写入失败
 * - 离线操作队列溢出
 * - 其他存储相关错误
 */

import { useEffect, useRef } from 'react';
import { toast } from '../../utils/toast';
import type { StorageErrorEvent } from '../../modules/storage/file-native-db';

// 防抖时间（毫秒），避免短时间内重复通知
const DEBOUNCE_MS = 5000;

// 错误类型对应的 toast 配置
const ERROR_CONFIG: Record<StorageErrorEvent['type'], { severity: 'error' | 'warning' }> = {
  'write-failure': { severity: 'error' },
  'data-loss': { severity: 'error' },
  'offline-overflow': { severity: 'warning' },
};

export function useStorageErrorListener() {
  const lastErrorTimeRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const handleStorageError = (event: CustomEvent<StorageErrorEvent>) => {
      const { type, message } = event.detail;
      
      // 防抖：避免短时间内重复显示相同类型的错误
      const now = Date.now();
      const lastTime = lastErrorTimeRef.current[type] || 0;
      if (now - lastTime < DEBOUNCE_MS) {
        console.debug('[storage-error-listener] 跳过重复通知:', type);
        return;
      }
      lastErrorTimeRef.current[type] = now;

      // 显示 toast 通知
      const config = ERROR_CONFIG[type];
      toast(message, {
        // 使用红色背景表示错误，黄色表示警告
        style: config.severity === 'error' 
          ? { background: 'var(--yunke-error-color, #ef4444)', color: 'white' }
          : { background: 'var(--yunke-warning-color, #f59e0b)', color: 'white' },
      });

      console.warn('[storage-error-listener] 存储错误已通知用户:', event.detail);
    };

    // 注册事件监听器
    window.addEventListener('yunke-storage-error', handleStorageError);

    return () => {
      window.removeEventListener('yunke-storage-error', handleStorageError);
    };
  }, []);
}

export default useStorageErrorListener;

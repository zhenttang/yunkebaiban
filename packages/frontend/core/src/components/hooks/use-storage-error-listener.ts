/**
 * 全局存储错误监听 Hook
 * 
 * 监听 yunke-storage-error 事件，并显示 toast 通知用户
 * 用于处理以下场景：
 * - SQLite 写入失败
 * - 离线操作队列溢出
 * - 存储空间不足预警
 * - 数据完整性错误
 * - 其他存储相关错误
 */

import { useEffect, useRef, useCallback } from 'react';
import { toast } from '../../utils/toast';
import type { StorageErrorEvent } from '../../modules/storage/file-native-db';

// 防抖时间（毫秒），避免短时间内重复通知
const DEBOUNCE_MS = 5000;
// 严重错误的防抖时间较短，确保用户能及时看到
const CRITICAL_DEBOUNCE_MS = 30000;

// 错误类型配置
interface ErrorConfig {
  severity: 'error' | 'warning' | 'info';
  debounceMs: number;
  icon: string;
}

// 错误类型对应的 toast 配置
const ERROR_CONFIG: Record<StorageErrorEvent['type'], ErrorConfig> = {
  'write-failure': { 
    severity: 'error', 
    debounceMs: CRITICAL_DEBOUNCE_MS,
    icon: '❌'
  },
  'data-loss': { 
    severity: 'error', 
    debounceMs: CRITICAL_DEBOUNCE_MS,
    icon: '🚨'
  },
  'offline-overflow': { 
    severity: 'warning', 
    debounceMs: DEBOUNCE_MS,
    icon: '⚠️'
  },
  'storage-low': { 
    severity: 'warning', 
    debounceMs: DEBOUNCE_MS,
    icon: '💾'
  },
  'integrity-error': { 
    severity: 'error', 
    debounceMs: CRITICAL_DEBOUNCE_MS,
    icon: '🔧'
  },
};

// 获取 toast 样式
function getToastStyle(severity: ErrorConfig['severity']): React.CSSProperties {
  switch (severity) {
    case 'error':
      return { 
        background: 'var(--yunke-error-color, #ef4444)', 
        color: 'white',
        fontWeight: 500,
      };
    case 'warning':
      return { 
        background: 'var(--yunke-warning-color, #f59e0b)', 
        color: 'white',
        fontWeight: 500,
      };
    case 'info':
    default:
      return { 
        background: 'var(--yunke-info-color, #3b82f6)', 
        color: 'white',
      };
  }
}

export function useStorageErrorListener() {
  const lastErrorTimeRef = useRef<Record<string, number>>({});

  const handleStorageError = useCallback((event: CustomEvent<StorageErrorEvent>) => {
    const { type, message } = event.detail;
    
    // 获取错误配置，如果类型未知则使用默认配置
    const config = ERROR_CONFIG[type] || { 
      severity: 'warning' as const, 
      debounceMs: DEBOUNCE_MS,
      icon: '⚠️'
    };
    
    // 防抖：避免短时间内重复显示相同类型的错误
    const now = Date.now();
    const lastTime = lastErrorTimeRef.current[type] || 0;
    if (now - lastTime < config.debounceMs) {
      console.debug('[storage-error-listener] 跳过重复通知:', type);
      return;
    }
    lastErrorTimeRef.current[type] = now;

    // 显示 toast 通知（带图标）
    const displayMessage = `${config.icon} ${message}`;
    toast(displayMessage, {
      style: getToastStyle(config.severity),
    });

    // 记录到控制台
    if (config.severity === 'error') {
      console.error('[storage-error-listener] 存储错误:', event.detail);
    } else {
      console.warn('[storage-error-listener] 存储警告:', event.detail);
    }
  }, []);

  useEffect(() => {
    // 注册事件监听器
    window.addEventListener('yunke-storage-error', handleStorageError);

    return () => {
      window.removeEventListener('yunke-storage-error', handleStorageError);
    };
  }, [handleStorageError]);
}

export default useStorageErrorListener;

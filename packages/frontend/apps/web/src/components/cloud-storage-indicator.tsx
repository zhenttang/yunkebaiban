import { Button } from '@affine/component';
import { cssVarV2 } from '@toeverything/theme/v2';
import { useMemo, useState, useEffect, type CSSProperties } from 'react';

import { useCloudStorage } from '../cloud-storage-manager';

import * as styles from './cloud-storage-indicator.css';

type IndicatorVariant = 'cloud' | 'local' | 'detecting' | 'error' | 'unknown';

type VariantMeta = {
  color: string;
  text: string;
  showReconnect?: boolean;
};

const VARIANT_MAP: Record<IndicatorVariant, VariantMeta> = {
  cloud: {
    color: cssVarV2('status/success'),
    text: '云存储已连接',
  },
  local: {
    color: cssVarV2('icon/tertiary'),
    text: '本地模式',
  },
  detecting: {
    color: cssVarV2('status/warning'),
    text: '连接中…',
  },
  error: {
    color: cssVarV2('status/error'),
    text: '连接失败',
    showReconnect: true,
  },
  unknown: {
    color: cssVarV2('icon/tertiary'),
    text: '未知状态',
  },
};

const formatRelativeTime = (lastSync: Date | null): string => {
  if (!lastSync) {
    return '';
  }
  const diffSeconds = Math.floor((Date.now() - lastSync.getTime()) / 1000);

  if (diffSeconds < 60) {
    return '刚刚同步';
  }
  if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)}分钟前同步`;
  }
  if (diffSeconds < 86400) {
    return `${Math.floor(diffSeconds / 3600)}小时前同步`;
  }
  return `${Math.floor(diffSeconds / 86400)}天前同步`;
};

export const CloudStorageIndicator = () => {
  const { isConnected, storageMode, lastSync, reconnect, pendingOperationsCount } =
    useCloudStorage();

  // 手动关闭状态
  const [isManuallyHidden, setIsManuallyHidden] = useState(false);
  // 自动隐藏状态
  const [isAutoHidden, setIsAutoHidden] = useState(false);

  const variant = useMemo<IndicatorVariant>(() => {
    if (pendingOperationsCount > 0) {
      return 'detecting';
    }

    if (storageMode === 'cloud') {
      return 'cloud';
    }

    if (storageMode === 'local') {
      return 'local';
    }

    if (storageMode === 'detecting') {
      return 'detecting';
    }

    if (storageMode === 'error') {
      return 'error';
    }

    return 'unknown';
  }, [pendingOperationsCount, storageMode]);

  // 当状态变化时，重置自动隐藏和手动隐藏
  useEffect(() => {
    setIsAutoHidden(false);
    setIsManuallyHidden(false);

    // 如果是成功连接状态（cloud），5秒后自动隐藏
    if (variant === 'cloud' && pendingOperationsCount === 0) {
      const timer = setTimeout(() => {
        setIsAutoHidden(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [variant, pendingOperationsCount]);

  const meta = VARIANT_MAP[variant];
  const secondaryText =
    pendingOperationsCount > 0
      ? `剩余 ${pendingOperationsCount} 项待同步`
      : formatRelativeTime(lastSync ?? null);

  const shouldHide = 
    isManuallyHidden || 
    isAutoHidden || 
    (variant === 'unknown' && !pendingOperationsCount);

  const handleClose = () => {
    setIsManuallyHidden(true);
  };

  return (
    <div
      className={styles.container}
      data-hidden={shouldHide ? 'true' : 'false'}
      style={{
        // 新 token 方案尚未覆盖全部场景，先通过 CSS 变量兼容历史色值
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        '--cloud-indicator-color': meta.color,
      } as CSSProperties}
    >
      <span className={styles.statusDot} />
      <div className={styles.content}>
        <span className={styles.primaryText}>
          {pendingOperationsCount > 0 ? '同步中…' : meta.text}
        </span>
        {secondaryText ? (
          <span className={styles.secondaryText}>{secondaryText}</span>
        ) : null}
      </div>
      {pendingOperationsCount > 0 ? (
        <span className={styles.badge}>{pendingOperationsCount}</span>
      ) : null}
      {(!isConnected || meta.showReconnect) && storageMode !== 'detecting' ? (
        <div className={styles.actions}>
          <Button size="small" variant="primary" onClick={reconnect}>
            重新连接
          </Button>
        </div>
      ) : null}
      <button
        className={styles.closeButton}
        onClick={handleClose}
        title="关闭"
        aria-label="关闭提示"
      >
        ✕
      </button>
    </div>
  );
};

export default CloudStorageIndicator;

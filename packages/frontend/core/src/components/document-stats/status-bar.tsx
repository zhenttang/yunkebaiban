import { useEffect, useState } from 'react';
import type { Doc } from '@toeverything/infra';
import debounce from 'lodash-es/debounce';
import { calculateDocumentStats, formatNumber, type DocumentStats } from './calculator';
import * as styles from './status-bar.css';

interface StatusBarProps {
  doc: Doc;
  onToggleDetail: () => void;
}

export function DocumentStatsStatusBar({ doc, onToggleDetail }: StatusBarProps) {
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // 初始计算
    const updateStats = () => {
      try {
        const newStats = calculateDocumentStats(doc);
        setStats(newStats);
      } catch (error) {
        console.error('Failed to update document stats:', error);
      }
    };

    // 使用 debounce 避免频繁计算
    const debouncedUpdate = debounce(updateStats, 500);

    // 立即执行一次
    updateStats();

    // 监听文档变化
    const blockSuiteDoc = doc.blockSuiteDoc;
    if (blockSuiteDoc && blockSuiteDoc.slots && blockSuiteDoc.slots.blockUpdated) {
      // 监听文档的块变化（使用 subscribe 而不是 on）
      const subscription = blockSuiteDoc.slots.blockUpdated.subscribe(() => {
        debouncedUpdate();
      });

      return () => {
        debouncedUpdate.cancel();
        subscription.unsubscribe();
      };
    }

    return () => {
      debouncedUpdate.cancel();
    };
  }, [doc]);

  if (!stats) {
    return null;
  }

  // 移动端显示简化版本
  if (isMobile) {
    return (
      <div className={styles.statusBar} onClick={onToggleDetail}>
        <div className={styles.statsText}>
          <span className={styles.statItem}>{formatNumber(stats.words)}词</span>
          <span className={styles.separator}>|</span>
          <span className={styles.statItem}>{formatNumber(stats.chars)}字</span>
          <span className={styles.separator}>|</span>
          <span className={styles.statItem}>{stats.readingTime.minutes}分钟</span>
        </div>
      </div>
    );
  }

  // 桌面端显示完整版本
  return (
    <div className={styles.statusBar} onClick={onToggleDetail}>
      <div className={styles.statsText}>
        <span className={styles.statItem}>{formatNumber(stats.words)} 词</span>
        <span className={styles.separator}>|</span>
        <span className={styles.statItem}>{formatNumber(stats.chars)} 字符</span>
        <span className={styles.separator}>|</span>
        <span className={styles.statItem}>阅读时间 {stats.readingTime.formatted}</span>
      </div>
    </div>
  );
}

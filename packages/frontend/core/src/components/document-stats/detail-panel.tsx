import { useEffect } from 'react';
import { formatNumber, type DocumentStats } from './calculator';
import * as styles from './detail-panel.css';

interface DetailPanelProps {
  stats: DocumentStats;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentStatsDetailPanel({ stats, isOpen, onClose }: DetailPanelProps) {
  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>文档统计</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          {/* 字符统计 */}
          <div className={styles.group}>
            <div className={styles.groupTitle}>字符统计</div>
            <div className={styles.statsList}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>总字符数</span>
                <span className={styles.statValue}>{formatNumber(stats.chars)}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>不含空格</span>
                <span className={styles.statValue}>{formatNumber(stats.charsNoSpaces)}</span>
              </div>
            </div>
          </div>

          {/* 词数统计 */}
          <div className={styles.group}>
            <div className={styles.groupTitle}>词数统计</div>
            <div className={styles.statsList}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>总词数</span>
                <span className={styles.statValue}>{formatNumber(stats.words)}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>中文字符</span>
                <span className={styles.statValue}>{formatNumber(stats.chineseChars)}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>英文单词</span>
                <span className={styles.statValue}>{formatNumber(stats.englishWords)}</span>
              </div>
            </div>
          </div>

          {/* 结构统计 */}
          <div className={styles.group}>
            <div className={styles.groupTitle}>文档结构</div>
            <div className={styles.statsList}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>段落数</span>
                <span className={styles.statValue}>{formatNumber(stats.paragraphs)}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>标题数</span>
                <span className={styles.statValue}>{formatNumber(stats.headings)}</span>
              </div>
            </div>
          </div>

          {/* 阅读时间 */}
          <div className={styles.group}>
            <div className={styles.groupTitle}>阅读时间</div>
            <div className={styles.statsList}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>预计时间</span>
                <span className={styles.statValue}>{stats.readingTime.formatted}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>总分钟数</span>
                <span className={styles.statValue}>{stats.readingTime.minutes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

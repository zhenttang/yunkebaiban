import { useStylusPalmRejection } from '@affine/core/mobile/hooks/use-stylus-palm-rejection';
import clsx from 'clsx';

import * as styles from './styles.css';

export interface StylusIndicatorProps {
  /**
   * 启用防误触功能
   */
  enabled?: boolean;

  /**
   * 显示位置
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  /**
   * 显示详细信息
   */
  showDetails?: boolean;
}

export const StylusIndicator = ({
  enabled = true,
  position = 'bottom-right',
  showDetails = false,
}: StylusIndicatorProps) => {
  const {
    hasStylusInput,
    isPalmRejectionActive,
    rejectedTouchCount,
    stylusInputCount,
    deactivatePalmRejection,
  } = useStylusPalmRejection({
    enabled,
    debug: false,
  });

  // 点击指示器手动退出防误触模式
  const handleClick = () => {
    if (isPalmRejectionActive) {
      deactivatePalmRejection();
    }
  };

  // 不显示任何内容，如果从未检测到触控笔
  if (!hasStylusInput && !isPalmRejectionActive) {
    return null;
  }

  return (
    <div 
      className={clsx(styles.indicator, styles[position])} 
      data-active={isPalmRejectionActive}
      onClick={handleClick}
      role="button"
      aria-label={isPalmRejectionActive ? '点击退出触控笔模式' : '触控笔已检测'}
    >
      <div className={styles.iconContainer}>
        {isPalmRejectionActive ? (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
            {/* 触控笔图标 */}
            <path
              d="M3 17.25L9.75 10.5L13.5 14.25L20.25 7.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="20.25" cy="7.5" r="1.5" fill="currentColor" />
            {/* 手掌被禁止图标 */}
            <path
              d="M10 20C10 20 8 20 8 18V15M8 15V12C8 11.4477 8.44772 11 9 11C9.55228 11 10 11.4477 10 12V15M8 15H6C5.44772 15 5 14.5523 5 14V12C5 11.4477 5.44772 11 6 11C6.55228 11 7 11.4477 7 12V14"
              stroke="#ff4444"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line x1="4" y1="19" x2="11" y2="12" stroke="#ff4444" strokeWidth="1.5" />
          </svg>
        ) : (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
            {/* 触控笔图标 */}
            <path
              d="M3 17.25L9.75 10.5L13.5 14.25L20.25 7.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="20.25" cy="7.5" r="1.5" fill="currentColor" />
          </svg>
        )}
      </div>

      {showDetails && (
        <div className={styles.details}>
          <div className={styles.status}>
            {isPalmRejectionActive ? '防误触已激活' : '触控笔待机'}
          </div>
          <div className={styles.stats}>
            <span>✍️ {stylusInputCount}</span>
            {rejectedTouchCount > 0 && <span>🚫 {rejectedTouchCount}</span>}
          </div>
        </div>
      )}

      {!showDetails && (
        <div className={styles.tooltip}>
          {isPalmRejectionActive
            ? '✍️ 触控笔模式 - 点击退出'
            : '✍️ 触控笔已检测'}
        </div>
      )}
    </div>
  );
};


import type { CSSProperties, ReactNode } from 'react';

import { ArrowRightSmallIcon } from '@blocksuite/icons/rc';

import * as glassStyles from './glass.css';
import * as styles from './quick-actions.css';

export interface QuickActionCardProps {
  tone?: 'indigo' | 'emerald';
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  hint?: ReactNode;
  onClick?: () => void;
}

export const QuickActionCard = ({
  tone = 'indigo',
  icon,
  title,
  description,
  hint,
  onClick,
}: QuickActionCardProps) => {
  const toneStyle: CSSProperties =
    tone === 'emerald'
      ? {
          background:
            'linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(255, 255, 255, 0.9))',
        }
      : {
          background:
            'linear-gradient(135deg, rgba(79, 70, 229, 0.06), rgba(255, 255, 255, 0.9))',
        };

  const iconBg: CSSProperties =
    tone === 'emerald'
      ? { backgroundColor: '#ecfdf5', color: '#059669' }
      : { backgroundColor: '#eef2ff', color: '#4f46e5' };

  return (
    <button
      type="button"
      className={`${glassStyles.glassCard} ${styles.card}`}
      style={toneStyle}
      onClick={onClick}
    >
      <div className={styles.cardAccent} />
      <div className={styles.iconWrapper} style={iconBg}>
        {icon}
      </div>
      <div className={styles.title}>{title}</div>
      {description ? (
        <div className={styles.description}>{description}</div>
      ) : null}
      {hint ? (
        <div className={styles.hintRow}>
          <span>{hint}</span>
          <ArrowRightSmallIcon style={{ width: 14, height: 14 }} />
        </div>
      ) : null}
    </button>
  );
};

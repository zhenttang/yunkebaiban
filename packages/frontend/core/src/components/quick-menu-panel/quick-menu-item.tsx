import type { ReactNode } from 'react';
import { memo } from 'react';

import * as styles from './index.css';

export interface QuickMenuItemProps {
  icon: ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
  active?: boolean;
}

export const QuickMenuItem = memo(({
  icon,
  title,
  description,
  onClick,
  active = false,
}: QuickMenuItemProps) => {
  return (
    <div
      className={styles.quickMenuItem}
      onClick={onClick}
      data-active={active}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.quickMenuItemIcon}>{icon}</div>
      <div className={styles.quickMenuItemContent}>
        <div className={styles.quickMenuItemTitle}>{title}</div>
        {description && (
          <div className={styles.quickMenuItemDescription}>{description}</div>
        )}
      </div>
    </div>
  );
});

QuickMenuItem.displayName = 'QuickMenuItem';

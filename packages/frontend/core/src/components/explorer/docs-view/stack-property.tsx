import type { ReactNode } from 'react';

import * as styles from './properties.css';

export const StackProperty = ({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) => {
  return (
    <div className={styles.stackItem}>
      <div className={styles.stackItemContent}>
        <div className={styles.stackItemIcon}>{icon}</div>
        <div className={styles.stackItemLabel}>{children}</div>
      </div>
    </div>
  );
};

import type { PropsWithChildren, ReactNode } from 'react';

import * as ambientStyles from './ambient.css';
import * as glassStyles from './glass.css';
import * as styles from './layout-shell.css';

export interface DashboardLayoutShellProps {
  sidebar?: ReactNode;
}

export const DashboardLayoutShell = ({
  sidebar,
  children,
}: PropsWithChildren<DashboardLayoutShellProps>) => {
  return (
    <div className={styles.root}>
      {/* Ambient background glows */}
      <div className={ambientStyles.primaryGlow} />
      <div className={ambientStyles.secondaryGlow} />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${glassStyles.glassSurface}`}>
        {sidebar}
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        <div className={styles.mainInner}>{children}</div>
      </main>
    </div>
  );
};


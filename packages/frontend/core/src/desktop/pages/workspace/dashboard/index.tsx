import { DashboardLayoutShell } from '@yunke/core/components/dashboard/layout-shell';
import { WorkspaceDashboardMain } from '@yunke/core/components/dashboard/workspace-dashboard-main';
import { WorkspaceSidebarDashboard } from '@yunke/core/components/dashboard/workspace-sidebar-dashboard';
import type { ReactElement } from 'react';

export const Component = (): ReactElement => {
  return (
    <DashboardLayoutShell sidebar={<WorkspaceSidebarDashboard />}>
      <WorkspaceDashboardMain />
    </DashboardLayoutShell>
  );
};


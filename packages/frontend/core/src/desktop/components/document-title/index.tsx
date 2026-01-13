import { NotificationCountService } from '@yunke/core/modules/notification';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import { useLiveData, useService } from '@toeverything/infra';
import { useEffect } from 'react';

export const DocumentTitle = () => {
  const notificationCountService = useService(NotificationCountService);
  const notificationCount = useLiveData(notificationCountService.count$);
  const workbenchService = useService(WorkbenchService);
  const workbenchView = useLiveData(workbenchService.workbench.activeView$);
  const viewTitle = useLiveData(workbenchView.title$);

  useEffect(() => {
    const prefix = notificationCount > 0 ? `(${notificationCount}) ` : '';
    document.title = prefix + (viewTitle ? `${viewTitle} · YUNKE` : 'YUNKE');

    return () => {
      document.title = 'YUNKE';
    };
  }, [notificationCount, viewTitle]);

  return null;
};

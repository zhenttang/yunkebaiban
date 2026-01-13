import {
  WorkbenchLink,
  WorkbenchService,
} from '@yunke/core/modules/workbench';
import { useLiveData, useService } from '@toeverything/infra';

import * as styles from './style.css';

interface Tab {
  to: string;
  label: string;
}

const tabs: Tab[] = [
  {
    to: '/all',
    label: '文档',
  },
  {
    to: '/collection',
    label: '收藏夹',
  },
  {
    to: '/tag',
    label: '标签',
  },
];

export const AllDocsTabs = () => {
  const workbench = useService(WorkbenchService).workbench;
  const location = useLiveData(workbench.location$);

  return (
    <ul className={styles.tabs}>
      {tabs.map(tab => {
        return (
          <WorkbenchLink
            data-active={location.pathname === tab.to}
            replaceHistory
            className={styles.tab}
            key={tab.to}
            to={tab.to}
          >
            {tab.label}
          </WorkbenchLink>
        );
      })}
    </ul>
  );
};

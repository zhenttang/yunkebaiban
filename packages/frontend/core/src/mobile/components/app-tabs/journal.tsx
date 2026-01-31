import { DocDisplayMetaService } from '@yunke/core/modules/doc-display-meta';
import { JournalService } from '@yunke/core/modules/journal';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import { TodayIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback } from 'react';

import type { AppTabCustomFCProps } from './data';
import { useNavigationSyncContext } from './navigation-context';
import { TabItem } from './tab-item';

export const AppTabJournal = ({ tab }: AppTabCustomFCProps) => {
  const workbench = useService(WorkbenchService).workbench;
  const location = useLiveData(workbench.location$);
  const journalService = useService(JournalService);
  const docDisplayMetaService = useService(DocDisplayMetaService);
  const { markUserNavigation } = useNavigationSyncContext();

  const maybeDocId = location.pathname.split('/')[1];
  const journalDate = useLiveData(journalService.journalDate$(maybeDocId));
  const JournalIcon = useLiveData(docDisplayMetaService.icon$(maybeDocId));

  const handleOpenToday = useCallback(() => {
    console.log(`[Journal] 打开今日日记`);
    
    // 🔧 标记用户主动导航
    markUserNavigation();
    
    const docId = journalService.ensureJournalByDate(new Date()).id;
    workbench.openDoc({ docId, fromTab: 'true' }, { at: 'active' });
  }, [journalService, workbench, markUserNavigation]);

  const Icon = journalDate ? JournalIcon : TodayIcon;

  return (
    <TabItem onClick={handleOpenToday} id={tab.key} label="Journal">
      <Icon />
    </TabItem>
  );
};

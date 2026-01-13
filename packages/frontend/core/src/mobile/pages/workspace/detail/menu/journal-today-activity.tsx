import { MenuItem, MenuSeparator, MobileMenuSub } from '@yunke/component';
import { sortPagesByDate } from '@yunke/core/desktop/pages/workspace/detail-page/tabs/journal';
import {
  type DocRecord,
  DocService,
  DocsService,
} from '@yunke/core/modules/doc';
import { DocDisplayMetaService } from '@yunke/core/modules/doc-display-meta';
import { JournalService } from '@yunke/core/modules/journal';
import { WorkbenchLink } from '@yunke/core/modules/workbench';
import { useI18n } from '@yunke/i18n';
import { HistoryIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import dayjs from 'dayjs';
import { type ReactNode, useCallback, useMemo } from 'react';

import * as styles from './journal-today-activity.css';

interface JournalTodayActivityMenuItemProps {
  prefix?: ReactNode;
  suffix?: ReactNode;
}
type Category = 'created' | 'updated';

const DocItem = ({ docId }: { docId: string }) => {
  const docDisplayMetaService = useService(DocDisplayMetaService);
  const Icon = useLiveData(docDisplayMetaService.icon$(docId));
  const title = useLiveData(docDisplayMetaService.title$(docId));
  return (
    <WorkbenchLink aria-label={title} to={`/${docId}`}>
      <MenuItem prefixIcon={<Icon />}>{title}</MenuItem>
    </WorkbenchLink>
  );
};

const ActivityBlock = ({
  name,
  list,
}: {
  name: Category;
  list: DocRecord[];
}) => {
  const t = useI18n();

  const title =
    name === 'created'
      ? t['com.yunke.journal.created-today']()
      : t['com.yunke.journal.updated-today']();
  return (
    <>
      <div className={styles.title}>{title}</div>
      {list.length > 0 ? (
        list.map(doc => {
          return <DocItem docId={doc.id} key={doc.id} />;
        })
      ) : (
        <div className={styles.empty}>
          {name === 'created'
            ? t['com.yunke.journal.daily-count-created-empty-tips']()
            : t['com.yunke.journal.daily-count-updated-empty-tips']()}
        </div>
      )}
    </>
  );
};

const TodaysActivity = ({ date }: { date: string }) => {
  const docRecords = useLiveData(useService(DocsService).list.docs$);
  const getTodaysPages = useCallback(
    (field: 'createDate' | 'updatedDate') => {
      return sortPagesByDate(
        docRecords.filter(docRecord => {
          const meta = docRecord.meta$.value;
          if (meta.trash) return false;
          return meta[field] && dayjs(meta[field]).isSame(date, 'day');
        }),
        field
      );
    },
    [date, docRecords]
  );

  const createdToday = useMemo(
    () => getTodaysPages('createDate'),
    [getTodaysPages]
  );
  const updatedToday = useMemo(
    () => getTodaysPages('updatedDate'),
    [getTodaysPages]
  );

  return (
    <>
      <ActivityBlock name="created" list={createdToday} />
      <MenuSeparator />
      <ActivityBlock name="updated" list={updatedToday} />
    </>
  );
};

export const JournalTodayActivityMenuItem = ({
  prefix,
  suffix,
}: JournalTodayActivityMenuItemProps) => {
  const docService = useService(DocService);
  const journalService = useService(JournalService);

  const docId = docService.doc.id;
  const journalDate = useLiveData(journalService.journalDate$(docId));

  const t = useI18n();

  if (!journalDate) return null;

  return (
    <>
      {prefix}
      <MobileMenuSub
        triggerOptions={{
          prefixIcon: <HistoryIcon />,
        }}
        items={<TodaysActivity date={journalDate} />}
        title={t['com.yunke.m.selector.journal-menu.today-activity']()}
      >
        {t['com.yunke.m.selector.journal-menu.today-activity']()}
      </MobileMenuSub>
      {suffix}
    </>
  );
};

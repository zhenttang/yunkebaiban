import type { WeekDatePickerHandle } from '@yunke/component';
import { WeekDatePicker } from '@yunke/component';
import { useJournalRouteHelper } from '@yunke/core/components/hooks/use-journal';
import { JournalService } from '@yunke/core/modules/journal';
import type { Store } from '@blocksuite/yunke/store';
import { useLiveData, useService } from '@toeverything/infra';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';

export interface JournalWeekDatePickerProps {
  page: Store;
}

const weekStyle = { maxWidth: 800, width: '100%' };
export const JournalWeekDatePicker = ({ page }: JournalWeekDatePickerProps) => {
  const handleRef = useRef<WeekDatePickerHandle>(null);
  const journalService = useService(JournalService);
  const journalDateStr = useLiveData(journalService.journalDate$(page.id));
  const journalDate = journalDateStr ? dayjs(journalDateStr) : null;
  const { openJournal } = useJournalRouteHelper();
  const [date, setDate] = useState(
    (journalDate ?? dayjs()).format('YYYY-MM-DD')
  );

  useEffect(() => {
    if (!journalDate) return;
    setDate(journalDate.format('YYYY-MM-DD'));
    handleRef.current?.setCursor?.(journalDate);
  }, [journalDate]);

  return (
    <WeekDatePicker
      data-testid="journal-week-picker"
      handleRef={handleRef}
      style={weekStyle}
      value={date}
      onChange={openJournal}
    />
  );
};

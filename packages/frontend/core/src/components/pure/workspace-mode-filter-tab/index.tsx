import { RadioGroup, type RadioItem } from '@yunke/component';
import type { AllPageFilterOption } from '@yunke/core/components/atoms';
import { allPageFilterSelectAtom } from '@yunke/core/components/atoms';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import { useI18n } from '@yunke/i18n';
import { useService } from '@toeverything/infra';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';

import * as styles from './index.css';

export const WorkspaceModeFilterTab = ({
  activeFilter,
}: {
  activeFilter: AllPageFilterOption;
}) => {
  const t = useI18n();
  const [value, setValue] = useState(activeFilter);
  const [filterMode, setFilterMode] = useAtom(allPageFilterSelectAtom);
  const workbenchService = useService(WorkbenchService);
  const handleValueChange = useCallback(
    (value: AllPageFilterOption) => {
      switch (value) {
        case 'collections':
          workbenchService.workbench.openCollections();
          break;
        case 'tags':
          workbenchService.workbench.openTags();
          break;
        case 'docs':
          workbenchService.workbench.openAll();
          break;
      }
    },
    [workbenchService.workbench]
  );

  useEffect(() => {
    if (value !== activeFilter) {
      setValue(activeFilter);
      setFilterMode(activeFilter);
    }
  }, [activeFilter, filterMode, setFilterMode, value]);

  return (
    <RadioGroup
      style={{ maxWidth: '100%', width: 273 }}
      value={value}
      onChange={handleValueChange}
      items={useMemo<RadioItem[]>(
        () => [
          {
            value: 'docs',
            label: t['com.yunke.docs.header'](),
            testId: 'workspace-docs-button',
            className: styles.filterTab,
          },
          {
            value: 'collections',
            label: t['com.yunke.collections.header'](),
            testId: 'workspace-collections-button',
            className: styles.filterTab,
          },
          {
            value: 'tags',
            label: t['Tags'](),
            testId: 'workspace-tags-button',
            className: styles.filterTab,
          },
        ],
        [t]
      )}
    />
  );
};

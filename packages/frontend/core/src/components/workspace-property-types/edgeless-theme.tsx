import {
  Menu,
  MenuItem,
  type MenuRef,
  PropertyValue,
  type RadioItem,
} from '@yunke/component';
import type { FilterParams } from '@yunke/core/modules/collection-rules';
import { type DocRecord, DocService } from '@yunke/core/modules/doc';
import { useI18n } from '@yunke/i18n';
import { EdgelessIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { PlainTextDocGroupHeader } from '../explorer/docs-view/group-header';
import { StackProperty } from '../explorer/docs-view/stack-property';
import type { GroupHeaderProps } from '../explorer/types';
import type { PropertyValueProps } from '../properties/types';
import { PropertyRadioGroup } from '../properties/widgets/radio-group';
import * as styles from './edgeless-theme.css';

const getThemeOptions = (t: ReturnType<typeof useI18n>) =>
  [
    {
      value: 'system',
      label: t['com.yunke.themeSettings.auto'](),
    },
    {
      value: 'light',
      label: t['com.yunke.themeSettings.light'](),
    },
    {
      value: 'dark',
      label: t['com.yunke.themeSettings.dark'](),
    },
  ] satisfies RadioItem[];

export const EdgelessThemeValue = ({
  onChange,
  readonly,
}: PropertyValueProps) => {
  const t = useI18n();
  const doc = useService(DocService).doc;
  const edgelessTheme = useLiveData(doc.properties$).edgelessColorTheme;

  const handleChange = useCallback(
    (theme: string) => {
      doc.record.setProperty('edgelessColorTheme', theme);
      onChange?.(theme, true);
    },
    [doc, onChange]
  );
  const themeItems = useMemo<RadioItem[]>(() => getThemeOptions(t), [t]);

  return (
    <PropertyValue
      className={styles.container}
      hoverable={false}
      readonly={readonly}
    >
      <PropertyRadioGroup
        value={edgelessTheme || 'system'}
        onChange={handleChange}
        items={themeItems}
        disabled={readonly}
      />
    </PropertyValue>
  );
};

export const EdgelessThemeDocListProperty = ({ doc }: { doc: DocRecord }) => {
  const t = useI18n();
  const edgelessTheme = useLiveData(
    doc.properties$.selector(p => p.edgelessColorTheme)
  );

  return (
    <StackProperty icon={<EdgelessIcon />}>
      {edgelessTheme === 'system' || !edgelessTheme
        ? t['com.yunke.themeSettings.auto']()
        : edgelessTheme === 'light'
          ? t['com.yunke.themeSettings.light']()
          : t['com.yunke.themeSettings.dark']()}
    </StackProperty>
  );
};

export const EdgelessThemeFilterValue = ({
  filter,
  isDraft,
  onDraftCompleted,
  onChange,
}: {
  filter: FilterParams;
  isDraft?: boolean;
  onDraftCompleted?: () => void;
  onChange?: (filter: FilterParams) => void;
}) => {
  const t = useI18n();
  const menuRef = useRef<MenuRef>(null);

  useEffect(() => {
    if (isDraft) {
      menuRef.current?.changeOpen(true);
    }
  }, [isDraft]);

  return (
    <Menu
      ref={menuRef}
      rootOptions={{
        onClose: onDraftCompleted,
      }}
      items={
        <>
          <MenuItem
            onClick={() => {
              onChange?.({
                ...filter,
                value: 'system',
              });
            }}
            selected={filter.value === 'system'}
          >
            {t['com.yunke.themeSettings.auto']()}
          </MenuItem>
          <MenuItem
            onClick={() => {
              onChange?.({
                ...filter,
                value: 'light',
              });
            }}
            selected={filter.value === 'light'}
          >
            {t['com.yunke.themeSettings.light']()}
          </MenuItem>
          <MenuItem
            onClick={() => {
              onChange?.({
                ...filter,
                value: 'dark',
              });
            }}
            selected={filter.value === 'dark'}
          >
            {t['com.yunke.themeSettings.dark']()}
          </MenuItem>
        </>
      }
    >
      <span>
        {filter.value === 'system'
          ? t['com.yunke.themeSettings.auto']()
          : filter.value === 'light'
            ? t['com.yunke.themeSettings.light']()
            : t['com.yunke.themeSettings.dark']()}
      </span>
    </Menu>
  );
};

export const EdgelessThemeGroupHeader = ({
  groupId,
  docCount,
}: GroupHeaderProps) => {
  const t = useI18n();
  const text =
    groupId === 'light'
      ? t['com.yunke.themeSettings.light']()
      : groupId === 'dark'
        ? t['com.yunke.themeSettings.dark']()
        : groupId === 'system'
          ? t['com.yunke.themeSettings.auto']()
          : '默认';

  return (
    <PlainTextDocGroupHeader groupId={groupId} docCount={docCount}>
      {text}
    </PlainTextDocGroupHeader>
  );
};

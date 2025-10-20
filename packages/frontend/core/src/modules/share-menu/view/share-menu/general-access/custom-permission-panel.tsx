import { Button } from '@yunke/component/ui/button';
import { Checkbox } from '@yunke/component/ui/checkbox';
import { useI18n } from '@yunke/i18n';
import { useState, useMemo, useCallback } from 'react';

import { DocPermission, PermissionMask, hasPermission } from '@yunke/core/modules/share-doc/types';

export interface CustomPermissionPanelProps {
  initialMask: PermissionMask;
  disabled?: boolean;
  onConfirm: (mask: PermissionMask) => void;
  onCancel?: () => void;
}

export const CustomPermissionPanel = ({
  initialMask,
  disabled,
  onConfirm,
  onCancel,
}: CustomPermissionPanelProps) => {
  const t = useI18n();
  const [mask, setMask] = useState<PermissionMask>(initialMask);

  const update = useCallback((flag: DocPermission, checked: boolean) => {
    setMask(prev => (checked ? prev | flag : prev & ~flag));
  }, []);

  const items = useMemo(
    () => [
      { key: 'read', flag: DocPermission.Read },
      { key: 'comment', flag: DocPermission.Comment },
      { key: 'add', flag: DocPermission.Add },
      { key: 'modify', flag: DocPermission.Modify },
      { key: 'delete', flag: DocPermission.Delete },
      { key: 'export', flag: DocPermission.Export },
      { key: 'share', flag: DocPermission.Share },
      { key: 'invite', flag: DocPermission.Invite },
      { key: 'manage', flag: DocPermission.Manage },
    ],
    []
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(item => (
        <Checkbox
          key={item.key}
          checked={hasPermission(mask, item.flag)}
          onChange={(_, checked) => update(item.flag, checked)}
          disabled={disabled}
          label={
            t[`com.yunke.share-menu.permission.${item.key}`]() || item.key
          }
        />
      ))}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel}>{t['Cancel']() || 'Cancel'}</Button>
        <Button
          variant="primary"
          onClick={() => onConfirm(mask)}
          disabled={disabled}
        >
          {t['Confirm']() || 'Confirm'}
        </Button>
      </div>
    </div>
  );
};



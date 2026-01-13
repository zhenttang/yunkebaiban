import { ConfirmModal } from '@yunke/component/ui/modal';
import { useI18n } from '@yunke/i18n';
import { useCallback } from 'react';

import * as styles from './member-limit-modal.css';

export interface MemberLimitModalProps {
  isFreePlan: boolean;
  open: boolean;
  plan: string;
  quota: string;
  setOpen: (value: boolean) => void;
  onConfirm: () => void;
}

export const MemberLimitModal = ({
  isFreePlan,
  open,
  plan,
  quota,
  setOpen,
  onConfirm,
}: MemberLimitModalProps) => {
  const t = useI18n();
  const handleConfirm = useCallback(() => {
    setOpen(false);
    onConfirm();
  }, [onConfirm, setOpen]);

  return (
    <ConfirmModal
      open={open}
      onOpenChange={setOpen}
      title={t['com.yunke.payment.member-limit.title']()}
      description={
        <ConfirmDescription plan={plan} quota={quota} isFreePlan={isFreePlan} />
      }
      confirmText={t['com.yunke.payment.upgrade']()}
      confirmButtonOptions={{
        variant: 'primary',
      }}
      onConfirm={handleConfirm}
    ></ConfirmModal>
  );
};

export const ConfirmDescription = ({
  isFreePlan,
  plan,
  quota,
}: {
  isFreePlan: boolean;
  plan: string;
  quota: string;
}) => {
  const t = useI18n();
  return (
    <div>
      {t['com.yunke.payment.member-limit.description']({
        planName: plan,
        quota: quota,
      })}
      <ul className={styles.ulStyle}>
        {isFreePlan && (
          <li className={styles.liStyle}>
            <div className={styles.prefixDot} />
            {t[
              'com.yunke.payment.member-limit.description.tips-for-free-plan'
            ]()}
          </li>
        )}
        <li className={styles.liStyle}>
          <div className={styles.prefixDot} />
          {t['com.yunke.payment.member-limit.description.tips-1']()}
        </li>
        <li className={styles.liStyle}>
          <div className={styles.prefixDot} />
          {t['com.yunke.payment.member-limit.description.tips-2']()}
        </li>
      </ul>
    </div>
  );
};

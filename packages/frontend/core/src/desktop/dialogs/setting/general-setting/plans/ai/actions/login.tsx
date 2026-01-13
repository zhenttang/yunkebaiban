import { Button, type ButtonProps } from '@yunke/component';
import { GlobalDialogService } from '@yunke/core/modules/dialogs';
import { useI18n } from '@yunke/i18n';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

export const AILogin = (btnProps: ButtonProps) => {
  const t = useI18n();
  const globalDialogService = useService(GlobalDialogService);

  const onClickSignIn = useCallback(() => {
    globalDialogService.open('sign-in', {});
  }, [globalDialogService]);

  return (
    <Button onClick={onClickSignIn} variant="primary" {...btnProps}>
      {t['com.yunke.payment.ai.action.login.button-label']()}
    </Button>
  );
};

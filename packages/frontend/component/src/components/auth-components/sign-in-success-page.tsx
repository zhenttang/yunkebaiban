import { useI18n } from '@yunke/i18n';
import type { FC } from 'react';

import { Button } from '../../ui/button';
import { AuthPageContainer } from './auth-page-container';

export const SignInSuccessPage: FC<{
  onOpenYunke: () => void;
}> = ({ onOpenYunke }) => {
  const t = useI18n();
  return (
    <AuthPageContainer
      title={t['com.yunke.auth.signed.success.title']()}
      subtitle={t['com.yunke.auth.signed.success.subtitle']()}
    >
      <Button variant="primary" size="large" onClick={onOpenYunke}>
        {t['com.yunke.auth.open.yunke']()}
      </Button>
    </AuthPageContainer>
  );
};

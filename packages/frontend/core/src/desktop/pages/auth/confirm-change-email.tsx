import { Button } from '@yunke/component';
import { AuthPageContainer } from '@yunke/component/auth-components';
import { useNavigateHelper } from '@yunke/core/components/hooks/use-navigate-helper';
import { FetchService } from '@yunke/core/modules/cloud';
import { UserFriendlyError } from '@yunke/error';
// import { changeEmailMutation } from '@yunke/graphql';
import { useI18n } from '@yunke/i18n';
import { useService } from '@toeverything/infra';
import { type FC, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AppContainer } from '../../components/app-container';

export const ConfirmChangeEmail: FC<{
  onOpenAffine: () => void;
}> = ({ onOpenAffine }) => {
  const t = useI18n();
  const [searchParams] = useSearchParams();
  const navigateHelper = useNavigateHelper();
  const fetchService = useService(FetchService);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const token = searchParams.get('token') ?? '';
      const email = decodeURIComponent(searchParams.get('email') ?? '');
      setIsLoading(true);
      await fetchService
        .fetch('/api/auth/change-email/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email }),
        })
        .catch(err => {
          if (UserFriendlyError.fromAny(err).is('INVALID_EMAIL_TOKEN')) {
            return navigateHelper.jumpToExpired();
          }
          throw err;
        })
        .finally(() => {
          setIsLoading(false);
        });
    })().catch(err => {
      // TODO(@eyhn): Add error handling
      console.error(err);
    });
  }, [fetchService, navigateHelper, searchParams]);

  if (isLoading) {
    return <AppContainer fallback />;
  }

  return (
    <AuthPageContainer
      title={t['com.affine.auth.change.email.page.success.title']()}
      subtitle={t['com.affine.auth.change.email.page.success.subtitle']()}
    >
      <Button variant="primary" size="large" onClick={onOpenAffine}>
        {t['com.affine.auth.open.affine']()}
      </Button>
    </AuthPageContainer>
  );
};

import { Button } from '@yunke/component';
import { AuthPageContainer } from '@yunke/component/auth-components';
import { useNavigateHelper } from '@yunke/core/components/hooks/use-navigate-helper';
import { Trans, useI18n } from '@yunke/i18n';
import { useCallback } from 'react';

import * as styles from './styles.css';

/**
 * /upgrade-success/team page
 *
 * only on web
 */
export const Component = () => {
  const t = useI18n();
  const { jumpToIndex } = useNavigateHelper();

  const openWorkspace = useCallback(() => {
    jumpToIndex();
  }, [jumpToIndex]);

  const subtitle = (
    <div className={styles.copy}>
      <p>{t['com.yunke.payment.upgrade-success-page.team.text-1']()}</p>
      <p>
        <Trans
          i18nKey={'com.yunke.payment.upgrade-success-page.team.text-2'}
          components={{
            1: (
              <a
                href="mailto:support@toeverything.info"
                className={styles.highlightLink}
              />
            ),
          }}
        />
      </p>
    </div>
  );

  return (
    <AuthPageContainer
      title={t['com.yunke.payment.upgrade-success-page.title']()}
      subtitle={subtitle}
    >
      <Button variant="primary" size="extraLarge" onClick={openWorkspace}>
        {t['Visit Workspace']()}
      </Button>
    </AuthPageContainer>
  );
};

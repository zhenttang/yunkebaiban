import { Button } from '@yunke/component';
import { AuthPageContainer } from '@yunke/component/auth-components';
import { useNavigateHelper } from '@yunke/core/components/hooks/use-navigate-helper';
import { Trans, useI18n } from '@yunke/i18n';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import * as styles from './styles.css';

/**
 * /upgrade-success page
 *
 * only on web
 */
export const Component = () => {
  const t = useI18n();
  const [params] = useSearchParams();
  const { jumpToIndex, jumpToOpenInApp } = useNavigateHelper();

  const openYUNKE = useCallback(() => {
    if (params.get('client')) {
      return jumpToOpenInApp('bring-to-front');
    } else {
      jumpToIndex();
    }
  }, [jumpToIndex, jumpToOpenInApp, params]);

  const subtitle = (
    <div className={styles.copy}>
      <p>{t['com.yunke.payment.upgrade-success-page.text']()}</p>
      <p>
        <Trans
          i18nKey={'com.yunke.payment.upgrade-success-page.support'}
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
      <Button variant="primary" size="extraLarge" onClick={openYUNKE}>
        {t['com.yunke.other-page.nav.open-yunke']()}
      </Button>
    </AuthPageContainer>
  );
};

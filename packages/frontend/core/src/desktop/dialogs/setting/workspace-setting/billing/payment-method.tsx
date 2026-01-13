import { Button, notify } from '@yunke/component';
import { SettingRow } from '@yunke/component/setting-components';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import { useMutation } from '@yunke/core/components/hooks/use-mutation';
import { UrlService } from '@yunke/core/modules/url';
import { UserFriendlyError } from '@yunke/error';
// import { createCustomerPortalMutation } from '@yunke/graphql';
import { useI18n } from '@yunke/i18n';
import { useService } from '@toeverything/infra';

import * as styles from './styles.css';

export const PaymentMethodUpdater = () => {
  const { isMutating, trigger } = useMutation({
    mutation: createCustomerPortalMutation,
  });
  const urlService = useService(UrlService);
  const t = useI18n();

  const update = useAsyncCallback(async () => {
    await trigger(null, {
      onSuccess: data => {
        urlService.openExternal(data.createCustomerPortal);
      },
    }).catch(e => {
      const userFriendlyError = UserFriendlyError.fromAny(e);
      notify.error(userFriendlyError);
    });
  }, [trigger, urlService]);

  return (
    <SettingRow
      className={styles.paymentMethod}
      name={t['com.yunke.payment.billing-setting.payment-method']()}
      desc={t[
        'com.yunke.payment.billing-setting.payment-method.description'
      ]()}
    >
      <Button onClick={update} loading={isMutating} disabled={isMutating}>
        {t['com.yunke.payment.billing-setting.payment-method.go']()}
      </Button>
    </SettingRow>
  );
};

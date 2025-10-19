import { Button } from '@yunke/admin/components/ui/button';
import { useMutation } from '@yunke/admin/use-mutation';
import { notify } from '@yunke/component';
import type { UserFriendlyError } from '@yunke/error';
// import { sendTestEmailMutation } from '@yunke/graphql';

// 临时占位符，用于替代 @yunke/graphql 导入
const sendTestEmailMutation = {
  id: 'sendTestEmail',
  query: 'mutation SendTestEmail($smtpConfig: SMTPConfigInput!) { sendTestEmail(smtpConfig: $smtpConfig) { success } }',
};

import { useCallback } from 'react';

import type { AppConfig } from '../config';

export function SendTestEmail({ appConfig }: { appConfig: AppConfig }) {
  const { trigger } = useMutation({
    mutation: sendTestEmailMutation,
  });

  const onClick = useCallback(() => {
    trigger(appConfig.mailer.SMTP)
      .then(() => {
        notify.success({
          title: '测试邮件已发送',
          message: '测试邮件已成功发送。',
        });
      })
      .catch((err: UserFriendlyError) => {
        notify.error({
          title: '发送测试邮件失败',
          message: err.message,
        });
      });
  }, [appConfig, trigger]);

  return <Button onClick={onClick}>发送测试邮件</Button>;
}

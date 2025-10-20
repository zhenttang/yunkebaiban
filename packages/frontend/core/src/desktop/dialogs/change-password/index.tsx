import { Button, Modal, notify } from '@yunke/component';
import {
  AuthContent,
  AuthHeader,
  AuthInput,
} from '@yunke/component/auth-components';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import {
  AuthService,
  DefaultServerService,
  ServersService,
} from '@yunke/core/modules/cloud';
import type {
  DialogComponentProps,
  GLOBAL_DIALOG_SCHEMA,
} from '@yunke/core/modules/dialogs';
import { Unreachable } from '@yunke/env/constant';
//import {
//   sendChangePasswordEmailMutation,
//   sendSetPasswordEmailMutation,
//} from '@yunke/graphql';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { useEffect, useState } from 'react';

export const ChangePasswordDialog = ({
  close,
  server: serverBaseUrl,
}: DialogComponentProps<GLOBAL_DIALOG_SCHEMA['change-password']>) => {
  const t = useI18n();
  const defaultServerService = useService(DefaultServerService);
  const serversService = useService(ServersService);
  let server;

  if (serverBaseUrl) {
    server = serversService.getServerByBaseUrl(serverBaseUrl);
    if (!server) {
      throw new Unreachable('服务器未找到');
    }
  } else {
    server = defaultServerService.server;
  }

  const authService = server.scope.get(AuthService);
  const account = useLiveData(authService.session.account$);
  const email = account?.email;
  const hasPassword = account?.info?.hasPassword;
  const [hasSentEmail, setHasSentEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordLimits = useLiveData(
    server.credentialsRequirement$.map(r => r?.password)
  );
  const serverName = useLiveData(server.config$.selector(c => c.serverName));

  useEffect(() => {
    if (!account) {
      // 我们已经登出，关闭对话框
      close();
    }
  }, [account, close]);

  const onSendEmail = useAsyncCallback(async () => {
    setLoading(true);
    try {
      const path = hasPassword
        ? '/api/auth/change-password'
        : '/api/auth/set-password';
      await server.fetch(path, { method: 'POST' });

      notify.success({
        title: hasPassword
          ? t['com.yunke.auth.sent.change.password.hint']()
          : t['com.yunke.auth.sent.set.password.hint'](),
      });
      setHasSentEmail(true);
    } catch (err) {
      console.error(err);
      notify.error({
        title: t['com.yunke.auth.sent.change.email.fail'](),
      });
    } finally {
      setLoading(false);
    }
  }, [hasPassword, server, t]);

  if (!passwordLimits) {
    // TODO(@eyhn): 加载中和错误界面
    return null;
  }

  return (
    <Modal
      open
      onOpenChange={() => close()}
      width={400}
      minHeight={500}
      contentOptions={{
        ['data-testid' as string]: 'change-password-modal',
        style: { padding: '44px 40px 20px' },
      }}
    >
      <AuthHeader
        title={serverName}
        subTitle={
          hasPassword
            ? t['com.yunke.auth.reset.password']()
            : t['com.yunke.auth.set.password']()
        }
      />
      <AuthContent>
        <p>
          {hasPassword
            ? t['com.yunke.auth.reset.password.message']()
            : t['com.yunke.auth.set.password.message']({
                min: String(passwordLimits.minLength),
                max: String(passwordLimits.maxLength),
              })}
        </p>
        <AuthInput
          label={t['com.yunke.settings.email']()}
          disabled={true}
          value={email}
        />
        <Button
          variant="primary"
          size="extraLarge"
          style={{ width: '100%' }}
          disabled={hasSentEmail}
          loading={loading}
          onClick={onSendEmail}
        >
          {hasSentEmail
            ? t['com.yunke.auth.sent']()
            : hasPassword
              ? t['com.yunke.auth.send.reset.password.link']()
              : t['com.yunke.auth.send.set.password.link']()}
        </Button>
      </AuthContent>
    </Modal>
  );
};

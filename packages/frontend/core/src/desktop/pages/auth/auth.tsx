import { notify } from '@yunke/component';
import {
  ChangeEmailPage,
  ChangePasswordPage,
  OnboardingPage,
  SetPasswordPage,
  SignInSuccessPage,
  SignUpPage,
} from '@yunke/component/auth-components';
//import {
//   changePasswordMutation,
//   sendVerifyChangeEmailMutation,
//} from '@yunke/graphql';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback } from 'react';
import type { LoaderFunction } from 'react-router-dom';
import { redirect, useParams, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { useMutation } from '../../../components/hooks/use-mutation';
import {
  RouteLogic,
  useNavigateHelper,
} from '../../../components/hooks/use-navigate-helper';
import { AuthService, ServerService } from '../../../modules/cloud';
import { AppContainer } from '../../components/app-container';
import { ConfirmChangeEmail } from './confirm-change-email';
import { ConfirmVerifiedEmail } from './email-verified-email';

const authTypeSchema = z.enum([
  'onboarding',
  'setPassword',
  'signIn',
  'changePassword',
  'signUp',
  'changeEmail',
  'confirm-change-email',
  'subscription-redirect',
  'verify-email',
]);

export const Component = () => {
  const authService = useService(AuthService);
  const account = useLiveData(authService.session.account$);
  const t = useI18n();
  const serverService = useService(ServerService);
  const passwordLimits = useLiveData(
    serverService.server.credentialsRequirement$.map(r => r?.password)
  );

  const { authType } = useParams();
  const [searchParams] = useSearchParams();

  const { trigger: changePassword } = useMutation({
    mutation: changePasswordMutation,
  });

  const { trigger: sendVerifyChangeEmail } = useMutation({
    mutation: sendVerifyChangeEmailMutation,
  });

  const { jumpToIndex } = useNavigateHelper();

  const onSendVerifyChangeEmail = useCallback(
    async (email: string) => {
      const res = await sendVerifyChangeEmail({
        token: searchParams.get('token') || '',
        email,
        callbackUrl: `/auth/confirm-change-email`,
      }).catch(console.error);

      // FIXME: There is not notification
      if (res?.sendVerifyChangeEmail) {
        notify.success({
          title: t['com.yunke.auth.sent.verify.email.hint'](),
        });
      } else {
        notify.error({
          title: t['com.yunke.auth.sent.change.email.fail'](),
        });
      }

      return !!res?.sendVerifyChangeEmail;
    },
    [searchParams, sendVerifyChangeEmail, t]
  );

  const onSetPassword = useCallback(
    async (password: string) => {
      await changePassword({
        token: searchParams.get('token') || '',
        userId: searchParams.get('userId') || '',
        newPassword: password,
      });
    },
    [changePassword, searchParams]
  );
  const onOpenYunke = useCallback(() => {
    jumpToIndex(RouteLogic.REPLACE);
  }, [jumpToIndex]);

  if (!passwordLimits) {
    return <AppContainer fallback />;
  }

  switch (authType) {
    case 'onboarding':
      return (
        account && <OnboardingPage user={account} onOpenYunke={onOpenYunke} />
      );
    case 'signUp': {
      return (
        account && (
          <SignUpPage
            user={account}
            passwordLimits={passwordLimits}
            onSetPassword={onSetPassword}
            onOpenYunke={onOpenYunke}
          />
        )
      );
    }
    case 'signIn': {
      return <SignInSuccessPage onOpenYunke={onOpenYunke} />;
    }
    case 'changePassword': {
      return (
        <ChangePasswordPage
          passwordLimits={passwordLimits}
          onSetPassword={onSetPassword}
          onOpenYunke={onOpenYunke}
        />
      );
    }
    case 'setPassword': {
      return (
        <SetPasswordPage
          passwordLimits={passwordLimits}
          onSetPassword={onSetPassword}
          onOpenYunke={onOpenYunke}
        />
      );
    }
    case 'changeEmail': {
      return (
        <ChangeEmailPage
          onChangeEmail={onSendVerifyChangeEmail}
          onOpenYunke={onOpenYunke}
        />
      );
    }
    case 'confirm-change-email': {
      return <ConfirmChangeEmail onOpenYunke={onOpenYunke} />;
    }
    case 'verify-email': {
      return <ConfirmVerifiedEmail onOpenYunke={onOpenYunke} />;
    }
  }
  return null;
};

export const loader: LoaderFunction = async args => {
  if (!args.params.authType) {
    return redirect('/404');
  }
  if (!authTypeSchema.safeParse(args.params.authType).success) {
    return redirect('/404');
  }

  return null;
};

import { Button, notify } from '@yunke/component';
import {
  AuthContainer,
  AuthContent,
  AuthFooter,
  AuthHeader,
  AuthInput,
} from '@yunke/component/auth-components';
// import { OAuth } from '@yunke/core/components/yunke/auth/oauth';
import { MobileIcon, WeChatIcon } from './icons';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import { AuthService, ServerService } from '@yunke/core/modules/cloud';
import type { AuthSessionStatus } from '@yunke/core/modules/cloud/entities/session';
// import { ServerDeploymentType } from '@yunke/graphql';
import { ServerDeploymentType } from '../../modules/cloud/types';
import { Trans, useI18n } from '@yunke/i18n';
import {
  ArrowRightBigIcon,
  LocalWorkspaceIcon,
  PublishIcon,
} from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { cssVar } from '@toeverything/theme';
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { SignInState } from '.';
import { Back } from './back';
import * as style from './style.css';

const emailRegex =
  /^(?:(?:[^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(?:(?:\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|((?:[a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

function validateEmail(email: string) {
  return emailRegex.test(email);
}

export const SignInStep = ({
  state,
  changeState,
  onSkip,
  onAuthenticated,
}: {
  state: SignInState;
  changeState: Dispatch<SetStateAction<SignInState>>;
  onSkip: () => void;
  onAuthenticated?: (status: AuthSessionStatus) => void;
}) => {
  const t = useI18n();
  const serverService = useService(ServerService);
  const serverName = useLiveData(
    serverService.server.config$.selector(c => c.serverName)
  );
  const isSelfhosted = useLiveData(
    serverService.server.config$.selector(
      c => c.type === ServerDeploymentType.Selfhosted
    )
  );
  const authService = useService(AuthService);
  const [isMutating, setIsMutating] = useState(false);

  const [email, setEmail] = useState('');
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [isValidEmail, setIsValidEmail] = useState(true);

  const loginStatus = useLiveData(authService.session.status$);

  useEffect(() => {
    if (loginStatus === 'authenticated') {
      notify.success({
        title: t['com.yunke.auth.toast.title.signed-in'](),
        message: t['com.yunke.auth.toast.message.signed-in'](),
      });
    }
    onAuthenticated?.(loginStatus);
  }, [loginStatus, onAuthenticated, t]);

  const onContinue = useAsyncCallback(async () => {
    const currentEmail = emailInputRef.current?.value || email;

    if (!validateEmail(currentEmail)) {
      setIsValidEmail(false);
      return;
    }

    setIsValidEmail(true);
    setIsMutating(true);

    try {
      const { hasPassword } = await authService.checkUserByEmail(currentEmail);

      if (hasPassword) {
        changeState(prev => ({
          ...prev,
          email: currentEmail,
          step: 'signInWithPassword',
          hasPassword: true,
        }));
      } else {
        changeState(prev => ({
          ...prev,
          email: currentEmail,
          step: 'signInWithEmail',
          hasPassword: false,
        }));
      }
    } catch (err: any) {
      console.error(err);

      // TODO(@eyhn): 改进错误处理
      notify.error({
        title: '登录失败',
        message: err.message,
      });
    }

    setIsMutating(false);
  }, [authService, changeState, email]);

  const onAddSelfhosted = useCallback(() => {
    changeState(prev => ({
      ...prev,
      step: 'addSelfhosted',
    }));
  }, [changeState]);

  return (
    <AuthContainer>
      <AuthHeader
        title={t['com.yunke.auth.sign.in']()}
        subTitle={t['com.yunke.auth.sign.hero.subtitle']()}
      />

      <AuthContent>
        <div className={style.oauthWrapper}>
          <Button
            variant="secondary"
            size="extraLarge"
            className={style.oauthButton}
            prefix={<MobileIcon className={style.oauthIcon} />}
            onClick={() =>
              changeState(prev => ({ ...prev, step: 'signInWithMobile' }))
            }
            title="使用手机号登录"
          />
          <Button
            variant="secondary"
            size="extraLarge"
            className={style.oauthButton}
            prefix={<WeChatIcon className={style.oauthIcon} />}
            onClick={() =>
              changeState(prev => ({ ...prev, step: 'signInWithWeChat' }))
            }
            title="使用微信登录"
          />
          <Button
            variant="secondary"
            size="extraLarge"
            className={style.oauthButton}
            prefix={<WeChatIcon className={style.oauthIcon} />}
            onClick={() =>
              changeState(prev => ({
                ...prev,
                step: 'signInWithWeChatOfficial',
              }))
            }
            title="使用微信公众号登录"
          />
        </div>

        <AuthInput
          ref={emailInputRef}
          className={style.authInput}
          label={t['com.yunke.settings.email']()}
          placeholder={t['com.yunke.auth.sign.email.placeholder']()}
          onChange={setEmail}
          error={!isValidEmail}
          errorHint={
            isValidEmail ? '' : t['com.yunke.auth.sign.email.error']()
          }
          onEnter={onContinue}
        />

        <Button
          className={style.signInButton}
          size="extraLarge"
          data-testid="continue-login-button"
          block
          loading={isMutating}
          suffix={<ArrowRightBigIcon />}
          suffixStyle={{ width: 20, height: 20, color: 'currentColor' }}
          onClick={onContinue}
        >
          {t['com.yunke.auth.sign.email.continue']()}
        </Button>
      </AuthContent>
      <AuthFooter>
        {state.step !== 'signIn' && <Back changeState={changeState} />}
      </AuthFooter>
    </AuthContainer>
  );
};

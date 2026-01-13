import {
  AuthContainer,
  AuthContent,
  AuthFooter,
  AuthHeader,
} from '@yunke/component/auth-components';
import { type Dispatch, type SetStateAction } from 'react';

import { type SignInState } from '.';
import { Back } from './back';

export const SignInPlaceholderStep = ({
  state,
  changeState,
  title,
}: {
  state: SignInState;
  changeState: Dispatch<SetStateAction<SignInState>>;
  title: string;
}) => {
  return (
    <AuthContainer>
      <AuthHeader title={title} subTitle="功能开发中..." />
      <AuthContent>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p>此登录方式尚未实现。</p>
        </div>
      </AuthContent>
      <AuthFooter>
        <Back changeState={changeState} />
      </AuthFooter>
    </AuthContainer>
  );
};
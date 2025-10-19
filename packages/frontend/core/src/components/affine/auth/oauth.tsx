import { Button } from '@yunke/component/ui/button';
import { notify } from '@yunke/component/ui/notification';
import { useAsyncCallback } from '@yunke/core/components/hooks/affine-async-hooks';
import { AuthService, ServerService } from '@yunke/core/modules/cloud';
import { UrlService } from '@yunke/core/modules/url';
import { UserFriendlyError } from '@yunke/error';
// import { OAuthProviderType } from '@yunke/graphql';

// GraphQL后端移除后的临时占位符枚举
enum OAuthProviderType {
  Phone = 'phone',
  WeChat = 'wechat',
  WeChatOfficialAccount = 'wechat-official',
  GitHub = 'github',
  OIDC = 'oidc',
  Apple = 'apple',
}

import track from '@yunke/track';
import {
  AppleIcon,
  GithubIcon,
  LockIcon,
} from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import {
  cloneElement,
  type ReactElement,
  type SVGAttributes,
  useCallback,
} from 'react';
import * as oauthStyle from './oauth.css';

// 手机图标组件
const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 4h10v14H7V4zm5 17c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/>
  </svg>
);

// 微信图标组件
const WeChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.5 8.3c.4 0 .8.3.8.8s-.3.8-.8.8-.8-.3-.8-.8.4-.8.8-.8zm3.5 0c.4 0 .8.3.8.8s-.3.8-.8.8-.8-.3-.8-.8.4-.8.8-.8zm4.5 2.5c.3 0 .6.2.6.6s-.3.6-.6.6-.6-.2-.6-.6.3-.6.6-.6zm2.5 0c.3 0 .6.2.6.6s-.3.6-.6.6-.6-.2-.6-.6.3-.6.6-.6zM9.5 5.5c-3 0-5.5 2-5.5 4.5 0 1.4.7 2.7 1.8 3.6l-.6 1.8 2.1-1.1c.7.2 1.4.2 2.2.2 3 0 5.5-2 5.5-4.5S12.5 5.5 9.5 5.5zm8 2.5c2.2 0 4 1.5 4 3.5 0 1-.5 2-1.3 2.7l.4 1.3-1.5-.8c-.5.1-1 .2-1.6.2-2.2 0-4-1.5-4-3.5 0-.3 0-.5.1-.8 2.4-.4 4.3-1.8 4.3-3.5-.1 0-.2 0-.4-.1z"/>
  </svg>
);

// 微信公众号图标组件
const WeChatOfficialIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-1.5-1.5L10 14l-1.5 1.5L7 14l1.5-1.5L7 11l1.5-1.5L10 11l1.5-1.5L13 11l-1.5 1.5L13 14l-1.5 1.5L10 14zm7-6h-6V9h6v2z"/>
  </svg>
);

const OAuthProviderMap: Record<
  OAuthProviderType,
  {
    icon: ReactElement<SVGAttributes<SVGElement>>;
    label: string;
  }
> = {
  [OAuthProviderType.Phone]: {
    icon: <PhoneIcon />,
    label: '手机号',
  },

  [OAuthProviderType.WeChat]: {
    icon: <WeChatIcon />,
    label: '微信',
  },

  [OAuthProviderType.WeChatOfficialAccount]: {
    icon: <WeChatOfficialIcon />,
    label: '微信公众号',
  },

  [OAuthProviderType.GitHub]: {
    icon: <GithubIcon />,
    label: 'GitHub',
  },

  [OAuthProviderType.OIDC]: {
    icon: <LockIcon />,
    label: 'OIDC',
  },

  [OAuthProviderType.Apple]: {
    icon: <AppleIcon />,
    label: 'Apple',
  },
};

export function OAuth({ redirectUrl }: { redirectUrl?: string }) {
  const serverService = useService(ServerService);
  const urlService = useService(UrlService);
  const oauth = useLiveData(serverService.server.features$.map(r => r?.oauth));
  const auth = useService(AuthService);
  
  // 自定义登录方式列表
  const customProviders = [
    OAuthProviderType.Phone,
    OAuthProviderType.WeChat,
    OAuthProviderType.WeChatOfficialAccount,
  ];

  const onContinue = useAsyncCallback(
    async (provider: OAuthProviderType) => {
      track.$.$.auth.signIn({ method: 'oauth', provider });

      const open: () => Promise<void> | void = BUILD_CONFIG.isNative
        ? async () => {
            try {
              const scheme = urlService.getClientScheme();
              const options = await auth.oauthPreflight(
                provider,
                scheme ?? 'web'
              );
              urlService.openPopupWindow(options.url);
            } catch (e) {
              notify.error(UserFriendlyError.fromAny(e));
            }
          }
        : () => {
            const params = new URLSearchParams();

            params.set('provider', provider);

            if (redirectUrl) {
              params.set('redirect_uri', redirectUrl);
            }

            const oauthUrl =
              serverService.server.baseUrl +
              `/oauth/login?${params.toString()}`;

            urlService.openPopupWindow(oauthUrl);
          };

      const ret = open();

      if (ret instanceof Promise) {
        await ret;
      }
    },
    [urlService, redirectUrl, serverService, auth]
  );

  // 总是显示自定义登录方式，而不依赖服务器配置
  return (
    <div className={oauthStyle.wrapper}>
      {customProviders.map(provider => (
        <OAuthProvider
          key={provider}
          provider={provider}
          onContinue={onContinue}
        />
      ))}
    </div>
  );
}

interface OauthProviderProps {
  provider: OAuthProviderType;
  onContinue: (provider: OAuthProviderType) => void;
}

function OAuthProvider({ onContinue, provider }: OauthProviderProps) {
  const { icon, label } = OAuthProviderMap[provider];
  const decoratedIcon = cloneElement(icon, {
    className: oauthStyle.placeholderIcon,
  });

  const onClick = useCallback(() => {
    // 测试阶段，暂时禁用功能
    // onContinue(provider);
  }, []);

  return (
    <Button
      variant="secondary"
      block
      size="extraLarge"
      className={oauthStyle.placeholderButton}
      prefix={decoratedIcon}
      onClick={onClick}
      disabled={true}
      data-disabled
    >
      使用{label}登录（测试中）
    </Button>
  );
}

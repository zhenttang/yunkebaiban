import { FlexWrapper, Input, notify } from '@yunke/component';
import {
  SettingHeader,
  SettingRow,
  SettingWrapper,
} from '@yunke/component/setting-components';
import { Avatar } from '@yunke/component/ui/avatar';
import { Button } from '@yunke/component/ui/button';
import { useSignOut } from '@yunke/core/components/hooks/affine/use-sign-out';
import { useAsyncCallback } from '@yunke/core/components/hooks/affine-async-hooks';
import { useCatchEventCallback } from '@yunke/core/components/hooks/use-catch-event-hook';
import { Upload } from '@yunke/core/components/pure/file-upload';
import { GlobalDialogService } from '@yunke/core/modules/dialogs';
// import { SubscriptionPlan } from '@yunke/graphql';
import { useI18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import { ArrowRightSmallIcon, CameraIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService, useServices } from '@toeverything/infra';
import { useCallback, useEffect, useState } from 'react';

import { AuthService, ServerService } from '../../../../modules/cloud';
import { resolveUrl } from '../../../../utils/url-resolver';
import type { SettingState } from '../types';
import { AIUsagePanel } from './ai-usage-panel';
import { DeleteAccount } from './delete-account';
import { StorageProgress } from './storage-progress';
import * as styles from './style.css';

export const UserAvatar = () => {
  const t = useI18n();
  const session = useService(AuthService).session;
  const serverService = useService(ServerService);
  const account = useLiveData(session.account$);
  
  // 添加SVG头像生成状态管理
  const [useSvgAvatar, setUseSvgAvatar] = useState(false);
  const [svgSeed, setSvgSeed] = useState<string>(account?.id || Math.random().toString());

  // 解析头像URL为绝对URL
  const resolvedAvatarUrl = resolveUrl(account?.avatar, serverService.server.serverMetadata.baseUrl);

  const handleUpdateUserAvatar = useAsyncCallback(
    async (file: File) => {
      try {
        track.$.settingsPanel.accountSettings.uploadAvatar();
        await session.uploadAvatar(file);
        setUseSvgAvatar(false); // 上传头像后切换到上传模式
        notify.success({ title: '更新用户头像成功' });
      } catch (e) {
        // TODO(@catsjuice): i18n
        notify.error({
          title: '更新用户头像失败',
          message: String(e),
        });
      }
    },
    [session]
  );

  const handleRemoveUserAvatar = useCatchEventCallback(async () => {
    track.$.settingsPanel.accountSettings.removeAvatar();
    await session.removeAvatar();
    setUseSvgAvatar(false); // 删除头像后切换到上传模式
  }, [session]);

  // 生成随机SVG头像
  const handleGenerateSvgAvatar = useCallback(() => {
    const newSeed = Math.random().toString();
    setSvgSeed(newSeed);
    setUseSvgAvatar(true);
    track.$.settingsPanel.accountSettings.generateAvatar && track.$.settingsPanel.accountSettings.generateAvatar();
  }, []);

  // 重新生成SVG头像
  const handleRegenerateSvgAvatar = useCallback(() => {
    const newSeed = Math.random().toString();
    setSvgSeed(newSeed);
  }, []);

  // 保存SVG头像（将SVG转换为图片并上传）
  const handleSaveSvgAvatar = useAsyncCallback(async () => {
    try {
      // 获取SVG元素
      const svgElement = document.querySelector('[data-testid="user-setting-avatar"] svg');
      if (!svgElement) {
        throw new Error('未找到SVG头像元素');
      }

      // 将SVG转换为Canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // 设置Canvas尺寸
      canvas.width = 256;
      canvas.height = 256;
      
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = async () => {
        try {
          ctx?.drawImage(img, 0, 0, 256, 256);
          
          // 将Canvas转换为Blob
          canvas.toBlob(async (blob) => {
            if (!blob) {
              throw new Error('生成图片失败');
            }
            
            // 创建File对象并上传
            const file = new File([blob], 'avatar.png', { type: 'image/png' });
            await handleUpdateUserAvatar(file);
          }, 'image/png', 0.9);
          
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('保存SVG头像失败:', error);
          notify.error({ title: '保存头像失败', message: String(error) });
        }
      };
      
      img.src = url;
    } catch (error) {
      console.error('生成SVG头像失败:', error);
      notify.error({ title: '生成头像失败', message: String(error) });
    }
  }, [handleUpdateUserAvatar]);

  // 决定显示模式 - 如果用户选择了SVG模式就显示SVG，不管是否有原头像
  const shouldShowSvgAvatar = useSvgAvatar;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <Upload
        accept="image/gif,image/jpeg,image/jpg,image/png,image/svg"
        fileChange={handleUpdateUserAvatar}
        data-testid="upload-user-avatar"
      >
        <Avatar
          size={56}
          name={account?.label}
          url={shouldShowSvgAvatar ? undefined : resolvedAvatarUrl}
          generateMode={shouldShowSvgAvatar ? 'svg-generated' : 'uploaded'}
          svgConfig={{
            seed: svgSeed,
            onGenerate: () => console.log('SVG头像生成完成')
          }}
          hoverIcon={<CameraIcon />}
          onRemove={resolvedAvatarUrl ? handleRemoveUserAvatar : undefined}
          avatarTooltipOptions={{ content: shouldShowSvgAvatar ? '点击上传自定义头像' : t['com.affine.settings.avatar.click-to-replace']() }}
          removeTooltipOptions={{ content: t['com.affine.settings.avatar.remove']() }}
          data-testid="user-setting-avatar"
          removeButtonProps={{
            ['data-testid' as string]: 'user-setting-remove-avatar-button',
          }}
        />
      </Upload>
      
      {/* 头像操作按钮 */}
      <div style={{ 
        display: 'flex', 
        gap: '6px', 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        marginTop: '8px'
      }}>
        {/* 只有当不在SVG生成模式时才显示生成按钮 */}
        {!useSvgAvatar && (
          <Button
            size="extraSmall"
            variant="secondary"
            onClick={handleGenerateSvgAvatar}
            data-testid="generate-avatar-button"
            style={{ 
              fontSize: '12px', 
              padding: '4px 8px',
              height: '28px',
              minWidth: 'auto'
            }}
          >
            {resolvedAvatarUrl ? '生成随机头像' : '随机头像'}
          </Button>
        )}
        
        {shouldShowSvgAvatar && (
          <>
            <Button
              size="extraSmall"
              variant="secondary"
              onClick={handleRegenerateSvgAvatar}
              data-testid="regenerate-avatar-button"
              style={{ 
                fontSize: '12px', 
                padding: '4px 8px',
                height: '28px',
                minWidth: 'auto'
              }}
            >
              重新生成
            </Button>
            <Button
              size="extraSmall"
              variant="primary"
              onClick={handleSaveSvgAvatar}
              data-testid="save-avatar-button"
              style={{ 
                fontSize: '12px', 
                padding: '4px 8px',
                height: '28px',
                minWidth: 'auto'
              }}
            >
              保存
            </Button>
            <Button
              size="extraSmall"
              variant="secondary"
              onClick={() => setUseSvgAvatar(false)}
              data-testid="cancel-avatar-button"
              style={{ 
                fontSize: '12px', 
                padding: '4px 8px',
                height: '28px',
                minWidth: 'auto'
              }}
            >
              取消
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export const AvatarAndName = () => {
  const t = useI18n();
  const session = useService(AuthService).session;
  const account = useLiveData(session.account$);
  const [input, setInput] = useState<string>(account?.label ?? '');

  const allowUpdate = !!input && input !== account?.label;
  const handleUpdateUserName = useAsyncCallback(async () => {
    if (account === null) {
      return;
    }
    if (!allowUpdate) {
      return;
    }

    try {
      track.$.settingsPanel.accountSettings.updateUserName();
      await session.updateLabel(input);
    } catch (e) {
      notify.error({
        title: '更新用户名失败',
        message: String(e),
      });
    }
  }, [account, allowUpdate, session, input]);

  return (
    <SettingRow
      name={t['com.affine.settings.profile']()}
      desc={t['com.affine.settings.profile.message']()}
      spreadCol={false}
    >
      <FlexWrapper style={{ margin: '12px 0 24px 0' }} alignItems="center">
        <UserAvatar />

        <div className={styles.profileInputWrapper}>
          <label>{t['com.affine.settings.profile.name']()}</label>
          <FlexWrapper alignItems="center">
            <Input
              defaultValue={input}
              data-testid="user-name-input"
              placeholder={t['com.affine.settings.profile.placeholder']()}
              maxLength={64}
              minLength={0}
              style={{ width: 280, height: 32 }}
              onChange={setInput}
              onEnter={handleUpdateUserName}
            />
            {allowUpdate ? (
              <Button
                data-testid="save-user-name"
                onClick={handleUpdateUserName}
                style={{
                  marginLeft: '12px',
                }}
              >
                {t['com.affine.editCollection.save']()}
              </Button>
            ) : null}
          </FlexWrapper>
        </div>
      </FlexWrapper>
    </SettingRow>
  );
};

const StoragePanel = ({
  onChangeSettingState,
}: {
  onChangeSettingState?: (settingState: SettingState) => void;
}) => {
  const t = useI18n();

  const onUpgrade = useCallback(() => {
    track.$.settingsPanel.accountUsage.viewPlans({
      plan: SubscriptionPlan.Pro,
    });
    onChangeSettingState?.({
      activeTab: 'plans',
      scrollAnchor: 'cloudPricingPlan',
    });
  }, [onChangeSettingState]);

  return (
    <SettingRow
      name={t['com.affine.storage.title']()}
      desc=""
      spreadCol={false}
    >
      <StorageProgress onUpgrade={onUpgrade} noAutoRevalidate={true} />
    </SettingRow>
  );
};

export const AccountSetting = ({
  onChangeSettingState,
}: {
  onChangeSettingState?: (settingState: SettingState) => void;
}) => {
  const { authService, serverService, globalDialogService } = useServices({
    AuthService,
    ServerService,
    GlobalDialogService,
  });
  const serverFeatures = useLiveData(serverService.server.features$);
  const t = useI18n();
  const session = authService.session;
  
  // 添加数据加载状态管理
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // 统一的数据加载函数，避免重复调用
  const loadAccountData = useCallback(async () => {
    if (isDataLoaded) {
      console.log('Account data already loaded, skipping duplicate call');
      return;
    }

    console.log('Starting unified account data loading...');
    setIsInitialLoading(true);
    
    try {
      // 只调用一次 session.waitForRevalidation()，避免直接调用 revalidate()
      await session.waitForRevalidation();
      setIsDataLoaded(true);
      console.log('Account data loaded successfully');
    } catch (error) {
      console.error('Failed to load account data:', error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [session, isDataLoaded]);

  // 组件挂载时只加载一次数据，移除原有的复杂逻辑
  useEffect(() => {
    loadAccountData();
  }, []); // 空依赖数组，确保只执行一次
  
  const account = useLiveData(session.account$);
  const openSignOutModal = useSignOut();

  const onChangeEmail = useCallback(() => {
    if (!account) {
      return;
    }
    globalDialogService.open('verify-email', {
      server: serverService.server.baseUrl,
      changeEmail: !!account.info?.emailVerified,
    });
  }, [account, globalDialogService, serverService.server.baseUrl]);

  const onPasswordButtonClick = useCallback(() => {
    globalDialogService.open('change-password', {
      server: serverService.server.baseUrl,
    });
  }, [globalDialogService, serverService.server.baseUrl]);

  if (!account) {
    return null;
  }

  return (
    <>
      <SettingHeader
        title={t['com.affine.setting.account']()}
        subtitle={t['com.affine.setting.account.message']()}
        data-testid="account-title"
      />
      <AvatarAndName />
      <SettingWrapper>
        <SettingRow
          name={t['com.affine.settings.email']()}
          desc={account.email}
        >
          <Button onClick={onChangeEmail}>
            {account.info?.emailVerified
              ? t['com.affine.settings.email.action.change']()
              : t['com.affine.settings.email.action.verify']()}
          </Button>
        </SettingRow>
        <SettingRow
          name={t['com.affine.settings.password']()}
          desc={t['com.affine.settings.password.message']()}
        >
          <Button onClick={onPasswordButtonClick}>
            {account.info?.hasPassword
              ? t['com.affine.settings.password.action.change']()
              : t['com.affine.settings.password.action.set']()}
          </Button>
        </SettingRow>
        <StoragePanel onChangeSettingState={onChangeSettingState} />
        {serverFeatures?.copilot && (
          <AIUsagePanel onChangeSettingState={onChangeSettingState} />
        )}
        <SettingRow
          name={t['com.affine.setting.sign.out']()}
          desc={t['com.affine.setting.sign.out.message']()}
          style={{ cursor: 'pointer' }}
          data-testid="sign-out-button"
          onClick={openSignOutModal}
        >
          <ArrowRightSmallIcon />
        </SettingRow>
      </SettingWrapper>
      <DeleteAccount />
    </>
  );
};

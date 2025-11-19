import { Menu, MenuItem, MenuTrigger, notify } from '@yunke/component';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import { ShareInfoService } from '@yunke/core/modules/share-doc';
import { UserFriendlyError } from '@yunke/error';
import type { PublicDocMode } from '@yunke/core/modules/share-doc/types';
import { useI18n } from '@yunke/i18n';
import track from '@yunke/track';
import {
  LockIcon,
  SingleSelectCheckSolidIcon,
  ViewIcon,
  EditIcon,
} from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { cssVar } from '@toeverything/theme';
import clsx from 'clsx';
import { useEffect } from 'react';

import * as styles from './styles.css';

export const PublicDoc = ({ disabled }: { disabled?: boolean }) => {
  const t = useI18n();
  const shareInfoService = useService(ShareInfoService);
  const isSharedPage = useLiveData(shareInfoService.shareInfo.isShared$);
  const sharedMode = useLiveData(shareInfoService.shareInfo.sharedMode$);
  const isRevalidating = useLiveData(
    shareInfoService.shareInfo.isRevalidating$
  );
  useEffect(() => {
    // 日志辅助：查看分享状态和权限模式
    console.info('[SharePage] 状态变更', {
      isSharedPage,
      sharedMode,
    });
  }, [isSharedPage, sharedMode]);

  useEffect(() => {
    shareInfoService.shareInfo.revalidate();
  }, [shareInfoService]);

  const onDisablePublic = useAsyncCallback(async () => {
    try {
      await shareInfoService.shareInfo.disableShare();
      notify.error({
        title:
          t[
            'com.yunke.share-menu.disable-publish-link.notification.success.title'
          ](),
        message:
          t[
            'com.yunke.share-menu.disable-publish-link.notification.success.message'
          ](),
      });
    } catch (err) {
      notify.error({
        title:
          t[
            'com.yunke.share-menu.disable-publish-link.notification.fail.title'
          ](),
        message:
          t[
            'com.yunke.share-menu.disable-publish-link.notification.fail.message'
          ](),
      });
      console.log(err);
    }
  }, [shareInfoService, t]);

  const onClickAnyoneReadOnlyShare = useAsyncCallback(async () => {
    if (isSharedPage && sharedMode === 'page') {
      return;
    }
    try {
      await shareInfoService.shareInfo.enableShare('page');
      track.$.sharePanel.$.createShareLink();
      notify.success({
        title:
          t[
            'com.yunke.share-menu.create-public-link.notification.success.title'
          ](),
        message:
          t[
            'com.yunke.share-menu.create-public-link.notification.success.message'
          ](),
        style: 'normal',
        icon: <SingleSelectCheckSolidIcon color={cssVar('primaryColor')} />,
      });
    } catch (error) {
      const err = UserFriendlyError.fromAny(error);
      notify.error({
        title: err.name,
        message: err.message,
      });
    }
  }, [isSharedPage, sharedMode, shareInfoService.shareInfo, t]);

  const onClickAppendOnlyShare = useAsyncCallback(async () => {
    if (isSharedPage && sharedMode === 'append-only') {
      return;
    }
    try {
      await shareInfoService.shareInfo.enableShare('append-only');
      track.$.sharePanel.$.createShareLink();
      notify.success({
        title: t['com.yunke.share-menu.create-append-only-link.notification.success.title'](),
        message: t['com.yunke.share-menu.create-append-only-link.notification.success.message'](),
        style: 'normal',
        icon: <SingleSelectCheckSolidIcon color={cssVar('primaryColor')} />,
      });
    } catch (error) {
      const err = UserFriendlyError.fromAny(error);
      notify.error({
        title: err.name,
        message: err.message,
      });
    }
  }, [isSharedPage, sharedMode, shareInfoService.shareInfo, t]);

  const getCurrentModeText = () => {
    if (!isSharedPage) {
      return t['com.yunke.share-menu.option.link.no-access']();
    }
    switch (sharedMode) {
      case 'append-only':
        return t['com.yunke.share-menu.option.link.append-only']();
      case 'page':
      default:
        return t['com.yunke.share-menu.option.link.readonly']();
    }
  };

  return (
    <div className={styles.rowContainerStyle}>
      <div className={styles.labelStyle}>
        {t['com.yunke.share-menu.option.link.label']()}
      </div>
      {disabled ? (
        <div className={clsx(styles.menuTriggerStyle, 'disable')}>
          <div className={styles.menuTriggerText}>
            {getCurrentModeText()}
          </div>
        </div>
      ) : (
        <Menu
          contentOptions={{
            align: 'end',
          }}
          items={
            <>
              <MenuItem
                prefixIcon={<LockIcon />}
                onSelect={onDisablePublic}
                selected={!isSharedPage}
              >
                <div className={styles.publicItemRowStyle}>
                  <div>
                    {t['com.yunke.share-menu.option.link.no-access']()}
                  </div>
                </div>
              </MenuItem>
              <MenuItem
                prefixIcon={<ViewIcon />}
                onSelect={onClickAnyoneReadOnlyShare}
                data-testid="share-link-menu-enable-share"
                selected={isSharedPage && sharedMode === 'page'}
              >
                <div className={styles.publicItemRowStyle}>
                  <div>{t['com.yunke.share-menu.option.link.readonly']()}</div>
                </div>
              </MenuItem>
              <MenuItem
                prefixIcon={<EditIcon />}
                onSelect={onClickAppendOnlyShare}
                data-testid="share-link-menu-enable-append-only"
                selected={isSharedPage && sharedMode === 'append-only'}
              >
                <div className={styles.publicItemRowStyle}>
                  <div>{t['com.yunke.share-menu.option.link.append-only']()}</div>
                </div>
              </MenuItem>
            </>
          }
        >
          <MenuTrigger
            className={styles.menuTriggerStyle}
            data-testid="share-link-menu-trigger"
            variant="plain"
            suffixClassName={styles.suffixClassName}
            contentStyle={{
              width: '100%',
            }}
            loading={isRevalidating}
            disabled={isRevalidating}
          >
            {getCurrentModeText()}
          </MenuTrigger>
        </Menu>
      )}
    </div>
  );
};

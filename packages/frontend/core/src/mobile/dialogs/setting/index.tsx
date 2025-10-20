import { AuthService } from '@yunke/core/modules/cloud';
import type {
  DialogComponentProps,
  WORKSPACE_DIALOG_SCHEMA,
} from '@yunke/core/modules/dialogs';
import { useI18n } from '@yunke/i18n';
import { useService } from '@toeverything/infra';
import { useEffect, useRef } from 'react';

import { AboutGroup } from './about';
import { AppearanceGroup } from './appearance';
import { ExperimentalFeatureSetting } from './experimental';
import { OthersGroup } from './others';
import { PaymentGroup } from './payment';
import * as styles from './style.css';
import { SwipeDialog } from './swipe-dialog';
import { UserProfile } from './user-profile';
import { UserUsage } from './user-usage';

const MobileSetting = () => {
  const session = useService(AuthService).session;
  const hasInitialized = useRef(false);
  
  console.log('[MobileSetting] Component rendering, hasInitialized:', hasInitialized.current);
  
  useEffect(() => {
    console.log('[MobileSetting] useEffect triggered, hasInitialized:', hasInitialized.current);
    // 暂时完全禁用 revalidate 来测试是否是它导致的循环
    // if (!hasInitialized.current) {
    //   hasInitialized.current = true;
    //   console.log('[MobileSetting] Calling session.revalidate()');
    //   session.revalidate();
    // }
  }, []); // 空依赖数组

  return (
    <div className={styles.root}>
      <UserProfile />
      <UserUsage />
      <PaymentGroup />
      <AppearanceGroup />
      <AboutGroup />
      <ExperimentalFeatureSetting />
      <OthersGroup />
    </div>
  );
};

export const SettingDialog = ({
  close,
}: DialogComponentProps<WORKSPACE_DIALOG_SCHEMA['setting']>) => {
  const t = useI18n();
  
  console.log('[SettingDialog] Component rendering');

  return (
    <SwipeDialog
      title={t['com.yunke.mobile.setting.header-title']()}
      open
      onOpenChange={() => close()}
    >
      <MobileSetting />
    </SwipeDialog>
  );

  // return (
  //   <ConfigModal
  //     title={t['com.yunke.mobile.setting.header-title']()}
  //     open
  //     onOpenChange={() => close()}
  //     onBack={close}
  //   >
  //     <MobileSetting />
  //   </ConfigModal>
  // );
};

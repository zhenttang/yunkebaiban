import { SafeArea } from '@yunke/component';
import { WorkbenchLink } from '@yunke/core/modules/workbench';
import { useLiveData, useService } from '@toeverything/infra';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import React from 'react';
import { createPortal } from 'react-dom';

import { VirtualKeyboardService } from '../../modules/virtual-keyboard/services/virtual-keyboard';
import { type AppTabLink, tabs } from './data';
import { useNavigationSyncContext } from './navigation-context';
import * as styles from './styles.css';
import { TabItem } from './tab-item';

export const AppTabs = ({
  background,
  fixed = true,
}: {
  background?: string;
  fixed?: boolean;
}) => {
  const virtualKeyboardService = useService(VirtualKeyboardService);
  const virtualKeyboardVisible = useLiveData(virtualKeyboardService.visible$);

  const tab = (
    <SafeArea
      id="app-tabs"
      bottom
      className={styles.appTabs}
      bottomOffset={2}
      data-fixed={fixed}
      style={{
        // 🎨 只有明确指定 background 时才覆盖主题默认值
        ...(background ? assignInlineVars({ [styles.appTabsBackground]: background }) : {}),
        visibility: virtualKeyboardVisible ? 'hidden' : 'visible',
      }}
    >
      <ul className={styles.appTabsInner} role="tablist">
        {tabs.map(tab => {
          if ('to' in tab) {
            return <AppTabLink route={tab} key={tab.key} />;
          } else {
            return (
              <React.Fragment key={tab.key}>
                {<tab.custom tab={tab} />}
              </React.Fragment>
            );
          }
        })}
      </ul>
    </SafeArea>
  );

  return fixed ? createPortal(tab, document.body) : tab;
};

const AppTabLink = ({ route }: { route: AppTabLink }) => {
  const Link = route.LinkComponent || WorkbenchLink;
  const { markUserNavigation } = useNavigationSyncContext();

  return (
    <Link
      className={styles.tabItem}
      to={route.to}
      key={route.to}
      replaceHistory
      onClick={markUserNavigation} // 🔧 标记用户主动点击链接
    >
      <TabItem id={route.key} label={route.to.slice(1)}>
        <route.Icon />
      </TabItem>
    </Link>
  );
};

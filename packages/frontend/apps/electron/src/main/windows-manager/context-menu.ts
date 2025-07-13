import { Menu } from 'electron';

import { logger } from '../logger';
import {
  addTab,
  closeTab,
  reloadView,
  type TabAction,
  WebContentViewsManager,
} from './tab-views';

export const showTabContextMenu = async (
  tabId: string,
  viewIndex: number
): Promise<TabAction | null> => {
  const workbenches = WebContentViewsManager.instance.tabViewsMeta.workbenches;
  const tabMeta = workbenches.find(w => w.id === tabId);
  if (!tabMeta) {
    return null;
  }

  const { resolve, promise } = Promise.withResolvers<TabAction | null>();

  const template: Parameters<typeof Menu.buildFromTemplate>[0] = [
    tabMeta.pinned
      ? {
          label: '取消固定标签页',
          click: () => {
            WebContentViewsManager.instance.pinTab(tabId, false);
          },
        }
      : {
          label: '固定标签页',
          click: () => {
            WebContentViewsManager.instance.pinTab(tabId, true);
          },
        },
    {
      label: '刷新标签页',
      click: () => {
        reloadView().catch(err => logger.error(err));
      },
    },
    {
      label: '复制标签页',
      click: () => {
        addTab({
          basename: tabMeta.basename,
          view: tabMeta.views,
          show: false,
        }).catch(err => logger.error(err));
      },
    },

    { type: 'separator' },

    tabMeta.views.length > 1
      ? {
          label: '分离标签页',
          click: () => {
            WebContentViewsManager.instance.separateView(tabId, viewIndex);
          },
        }
      : {
          label: '在分屏视图中打开',
          click: () => {
            WebContentViewsManager.instance.openInSplitView({ tabId });
          },
        },

    ...(workbenches.length > 1
      ? ([
          { type: 'separator' },
          {
            label: '关闭标签页',
            click: () => {
              closeTab(tabId).catch(err => logger.error(err));
            },
          },
          {
            label: '关闭其他标签页',
            click: () => {
              const tabsToRetain =
                WebContentViewsManager.instance.tabViewsMeta.workbenches.filter(
                  w => w.id === tabId || w.pinned
                );

              WebContentViewsManager.instance.patchTabViewsMeta({
                workbenches: tabsToRetain,
                activeWorkbenchId: tabId,
              });
            },
          },
        ] as const)
      : []),
  ];
  const menu = Menu.buildFromTemplate(template);
  menu.popup();
  let unsub: (() => void) | undefined;
  const subscription = WebContentViewsManager.instance.tabAction$.subscribe(
    action => {
      resolve(action);
      unsub?.();
    }
  );
  menu.on('menu-will-close', () => {
    setTimeout(() => {
      resolve(null);
      unsub?.();
    });
  });
  unsub = () => {
    subscription.unsubscribe();
  };
  return promise;
};

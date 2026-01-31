import { SafeArea } from '@yunke/component';
import { WorkbenchLink, WorkbenchService } from '@yunke/core/modules/workbench';
import { GlobalCacheService } from '@yunke/core/modules/storage';
import { DocDisplayMetaService } from '@yunke/core/modules/doc-display-meta';
import { JournalService } from '@yunke/core/modules/journal';
import { WorkspaceService } from '@yunke/core/modules/workspace';
// no-op
import { usePageHelper } from '@yunke/core/blocksuite/block-suite-page-list/utils';
import { EditIcon, TodayIcon } from '@blocksuite/icons/rc';
import { LiveData, useLiveData, useService } from '@toeverything/infra';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { VirtualKeyboardService } from '../../modules/virtual-keyboard/services/virtual-keyboard';
import { tabs, type AppTabLink, type Tab } from './data';
import { useNavigationSyncContext } from './navigation-context';
import * as s from './curved.css';

type Direction = 'ltr' | 'rtl';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function buildPath(width: number, height: number, pos: number, len: number, dir: Direction) {
  // Replicate flutter painter logic
  const span = 1 / len;
  const notch = 0.2; // s
  const l = pos + (span - notch) / 2;
  const loc = dir === 'rtl' ? 0.8 - l : l; // 0.8 == (1 - s)

  const moveTo = (x: number, y: number) => `${x},${y}`;
  const p1x = (loc - 0.1) * width;
  const c1x = (loc + notch * 0.2) * width;
  const c1y = height * 0.05;
  const c2x = loc * width;
  const c2y = height * 0.6;
  const p2x = (loc + notch * 0.5) * width;
  const p2y = height * 0.6;

  const c3x = (loc + notch) * width;
  const c3y = height * 0.6;
  const c4x = (loc + notch - notch * 0.2) * width;
  const c4y = height * 0.05;
  const p3x = (loc + notch + 0.1) * width;

  // Build SVG path (top edge with notch + rectangle borders)
  const d = [
    `M ${moveTo(0, 0)}`,
    `L ${moveTo(p1x, 0)}`,
    `C ${c1x},${c1y} ${c2x},${c2y} ${p2x},${p2y}`,
    `C ${c3x},${c3y} ${c4x},${c4y} ${p3x},0`,
    `L ${moveTo(width, 0)}`,
    `L ${moveTo(width, height)}`,
    `L ${moveTo(0, height)}`,
    'Z',
  ].join(' ');
  return d;
}

export const CurvedAppTabs = ({
  background,
  fixed = true,
}: {
  background?: string;
  fixed?: boolean;
}) => {
  const virtualKeyboardService = useService(VirtualKeyboardService);
  const virtualKeyboardVisible = useLiveData(virtualKeyboardService.visible$);

  const cache = useService(GlobalCacheService).globalCache;
  const activeId$ = useMemo(
    () => LiveData.from(cache.watch('activeAppTabId'), 'home'),
    [cache]
  );
  const activeId = useLiveData(activeId$) ?? 'home';

  const len = tabs.length;
  const activeIndex = Math.max(0, tabs.findIndex(t => t.key === (activeId ?? 'home')));

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [barHeight] = useState(62); // align with mobile tab height default
  const dir: Direction = (typeof document !== 'undefined' && document?.dir === 'rtl') ? 'rtl' : 'ltr';
  const pathHeight = 75; // painter base height

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Initialize from a cached "from index" so animation persists across route changes
  const cachedFromIndex = cache.get('appTabsFromIndex') as number | undefined;
  const initialIndex = Number.isFinite(cachedFromIndex!) ? (cachedFromIndex as number) : activeIndex;
  const posRef = useRef(initialIndex / len);
  const animStartRef = useRef(posRef.current);
  const animEndRef = useRef(activeIndex / len);
  const [targetIndex, setTargetIndex] = useState(activeIndex);
  const pathEl = useRef<SVGPathElement | null>(null);
  const floatingEl = useRef<HTMLDivElement | null>(null);
  const buttonCells = useRef<(HTMLDivElement | null)[]>([]);
  const initializedRef = useRef(false);

  // Use normalized index-based position for stability across pages

  useEffect(() => {
    // one-shot cleanup of cached from index
    cache.del('appTabsFromIndex');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When active tab changes
  useEffect(() => {
    const end = activeIndex / len;
    const start = posRef.current;
    animStartRef.current = start;
    animEndRef.current = end;
    setTargetIndex(activeIndex);

    // 1) Move floating button via CSS transition
    if (floatingEl.current && width > 0) {
      // 改进的位置计算：使用更精确的中心对齐
      // 计算每个标签的宽度
      const tabWidth = width / len;
      // 计算当前标签的中心位置（标签索引 * 标签宽度 + 标签宽度的一半）
      const tabCenter = activeIndex * tabWidth + tabWidth / 2;
      // 浮动按钮的宽度是52px，所以左边距应该是中心位置减去26px（按钮半径）
      const left = tabCenter - 26;
      floatingEl.current.style.left = `${left}px`;
      // lift: up then back to 0
      floatingEl.current.style.transform = `translateY(-18px)`;
      const half = 225;
      const timer = window.setTimeout(() => {
        if (floatingEl.current) {
          floatingEl.current.style.transform = `translateY(0px)`;
        }
      }, half);
      return () => window.clearTimeout(timer);
    }
    return;
  }, [activeIndex, len, width]);

  // Update icons transforms/opacity using CSS transitions (no RAF)
  useEffect(() => {
    const end = activeIndex / len;
    for (let i = 0; i < len; i++) {
      const cell = buttonCells.current[i];
      if (!cell) continue;
      const desired = (1 / len) * i;
      const diff = Math.abs(end - desired);
      const va = Math.max(0, 1 - len * diff);
      const translateY = diff < 1 / len ? -va * 16 : 0;
      const opacity = diff < (1 / len) * 0.99 ? len * diff : 1;
      cell.style.transform = `translateY(${translateY}px)`;
      cell.style.opacity = `${opacity}`;
    }
  }, [activeIndex, len]);

  // RAF only to update SVG notch path smoothly
  useEffect(() => {
    let raf = 0;
    const start = animStartRef.current;
    const end = animEndRef.current;
    const t0 = performance.now();
    const dur = 450;
    const loop = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const v = easeOutCubic(t);
      const p = start + (end - start) * v;
      posRef.current = p;
      if (pathEl.current && width > 0) {
        pathEl.current.setAttribute('d', buildPath(width, pathHeight, p, len, dir));
      }
      if (t < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [activeIndex, len, width, dir]);

  // Floating button lift animation (approx. to flutter's _buttonHide)
  // Keep movement upward (never sink below bar)
  const middle = (animStartRef.current + animEndRef.current) / 2;
  const liftDen = Math.max(0.0001, Math.abs(animStartRef.current - middle));
  const liftY = 0; // CSS handles lift animation

  const ActiveIconComp: React.FC = () => {
    // 直接使用 activeIndex 而不是 targetIndex，确保图标和位置同步
    const t = tabs[activeIndex];
    if (!t) return null as any;
    if ('to' in t) {
      const Icon = (t as AppTabLink).Icon;
      return <Icon />;
    }
    if (t.key === 'journal') {
      const journalService = useService(JournalService);
      const docMeta = useService(DocDisplayMetaService);
      const location = { pathname: typeof window !== 'undefined' ? window.location.pathname : '' };
      const maybeDocId = location.pathname.split('/')[1];
      const journalDate = useLiveData(journalService.journalDate$(maybeDocId));
      const Dynamic = useLiveData(docMeta.icon$(maybeDocId));
      const Icon = journalDate ? (Dynamic as React.FC) : TodayIcon;
      return <Icon />;
    }
    if (t.key === 'new') {
      return <EditIcon />;
    }
    return null as any;
  };

  // initialize path and floating position on mount/resize
  useEffect(() => {
    if (width <= 0) return;
    // avoid initial jump: disable transition for first sync
    const restoreFns: Array<() => void> = [];

    if (pathEl.current) {
      pathEl.current.setAttribute('d', buildPath(width, pathHeight, posRef.current, len, dir));
    }
    if (floatingEl.current && !initializedRef.current) {
      // 只在首次初始化时设置位置，避免与动画冲突
      const tabWidth = width / len;
      const tabCenter = activeIndex * tabWidth + tabWidth / 2;
      const left = tabCenter - 26;
      const prev = floatingEl.current.style.transition;
      restoreFns.push(() => (floatingEl.current!.style.transition = prev));
      floatingEl.current.style.transition = 'none';
      floatingEl.current.style.left = `${left}px`;
    }
    // initialize icon cells
    for (let i = 0; i < len; i++) {
      const cell = buttonCells.current[i];
      if (!cell) continue;
      const desired = (1 / len) * i;
      const diff = Math.abs(posRef.current - desired);
      const va = Math.max(0, 1 - len * diff);
      const translateY = diff < 1 / len ? -va * 16 : 0;
      const opacity = diff < (1 / len) * 0.99 ? len * diff : 1;
      if (!initializedRef.current) {
        const prev = cell.style.transition;
        restoreFns.push(() => (cell.style.transition = prev));
        cell.style.transition = 'none';
      }
      cell.style.transform = `translateY(${translateY}px)`;
      cell.style.opacity = `${opacity}`;
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      // restore transitions in next frame
      const timer = window.setTimeout(() => {
        restoreFns.forEach(fn => fn());
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [width, len, dir]);

  const inner = (
    <SafeArea
      id="app-tabs"
      bottom
      className={s.curvedTabs}
      data-fixed={fixed}
      style={{
        // 🎨 只有明确指定 background 时才覆盖主题默认值
        ...(background ? assignInlineVars({ [s.curvedTabsBackground]: background }) : {}),
        visibility: virtualKeyboardVisible ? 'hidden' : 'visible',
      }}
    >
      <div ref={containerRef} className={s.curvedTabsInner}>
        {/* background fill via svg path */}
        <svg
          className={s.svgWrap}
          style={{ bottom: 0 }}
          width={width}
          height={pathHeight}
          viewBox={`0 0 ${width} ${pathHeight}`}
          preserveAspectRatio="none"
          shapeRendering="optimizeSpeed"
        >
          <defs>
            <linearGradient id="curvedTabsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4fc79" />
              <stop offset="100%" stopColor="#96e6a1" />
            </linearGradient>
          </defs>
          <path ref={pathEl} d={buildPath(width, pathHeight, posRef.current, len, dir)} fill="url(#curvedTabsGradient)" stroke={`rgba(0,0,0,0.08)`} strokeWidth="0.5" />
        </svg>

        {/* floating circle button */}
        <div
          className={s.floating}
          style={{
            // Place above bar baseline; increase on lift
            bottom: 30 + liftY,
            // 使用 activeIndex 而不是 posRef.current，避免动画中的位置跳动
            left: width > 0 ? (() => {
              const tabWidth = width / len;
              const tabCenter = activeIndex * tabWidth + tabWidth / 2;
              return tabCenter - 26;
            })() : 0,
            background: '#fff', // ensure good contrast; theme tint applied via icon color
          }}
          ref={floatingEl}
        >
          <ActiveIconComp />
        </div>

        {/* clickable row */}
        <div className={s.buttonsRow} style={{ bottom: 0 }}>
          {tabs.map((t, i) => {
            let content: React.ReactNode;
            if ('to' in t) content = <LinkTab route={t as AppTabLink} />;
            else if (t.key === 'journal') content = <JournalButton />;
            else if (t.key === 'new') content = <CreateButton />;
            else content = null;
            return (
              <div
                key={t.key}
                className={s.buttonCell}
                ref={el => (buttonCells.current[i] = el)}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </SafeArea>
  );

  return fixed ? (typeof document !== 'undefined' ? createPortal(inner, document.body) : inner) : inner;
};

const LinkTab = ({ route }: { route: AppTabLink }) => {
  const Link = route.LinkComponent || WorkbenchLink;
  const cache = useService(GlobalCacheService).globalCache;
  const { markUserNavigation } = useNavigationSyncContext();
  
  const handleClick = useCallback(() => {
    console.log(`[CurvedTabs] 点击链接标签: ${route.key}`);
    
    // 🔧 标记用户主动导航
    markUserNavigation();
    
    const prevId = (cache.get('activeAppTabId') as string) ?? 'home';
    const fromIndex = Math.max(0, tabs.findIndex(t => t.key === prevId));
    cache.set('appTabsFromIndex', fromIndex);
    cache.set('activeAppTabId', route.key);
  }, [cache, route.key, markUserNavigation]);

  return (
    <Link to={route.to} replaceHistory onClick={handleClick}>
      {/* keep icon size consistent */}
      <span className={s.iconStyle} aria-label={route.to.slice(1)}>
        <route.Icon />
      </span>
    </Link>
  );
};

// Minimal journal open action (similar to AppTabJournal)
const JournalButton: React.FC = () => {
  const journalService = useService(JournalService);
  const workbench = useService(WorkbenchService).workbench as any;
  const cache = useService(GlobalCacheService).globalCache;
  const { markUserNavigation } = useNavigationSyncContext();

  const handleOpenToday = useCallback(() => {
    console.log(`[CurvedTabs] 点击日记标签`);
    
    // 🔧 标记用户主动导航
    markUserNavigation();
    
    const prevId = (cache.get('activeAppTabId') as string) ?? 'home';
    const fromIndex = Math.max(0, tabs.findIndex(t => t.key === prevId));
    cache.set('appTabsFromIndex', fromIndex);
    const docId = (journalService as any).ensureJournalByDate(new Date()).id;
    (workbench as any).openDoc({ docId, fromTab: 'true' }, { at: 'active' });
    cache.set('activeAppTabId', 'journal');
  }, [cache, journalService, workbench]);

  return (
    <button onClick={handleOpenToday} style={{ all: 'unset', cursor: 'pointer' }} aria-label="Journal">
      <span className={s.iconStyle}>
        <TodayIcon />
      </span>
    </button>
  );
};

// Minimal create-page action (simplified from AppTabCreate)
const CreateButton: React.FC = () => {
  const workbenchService = useService(WorkbenchService);
  const workspaceService = useService(WorkspaceService);
  const currentWorkspace = workspaceService.workspace;
  const pageHelper = usePageHelper((currentWorkspace as any).docCollection);
  const cache = useService(GlobalCacheService).globalCache;
  const { markUserNavigation } = useNavigationSyncContext();

  const handleCreate = useCallback(async () => {
    try {
      console.log(`[CurvedTabs] 点击创建标签`);
      
      // 🔧 标记用户主动导航
      markUserNavigation();
      
      const prevId = (cache.get('activeAppTabId') as string) ?? 'home';
      const fromIndex = Math.max(0, tabs.findIndex(t => t.key === prevId));
      cache.set('appTabsFromIndex', fromIndex);
      // Prefer simple create to reduce coupling; fallback to docsService if available
      const doc = pageHelper.createPage(undefined, { show: false });
      (workbenchService as any).workbench.openDoc({ docId: doc.id, fromTab: 'true' });
      cache.set('activeAppTabId', 'new');
    } catch (e) {
      // noop
    }
  }, [cache, pageHelper, workbenchService]);

  return (
    <button onClick={handleCreate} style={{ all: 'unset', cursor: 'pointer' }} aria-label="Create">
      <span className={s.iconStyle}>
        <EditIcon />
      </span>
    </button>
  );
};

export default CurvedAppTabs;

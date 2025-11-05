import { RadioGroup, Scrollable } from '@yunke/component';
import { ThemeEditorService } from '@yunke/core/modules/theme-editor';
import { useService } from '@toeverything/infra';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ThemeEmpty } from './components/empty';
import { ThemeTreeNode } from './components/tree-node';
import { VariableList } from './components/variable-list';
import { yunkeThemes, type TreeNode } from './resource';
import * as styles from './theme-editor.css';

const SIDEBAR_WIDTH_KEY = 'theme-editor-sidebar-width';
const DEFAULT_SIDEBAR_WIDTH = 240;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 600;

export const ThemeEditor = () => {
  const themeEditor = useService(ThemeEditorService);
  const [version, setVersion] = useState<'v1' | 'v2'>('v1');
  const [activeNode, setActiveNode] = useState<TreeNode | null>();
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, parseInt(saved, 10))) : DEFAULT_SIDEBAR_WIDTH;
  });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const { nodeMap, variableMap, tree } = yunkeThemes[version];

  const [customizedNodeIds, setCustomizedNodeIds] = useState<Set<string>>(
    new Set()
  );

  // workaround for the performance issue of using `useLiveData(themeEditor.customTheme$)` here
  useEffect(() => {
    const sub = themeEditor.customTheme$.subscribe(customTheme => {
      const ids = Array.from(
        new Set([
          ...Object.keys(customTheme?.light ?? {}),
          ...Object.keys(customTheme?.dark ?? {}),
        ])
      ).reduce((acc, name) => {
        const variable = variableMap.get(name);
        if (!variable) return acc;
        variable.ancestors.forEach(id => acc.add(id));
        return acc;
      }, new Set<string>());

      setCustomizedNodeIds(prev => {
        const isSame =
          Array.from(ids).every(id => prev.has(id)) &&
          Array.from(prev).every(id => ids.has(id));
        return isSame ? prev : ids;
      });
    });
    return () => sub.unsubscribe();
  }, [themeEditor.customTheme$, variableMap]);

  const onToggleVersion = useCallback((v: 'v1' | 'v2') => {
    setVersion(v);
    setActiveNode(null);
  }, []);

  const isActive = useCallback(
    (node: TreeNode) => {
      let pointer = activeNode;
      while (pointer) {
        if (!pointer) return false;
        if (pointer === node) return true;
        pointer = pointer.parentId ? nodeMap.get(pointer.parentId) : undefined;
      }
      return false;
    },
    [activeNode, nodeMap]
  );

  const isCustomized = useCallback(
    (node: TreeNode) => customizedNodeIds.has(node.id),
    [customizedNodeIds]
  );

  // 处理侧边栏拖拽调整宽度
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !sidebarRef.current) return;
      
      const newWidth = moveEvent.clientX;
      const clampedWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth));
      setSidebarWidth(clampedWidth);
      localStorage.setItem(SIDEBAR_WIDTH_KEY, clampedWidth.toString());
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className={styles.root}>
      <div
        ref={sidebarRef}
        className={styles.sidebar}
        style={{ width: sidebarWidth }}
      >
        <header className={styles.sidebarHeader}>
          <RadioGroup
            width="100%"
            value={version}
            onChange={onToggleVersion}
            items={['v1', 'v2']}
          />
        </header>
        <Scrollable.Root className={styles.sidebarScrollable} key={version}>
          <Scrollable.Viewport>
            {tree.map(node => (
              <ThemeTreeNode
                key={node.id}
                node={node}
                checked={activeNode ?? undefined}
                setActive={setActiveNode}
                isActive={isActive}
                isCustomized={isCustomized}
              />
            ))}
          </Scrollable.Viewport>
          <Scrollable.Scrollbar />
        </Scrollable.Root>
      </div>
      <div
        className={styles.sidebarResizer}
        onMouseDown={handleMouseDown}
        title="拖拽调整侧边栏宽度"
      />
      {activeNode ? <VariableList node={activeNode} /> : <ThemeEmpty />}
    </div>
  );
};

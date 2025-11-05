import { Skeleton } from '@yunke/component';
import { getViewManager } from '@yunke/core/blocksuite/manager/view';
import type { EditorSettingSchema } from '@yunke/core/modules/editor-setting';
import { EditorSettingService } from '@yunke/core/modules/editor-setting';
import { EdgelessCRUDIdentifier } from '@blocksuite/yunke/blocks/surface';
import { Bound } from '@blocksuite/yunke/global/gfx';
import { ViewportElementExtension } from '@blocksuite/yunke/shared/services';
import type { EditorHost } from '@blocksuite/yunke/std';
import { BlockStdScope } from '@blocksuite/yunke/std';
import {
  GfxControllerIdentifier,
  type GfxPrimitiveElementModel,
} from '@blocksuite/yunke/std/gfx';
import type { Block, Store } from '@blocksuite/yunke/store';
import { useFramework } from '@toeverything/infra';
import { isEqual } from 'lodash-es';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { map, pairwise } from 'rxjs';

import {
  editorWrapper,
  snapshotContainer,
  snapshotLabel,
  snapshotSkeleton,
  snapshotTitle,
} from '../style.css';
import { type DocName, getDocByName } from './docs';
import { getFrameBlock } from './utils';

interface Props {
  title: string;
  docName: DocName;
  keyName: keyof EditorSettingSchema;
  height?: number;
  getElements: (doc: Store) => Array<Block | GfxPrimitiveElementModel>;
  firstUpdate?: (doc: Store, editorHost: EditorHost) => void;
  children?: React.ReactElement;
}

const boundMap = new Map<DocName, Bound>();

export const EdgelessSnapshot = (props: Props) => {
  const {
    title,
    docName,
    keyName,
    height = 180,
    getElements,
    firstUpdate,
    children,
  } = props;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const docRef = useRef<Store | null>(null);
  const editorHostRef = useRef<EditorHost | null>(null);
  const framework = useFramework();
  const { editorSetting } = framework.get(EditorSettingService);

  const extensions = useMemo(() => {
    const manager = getViewManager()
      .config.init()
      .foundation(framework)
      .theme(framework)
      .database(framework)
      .linkedDoc(framework)
      .codeBlockHtmlPreview(framework).value;
    return manager
      .get('preview-edgeless')
      .concat([ViewportElementExtension('.ref-viewport')]);
  }, [framework]);

  const updateElements = useCallback(() => {
    const editorHost = editorHostRef.current;
    const doc = docRef.current;
    if (!editorHost || !doc) return;
    const crud = editorHost.std.get(EdgelessCRUDIdentifier);
    const elements = getElements(doc);
    const props = editorSetting.get(keyName) as any;
    doc.readonly = false;
    elements.forEach(element => {
      crud.updateElement(element.id, props);
    });
    doc.readonly = true;
  }, [editorSetting, getElements, keyName]);

  const renderEditor = useCallback(async () => {
    if (!wrapperRef.current) return;
    const doc = await getDocByName(docName);
    if (!doc) return;

    const editorHost = new BlockStdScope({
      store: doc,
      extensions,
    }).render();
    docRef.current = doc;
    editorHostRef.current?.remove();
    editorHostRef.current = editorHost;

    // 先添加到 DOM，让 viewport 可以初始化
    wrapperRef.current.append(editorHost);

    // 等待 viewport 初始化完成
    const gfx = editorHost.std.get(GfxControllerIdentifier);
    
    // 等待 viewport 准备好
    await new Promise<void>((resolve) => {
      let attempts = 0;
      const maxAttempts = 50; // 最多等待 1 秒 (50 * 20ms)
      const checkViewport = () => {
        attempts++;
        try {
          if (gfx.viewport.viewportElement) {
            resolve();
          } else if (attempts < maxAttempts) {
            setTimeout(checkViewport, 20);
          } else {
            resolve(); // 超时后继续执行
          }
        } catch {
          if (attempts < maxAttempts) {
            setTimeout(checkViewport, 20);
          } else {
            resolve(); // 超时后继续执行
          }
        }
      };
      checkViewport();
    });

    // 设置一个默认的 viewport，确保元素在可视区域内
    // 预览区域宽度约 600px，高度为 height
    const defaultBound = new Bound(0, 0, 600, height);
    gfx.viewport.setViewportByBound(defaultBound);

    // 等待一帧，确保 viewport 设置生效
    await new Promise(resolve => requestAnimationFrame(resolve));

    // 现在 viewport 已经设置好，可以创建和更新元素了
    if (firstUpdate) {
      firstUpdate(doc, editorHost);
    } else {
      updateElements();
    }

    // 等待元素创建完成后再调整 viewport
    await new Promise(resolve => requestAnimationFrame(resolve));

    // 根据实际元素位置调整 viewport
    const elements = getElements(doc);
    if (elements.length > 0) {
      const bounds = elements
        .map(el => {
          if ('xywh' in el) {
            return Bound.deserialize(el.xywh as string);
          }
          return null;
        })
        .filter((b): b is Bound => b !== null);
      
      if (bounds.length > 0) {
        const unionBound = bounds.reduce((acc, b) => acc.unite(b), bounds[0]);
        // 添加一些边距，确保元素完全可见
        const padding = 50;
        const viewportBound = new Bound(
          unionBound.x - padding,
          unionBound.y - padding,
          unionBound.w + padding * 2,
          unionBound.h + padding * 2
        );
        gfx.viewport.setViewportByBound(viewportBound);
      }
    }

    // 处理 frame 块的删除和 viewport 更新
    const disposable = editorHost.std.view.viewUpdated.subscribe(payload => {
      if (
        payload.type !== 'block' ||
        payload.method !== 'add' ||
        payload.view.model.flavour !== 'yunke:page'
      ) {
        return;
      }
      doc.readonly = false;
      const frame = getFrameBlock(doc);
      if (frame && docName !== 'frame') {
        boundMap.set(docName, Bound.deserialize(frame.xywh));
        doc.deleteBlock(frame);
      }
      const bound = boundMap.get(docName);
      if (bound) {
        gfx.viewport.setViewportByBound(bound);
        // 更新元素位置
        if (firstUpdate) {
          firstUpdate(doc, editorHost);
        } else {
          updateElements();
        }
      }
      doc.readonly = true;
      disposable.unsubscribe();
    });
  }, [docName, extensions, firstUpdate, updateElements, getElements, height]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    renderEditor();
    return () => editorHostRef.current?.remove();
  }, [renderEditor]);

  // observe editor settings change
  useEffect(() => {
    const sub = editorSetting.provider
      .watchAll()
      .pipe(
        map(settings => {
          if (typeof settings[keyName] === 'string') {
            return JSON.parse(settings[keyName]);
          }
          return keyName;
        }),
        pairwise()
      )
      .subscribe(([prev, current]) => {
        if (!isEqual(prev, current)) {
          updateElements();
        }
      });
    return () => sub.unsubscribe();
  }, [editorSetting.provider, keyName, updateElements]);

  return (
    <div className={snapshotContainer}>
      <div className={snapshotTitle}>{title}</div>
      <div className={snapshotLabel}>{title}</div>
      <div ref={wrapperRef} className={editorWrapper} style={{ height }}>
        <Skeleton
          className={snapshotSkeleton}
          variant="rounded"
          height={'100%'}
        />
      </div>
      {children}
    </div>
  );
};

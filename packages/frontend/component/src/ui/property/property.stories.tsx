import { FrameIcon } from '@blocksuite/icons/rc';

import { useDraggable, useDropTarget } from '../dnd';
import { MenuItem } from '../menu';
import {
  PropertyCollapsibleContent,
  PropertyCollapsibleSection,
  PropertyName,
  PropertyRoot,
  PropertyValue,
} from './property';

export default {
  title: 'UI/Property',
};

export const SingleProperty = () => {
  return (
    <>
      <PropertyRoot>
        <PropertyName name="名称" icon={<FrameIcon />} />
        <PropertyValue>值</PropertyValue>
      </PropertyRoot>
      <PropertyRoot>
        <PropertyName name="很长的名称长长长长长长长长长" icon={<FrameIcon />} />
        <PropertyValue>值</PropertyValue>
      </PropertyRoot>

      <PropertyRoot>
        <PropertyName
          name="带菜单"
          icon={<FrameIcon />}
          menuItems={<MenuItem>菜单</MenuItem>}
        />
        <PropertyValue>值</PropertyValue>
      </PropertyRoot>

      <PropertyRoot>
        <PropertyName name="只读" icon={<FrameIcon />} />
        <PropertyValue readonly>只读值</PropertyValue>
      </PropertyRoot>
    </>
  );
};

export const DNDProperty = () => {
  const { dragRef: dragRef1 } = useDraggable(
    () => ({
      data: { text: 'hello' },
    }),
    []
  );
  const { dragRef: dragRef2 } = useDraggable(
    () => ({
      data: { text: 'hello' },
    }),
    []
  );
  const { dropTargetRef, closestEdge } = useDropTarget(
    () => ({
      closestEdge: {
        allowedEdges: ['top', 'bottom'],
      },
    }),
    []
  );
  return (
    <>
      <PropertyRoot ref={dragRef1}>
        <PropertyName name="可拖拽" icon={<FrameIcon />} />
        <PropertyValue>值</PropertyValue>
      </PropertyRoot>
      <PropertyRoot ref={dragRef2}>
        <PropertyName
          name="可拖拽菜单"
          icon={<FrameIcon />}
          menuItems={<MenuItem>菜单</MenuItem>}
        />
        <PropertyValue>值</PropertyValue>
      </PropertyRoot>
      <PropertyRoot ref={dropTargetRef} dropIndicatorEdge={closestEdge}>
        <PropertyName name="放置目标" icon={<FrameIcon />} />
        <PropertyValue>值</PropertyValue>
      </PropertyRoot>
    </>
  );
};

export const HideEmptyProperty = () => {
  return (
    <>
      <PropertyRoot hideEmpty>
        <PropertyName name="不应该被隐藏" icon={<FrameIcon />} />
        <PropertyValue>值</PropertyValue>
      </PropertyRoot>
      <PropertyRoot hideEmpty>
        <PropertyName name="应该被隐藏" icon={<FrameIcon />} />
        <PropertyValue isEmpty>值</PropertyValue>
      </PropertyRoot>
    </>
  );
};

export const BasicPropertyCollapsibleContent = () => {
  return (
    <PropertyCollapsibleContent collapsible>
      <PropertyRoot>
        <PropertyName name="始终显示" icon={<FrameIcon />} />
        <PropertyValue>值</PropertyValue>
      </PropertyRoot>
      <PropertyRoot hideEmpty>
        <PropertyName name="空值时隐藏" icon={<FrameIcon />} />
        <PropertyValue isEmpty>值</PropertyValue>
      </PropertyRoot>
      <PropertyRoot hide>
        <PropertyName name="隐藏" icon={<FrameIcon />} />
        <PropertyValue>值</PropertyValue>
      </PropertyRoot>
    </PropertyCollapsibleContent>
  );
};

export const BasicPropertyCollapsibleSection = () => {
  return (
    <PropertyCollapsibleSection
      icon={<FrameIcon />}
      title="可折叠区域"
    >
      <BasicPropertyCollapsibleContent />
    </PropertyCollapsibleSection>
  );
};

export const PropertyCollapsibleCustomButton = () => {
  return (
    <PropertyCollapsibleContent
      collapsible
      collapseButtonText={({ hide, isCollapsed }) =>
        `${isCollapsed ? '显示' : '隐藏'} ${hide} 个属性`
      }
    >
      <PropertyRoot>
        <PropertyName name="始终显示" icon={<FrameIcon />} />
        <PropertyValue>值</PropertyValue>
      </PropertyRoot>
      <PropertyRoot hideEmpty>
        <PropertyName name="空值时隐藏" icon={<FrameIcon />} />
        <PropertyValue isEmpty>值</PropertyValue>
      </PropertyRoot>
      <PropertyRoot hide>
        <PropertyName name="隐藏" icon={<FrameIcon />} />
        <PropertyValue>值</PropertyValue>
      </PropertyRoot>
    </PropertyCollapsibleContent>
  );
};

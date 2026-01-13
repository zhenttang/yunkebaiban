import type { YunkeDNDEntity } from '@yunke/core/types/dnd';

export const allowedSplitViewEntityTypes: Set<YunkeDNDEntity['type']> =
  new Set(['doc', 'collection', 'tag']);

export const inferToFromEntity = (entity: YunkeDNDEntity) => {
  if (entity.type === 'doc') {
    return `/${entity.id}`;
  } else if (entity.type === 'collection') {
    return `/collection/${entity.id}`;
  } else if (entity.type === 'tag') {
    return `/tag/${entity.id}`;
  }
  return null;
};

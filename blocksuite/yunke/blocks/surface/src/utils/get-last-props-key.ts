import { getShapeName, type ShapeProps } from '@blocksuite/yunke-model';
import type {
  LastProps,
  LastPropsKey,
} from '@blocksuite/yunke-shared/services';
import { NodePropsSchema } from '@blocksuite/yunke-shared/utils';

const LastPropsSchema = NodePropsSchema;

export function getLastPropsKey(
  modelType: string,
  modelProps: Partial<LastProps[LastPropsKey]>
): LastPropsKey | null {
  if (modelType === 'shape') {
    const { shapeType, radius } = modelProps as ShapeProps;
    const shapeName = getShapeName(shapeType, radius);
    return `${modelType}:${shapeName}`;
  }

  if (isLastPropsKey(modelType)) {
    return modelType;
  }

  return null;
}

function isLastPropsKey(key: string): key is LastPropsKey {
  return Object.keys(LastPropsSchema.shape).includes(key);
}

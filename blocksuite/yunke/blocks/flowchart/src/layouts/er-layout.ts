/**
 * ER 图布局引擎
 */

import { BaseLayoutEngine } from '../core/base-layout.js';
import type {
  DiagramElement,
  DiagramModel,
  DiagramRelationship,
  LayoutResult,
  LayoutedElement,
  LayoutedRelationship,
} from '../core/diagram-types.js';

const ENTITY_WIDTH = 140;
const ENTITY_HEIGHT = 70;
const RELATIONSHIP_SIZE = 90;
const ATTRIBUTE_WIDTH = 110;
const ATTRIBUTE_HEIGHT = 48;

const COLUMN_GAP = 220;
const ROW_GAP = 180;
const ATTRIBUTE_OFFSET = 80;
const ATTRIBUTE_GAP = 26;

interface PositionedEntity {
  element: DiagramElement;
  column: number;
  row: number;
  order: number;
  position: {
    x: number;
    y: number;
  };
  attributes: DiagramElement[];
}

export class ErLayoutEngine extends BaseLayoutEngine {
  readonly supportedType = 'er' as const;

  layout(model: DiagramModel): LayoutResult {
    const entities = model.elements.filter(
      elem => elem.data?.role === 'entity'
    );
    const attributes = model.elements.filter(
      elem => elem.data?.role === 'attribute'
    );
    const relationships = model.elements.filter(
      elem => elem.data?.role === 'relationship'
    );

    const positionedEntities = this.positionEntities(entities, attributes);

    const layoutedEntities: LayoutedElement[] = [];
    const layoutedAttributes: LayoutedElement[] = [];
    const attributeCenterMap = new Map<string, { x: number; y: number }>();
    const entityCenterMap = new Map<string, { x: number; y: number }>();

    positionedEntities.forEach(entity => {
      layoutedEntities.push({
        ...(entity.element as DiagramElement),
        position: { ...entity.position },
        size: {
          width: ENTITY_WIDTH,
          height: ENTITY_HEIGHT,
        },
      });

      entityCenterMap.set(entity.element.id, {
        x: entity.position.x + ENTITY_WIDTH / 2,
        y: entity.position.y + ENTITY_HEIGHT / 2,
      });

      const attrBySide: Record<'left' | 'right' | 'top' | 'bottom', DiagramElement[]> = {
        left: [],
        right: [],
        top: [],
        bottom: [],
      };

      entity.attributes.forEach(attr => {
        const side = (attr.data?.side as keyof typeof attrBySide) || 'left';
        attrBySide[side].push(attr);
      });

      (Object.keys(attrBySide) as Array<keyof typeof attrBySide>).forEach(
        side => {
          const attrs = attrBySide[side];
          if (attrs.length === 0) return;

          attrs.sort(
            (a, b) =>
              (Number(a.data?.order) || 0) - (Number(b.data?.order) || 0)
          );

          const positions = this.calculateAttributePositions(
            entity.position,
            attrs.length,
            side
          );

          attrs.forEach((attr, index) => {
            const { x, y } = positions[index];
            layoutedAttributes.push({
              ...attr,
              position: { x, y },
              size: {
                width: ATTRIBUTE_WIDTH,
                height: ATTRIBUTE_HEIGHT,
              },
            });

            attributeCenterMap.set(attr.id, {
              x: x + ATTRIBUTE_WIDTH / 2,
              y: y + ATTRIBUTE_HEIGHT / 2,
            });
          });
        }
      );
    });

    const relationshipLayout = this.positionRelationships(
      relationships,
      entityCenterMap,
      attributeCenterMap,
      model.relationships
    );

    const allElements: LayoutedElement[] = [
      ...layoutedEntities,
      ...layoutedAttributes,
      ...relationshipLayout.nodes,
    ];

    const allRelationships: LayoutedRelationship[] = relationshipLayout.edges;

    const bounds = this.calculateBounds(allElements);

    return {
      elements: allElements,
      relationships: allRelationships,
      bounds,
    };
  }

  private positionEntities(
    entities: DiagramElement[],
    attributes: DiagramElement[]
  ): PositionedEntity[] {
    const padding = this.defaultConfig.padding;

    const columns = new Map<number, DiagramElement[]>();

    entities.forEach(entity => {
      const column = Number.isFinite(entity.data?.column)
        ? Number(entity.data?.column)
        : 0;
      const colEntities = columns.get(column) ?? [];
      colEntities.push(entity);
      columns.set(column, colEntities);
    });

    const sortedColumns = Array.from(columns.entries()).sort(
      (a, b) => a[0] - b[0]
    );

    const positioned: PositionedEntity[] = [];

    sortedColumns.forEach(([column, entityList], columnIndex) => {
      entityList.sort((a, b) => {
        const rowA = Number.isFinite(a.data?.row) ? Number(a.data?.row) : 0;
        const rowB = Number.isFinite(b.data?.row) ? Number(b.data?.row) : 0;
        if (rowA !== rowB) return rowA - rowB;
        const orderA = Number.isFinite(a.data?.order) ? Number(a.data?.order) : 0;
        const orderB = Number.isFinite(b.data?.order) ? Number(b.data?.order) : 0;
        return orderA - orderB;
      });

      entityList.forEach((entity, indexInColumn) => {
        const columnPosition = columnIndex;
        const columnOffset = columnPosition * (ENTITY_WIDTH + COLUMN_GAP);

        const rowValue = Number.isFinite(entity.data?.row)
          ? Number(entity.data?.row)
          : indexInColumn;
        const rowOffset = rowValue * (ENTITY_HEIGHT + ROW_GAP);

        const position = {
          x: padding + columnOffset,
          y: padding + rowOffset,
        };

        const entityAttributes = attributes.filter(
          attr => attr.data?.entityId === entity.id
        );

        positioned.push({
          element: entity,
          column,
          row: rowValue,
          order: Number(entity.data?.order) || 0,
          position,
          attributes: entityAttributes,
        });
      });
    });

    return positioned;
  }

  private calculateAttributePositions(
    entityPosition: { x: number; y: number },
    count: number,
    side: 'left' | 'right' | 'top' | 'bottom'
  ) {
    const positions: Array<{ x: number; y: number }> = [];

    const entityCenterX = entityPosition.x + ENTITY_WIDTH / 2;
    const entityCenterY = entityPosition.y + ENTITY_HEIGHT / 2;

    if (side === 'left' || side === 'right') {
      const offsetX =
        side === 'left'
          ? entityPosition.x - ATTRIBUTE_WIDTH - ATTRIBUTE_OFFSET
          : entityPosition.x + ENTITY_WIDTH + ATTRIBUTE_OFFSET;

      const totalHeight =
        count > 1
          ? count * ATTRIBUTE_HEIGHT + (count - 1) * ATTRIBUTE_GAP
          : ATTRIBUTE_HEIGHT;
      let startY = entityCenterY - totalHeight / 2;

      for (let i = 0; i < count; i++) {
        positions.push({
          x: offsetX,
          y: startY,
        });
        startY += ATTRIBUTE_HEIGHT + ATTRIBUTE_GAP;
      }
    } else {
      const offsetY =
        side === 'top'
          ? entityPosition.y - ATTRIBUTE_HEIGHT - ATTRIBUTE_OFFSET
          : entityPosition.y + ENTITY_HEIGHT + ATTRIBUTE_OFFSET;

      const totalWidth =
        count > 1
          ? count * ATTRIBUTE_WIDTH + (count - 1) * ATTRIBUTE_GAP
          : ATTRIBUTE_WIDTH;
      let startX = entityCenterX - totalWidth / 2;

      for (let i = 0; i < count; i++) {
        positions.push({
          x: startX,
          y: offsetY,
        });
        startX += ATTRIBUTE_WIDTH + ATTRIBUTE_GAP;
      }
    }

    return positions;
  }

  private positionRelationships(
    relationshipNodes: DiagramElement[],
    entityCenterMap: Map<string, { x: number; y: number }>,
    attributeCenterMap: Map<string, { x: number; y: number }>,
    relationships: DiagramRelationship[]
  ): { nodes: LayoutedElement[]; edges: LayoutedRelationship[] } {
    const layoutedNodes: LayoutedElement[] = [];
    const layoutedEdges: LayoutedRelationship[] = [];

    relationshipNodes.forEach(node => {
      const connectionIds = (node.data?.connectionIds as string[] | undefined) ?? [];
      const centers = connectionIds
        .map(id => entityCenterMap.get(id))
        .filter(Boolean) as Array<{ x: number; y: number }>;

      if (centers.length === 0) {
        layoutedNodes.push({
          ...node,
          position: { x: 0, y: 0 },
          size: { width: RELATIONSHIP_SIZE, height: RELATIONSHIP_SIZE },
        });
        return;
      }

      const avgX = centers.reduce((sum, c) => sum + c.x, 0) / centers.length;
      const avgY = centers.reduce((sum, c) => sum + c.y, 0) / centers.length;

      layoutedNodes.push({
        ...node,
        position: {
          x: avgX - RELATIONSHIP_SIZE / 2,
          y: avgY - RELATIONSHIP_SIZE / 2,
        },
        size: {
          width: RELATIONSHIP_SIZE,
          height: RELATIONSHIP_SIZE,
        },
      });
    });

    const relationshipCenterMap = new Map<string, { x: number; y: number }>();
    layoutedNodes.forEach(node => {
      relationshipCenterMap.set(node.id, {
        x: node.position.x + RELATIONSHIP_SIZE / 2,
        y: node.position.y + RELATIONSHIP_SIZE / 2,
      });
    });

    relationships.forEach(rel => {
      const isRelationshipEdge = rel.data?.edgeType === 'er-relationship';
      const isAttributeEdge = rel.data?.edgeType === 'er-attribute';

      if (isRelationshipEdge) {
        const start = relationshipCenterMap.get(rel.source);
        const end = entityCenterMap.get(rel.target);
        if (start && end) {
          layoutedEdges.push({
            ...rel,
            points: [
              { x: start.x, y: start.y },
              { x: end.x, y: end.y },
            ],
          });
        }
        return;
      }

      if (isAttributeEdge) {
        const attrCenter = attributeCenterMap.get(rel.source);
        const entityCenter = entityCenterMap.get(rel.target);
        if (attrCenter && entityCenter) {
          layoutedEdges.push({
            ...rel,
            points: [
              { x: attrCenter.x, y: attrCenter.y },
              { x: entityCenter.x, y: entityCenter.y },
            ],
          });
        }
        return;
      }

      const startFallback =
        relationshipCenterMap.get(rel.source) ?? attributeCenterMap.get(rel.source);
      const endFallback =
        entityCenterMap.get(rel.target) ?? attributeCenterMap.get(rel.target);

      if (startFallback && endFallback) {
        layoutedEdges.push({
          ...rel,
          points: [
            { x: startFallback.x, y: startFallback.y },
            { x: endFallback.x, y: endFallback.y },
          ],
        });
      }
    });

    return {
      nodes: layoutedNodes,
      edges: layoutedEdges,
    };
  }
}

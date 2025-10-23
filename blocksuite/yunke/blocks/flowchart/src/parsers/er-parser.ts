/**
 * ER 图解析器
 */

import { BaseParser } from '../core/base-parser.js';
import type {
  DiagramElement,
  DiagramModel,
  DiagramRelationship,
} from '../core/diagram-types.js';

interface RawAttribute {
  id: string;
  label: string;
  side: 'left' | 'right' | 'top' | 'bottom';
}

interface RawEntity {
  id: string;
  label: string;
  column?: number;
  row?: number;
  order: number;
  attributes: RawAttribute[];
}

interface RawConnection {
  role: 'from' | 'to';
  entityId: string;
  cardinality?: string;
}

interface RawRelationship {
  id: string;
  label: string;
  connections: RawConnection[];
}

export class ErParser extends BaseParser {
  readonly supportedType = 'er' as const;

  parse(dslCode: string): DiagramModel {
    const lines = this.splitLines(dslCode);

    let diagramName = '未命名 ER 图';
    const entities = new Map<string, RawEntity>();
    const relationships = new Map<string, RawRelationship>();

    let braceLevel = 0;
    let currentEntity: RawEntity | null = null;
    let currentRelationship: RawRelationship | null = null;
    let entityOrder = 0;

    const pushEntity = (entity: RawEntity | null) => {
      if (!entity) return;
      if (entities.has(entity.id)) {
        throw new Error(`重复的 entity 定义: ${entity.id}`);
      }
      entities.set(entity.id, entity);
    };

    const pushRelationship = (rel: RawRelationship | null) => {
      if (!rel) return;
      if (relationships.has(rel.id)) {
        throw new Error(`重复的 relationship 定义: ${rel.id}`);
      }
      if (rel.connections.length < 2) {
        throw new Error(`relationship ${rel.id} 至少需要连接两个实体`);
      }
      relationships.set(rel.id, rel);
    };

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      if (this.isSkippableLine(rawLine)) continue;
      const line = rawLine.trim();

      const diagramMatch = line.match(
        /diagram\s+"([^"]+)"\s+type\s+"er"\s*\{/
      );
      if (diagramMatch) {
        diagramName = diagramMatch[1];
        braceLevel++;
        continue;
      }

      if (line === '{') {
        braceLevel++;
        continue;
      }

      if (line === '}') {
        if (currentEntity) {
          pushEntity(currentEntity);
          currentEntity = null;
        } else if (currentRelationship) {
          pushRelationship(currentRelationship);
          currentRelationship = null;
        }
        braceLevel = Math.max(0, braceLevel - 1);
        continue;
      }

      if (currentEntity) {
        const attributeMatch = line.match(
          /^attribute\s+(\w+)\s+label\s+"([^"]+)"(?:\s+side\s+(left|right|top|bottom))?/i
        );
        if (attributeMatch) {
          const [, attrId, attrLabel, sideValue] = attributeMatch;
          currentEntity.attributes.push({
            id: attrId,
            label: attrLabel,
            side: (sideValue as RawAttribute['side']) || 'left',
          });
          continue;
        }

        throw new Error(`无法解析 attribute: ${line}`);
      }

      if (currentRelationship) {
        const connectionMatch = line.match(
          /^(from|to)\s+(\w+)(?:\s+cardinality\s+"([^"]+)")?/i
        );
        if (connectionMatch) {
          const [, roleRaw, entityId, cardinality] = connectionMatch;
          currentRelationship.connections.push({
            role: roleRaw.toLowerCase() as 'from' | 'to',
            entityId,
            cardinality,
          });
          continue;
        }

        throw new Error(`无法解析 relationship 连接: ${line}`);
      }

      const entityBlockMatch = line.match(
        /^entity\s+(\w+)\s+label\s+"([^"]+)"(.*)\{/i
      );
      if (entityBlockMatch) {
        const [, entityId, label, tail] = entityBlockMatch;
        const columnMatch = tail.match(/column\s+(-?\d+(?:\.\d+)?)/i);
        const rowMatch = tail.match(/row\s+(-?\d+(?:\.\d+)?)/i);

        currentEntity = {
          id: entityId,
          label,
          column: columnMatch ? Number(columnMatch[1]) : undefined,
          row: rowMatch ? Number(rowMatch[1]) : undefined,
          attributes: [],
          order: entityOrder++,
        };
        braceLevel++;
        continue;
      }

      const entitySingleMatch = line.match(
        /^entity\s+(\w+)\s+label\s+"([^"]+)"(.*)$/i
      );
      if (entitySingleMatch) {
        const [, entityId, label, tail] = entitySingleMatch;
        const columnMatch = tail.match(/column\s+(-?\d+(?:\.\d+)?)/i);
        const rowMatch = tail.match(/row\s+(-?\d+(?:\.\d+)?)/i);

        pushEntity({
          id: entityId,
          label,
          column: columnMatch ? Number(columnMatch[1]) : undefined,
          row: rowMatch ? Number(rowMatch[1]) : undefined,
          attributes: [],
          order: entityOrder++,
        });
        continue;
      }

      const relationshipMatch = line.match(
        /^relationship\s+(\w+)\s+label\s+"([^"]+)"\s*\{/i
      );
      if (relationshipMatch) {
        const [, relId, label] = relationshipMatch;
        currentRelationship = {
          id: relId,
          label,
          connections: [],
        };
        braceLevel++;
        continue;
      }

      throw new Error(`无法解析的语句: ${line}`);
    }

    const elements: DiagramElement[] = [];
    const relationshipsResult: DiagramRelationship[] = [];

    const ENTITY_STYLE = {
      fillColor: '#9ccc65',
      strokeColor: '#558b2f',
      strokeWidth: 2,
      filled: true,
      radius: 8,
      textColor: '#1a1a1a',
    } as const;

    const ATTRIBUTE_STYLE = {
      fillColor: '#ffffff',
      strokeColor: '#3f51b5',
      strokeWidth: 2,
      filled: true,
      textColor: '#1a1a1a',
    } as const;

    const REL_STYLE = {
      fillColor: '#ffffff',
      strokeColor: '#3f51b5',
      strokeWidth: 2,
      filled: true,
      textColor: '#1a1a1a',
    } as const;

    entities.forEach(entity => {
      elements.push({
        id: entity.id,
        type: 'node',
        shape: 'roundrect',
        label: entity.label,
        style: { ...ENTITY_STYLE },
        data: {
          role: 'entity',
          column: entity.column,
          row: entity.row,
          order: entity.order,
          attributeIds: entity.attributes.map(attr => `${entity.id}.${attr.id}`),
        },
      });

      entity.attributes.forEach((attr, attrIndex) => {
        const attrId = `${entity.id}.${attr.id}`;
        elements.push({
          id: attrId,
          type: 'node',
          shape: 'ellipse',
          label: attr.label,
          style: { ...ATTRIBUTE_STYLE },
          data: {
            role: 'attribute',
            entityId: entity.id,
            side: attr.side,
            order: attrIndex,
          },
        });

        relationshipsResult.push({
          id: `${entity.id}-${attrId}`,
          type: 'edge',
          source: attrId,
          target: entity.id,
          label: '',
          style: {
            stroke: '#3f51b5',
            strokeWidth: 2,
            strokeStyle: 'solid',
            sourceArrow: 'none',
            targetArrow: 'none',
          },
          data: {
            edgeType: 'er-attribute',
            entityId: entity.id,
            attributeId: attrId,
          },
        });
      });
    });

    relationships.forEach(rel => {
      elements.push({
        id: rel.id,
        type: 'node',
        shape: 'diamond',
        label: rel.label,
        style: { ...REL_STYLE },
        data: {
          role: 'relationship',
          connectionIds: rel.connections.map(conn => conn.entityId),
        },
      });

      rel.connections.forEach((conn, index) => {
        relationshipsResult.push({
          id: `${rel.id}-${conn.entityId}-${index}`,
          type: 'edge',
          source: rel.id,
          target: conn.entityId,
          label: conn.cardinality,
          style: {
            stroke: '#3f51b5',
            strokeWidth: 2,
            strokeStyle: 'solid',
            sourceArrow: 'none',
            targetArrow: 'none',
          },
          data: {
            edgeType: 'er-relationship',
            connectionRole: conn.role,
            cardinality: conn.cardinality,
          },
        });
      });
    });

    return {
      id: this.generateId('diagram'),
      name: diagramName,
      type: 'er',
      config: {
        layout: 'er',
        direction: 'LR',
      },
      elements,
      relationships: relationshipsResult,
      metadata: {
        entityCount: elements.filter(e => e.data?.role === 'entity').length,
        relationshipCount: elements.filter(e => e.data?.role === 'relationship').length,
      },
    };
  }
}

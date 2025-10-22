/**
 * 分层架构图解析器
 * 
 * 支持的 DSL 语法：
 * 
 * diagram "技术架构" type "layered" {
 *   layer frontend label "表现层" color "#c8e6c9" {
 *     node react label "React"
 *     node vue label "Vue"
 *   }
 * }
 */

import { BaseParser } from '../core/base-parser.js';
import type { DiagramModel, DiagramElement, DiagramRelationship } from '../core/diagram-types.js';

interface LayerDef {
  id: string;
  label: string;
  color?: string;
  nodeIds: string[];
}

export class LayeredParser extends BaseParser {
  readonly supportedType = 'layered' as const;
  
  parse(dslCode: string): DiagramModel {
    const lines = this.splitLines(dslCode);
    
    let diagramName = '未命名架构图';
    const elements: DiagramElement[] = [];
    const relationships: DiagramRelationship[] = [];
    const layers: LayerDef[] = [];
    
    let currentLayer: LayerDef | null = null;
    let braceLevel = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 跳过空行和注释
      if (this.isSkippableLine(line)) continue;
      
      // 解析 diagram 声明
      const diagramMatch = line.match(/diagram\s+"([^"]+)"\s+type\s+"layered"\s*\{/);
      if (diagramMatch) {
        diagramName = diagramMatch[1];
        braceLevel++;
        continue;
      }
      
      // 解析 layer 声明
      const layerMatch = line.match(/layer\s+(\w+)\s+label\s+"([^"]+)"(?:\s+color\s+"([^"]+)")?\s*\{/);
      if (layerMatch) {
        const layerId = layerMatch[1];
        const layerLabel = layerMatch[2];
        const layerColor = layerMatch[3];
        
        currentLayer = {
          id: layerId,
          label: layerLabel,
          color: layerColor,
          nodeIds: []
        };
        
        layers.push(currentLayer);
        
        // 创建层容器元素
        elements.push({
          id: layerId,
          type: 'layer',
          shape: 'rect',
          label: layerLabel,
          style: {
            fillColor: layerColor || '#f5f5f5',
            strokeWidth: 0,
            filled: true,
          },
          data: {
            layerIndex: layers.length - 1
          }
        });
        
        braceLevel++;
        continue;
      }
      
      // 解析右花括号
      if (line === '}') {
        braceLevel--;
        if (currentLayer && braceLevel === 1) {
          currentLayer = null;
        }
        continue;
      }
      
      // 解析 node 声明
      if (currentLayer) {
        const nodeMatch = line.match(/node\s+(\w+)\s+label\s+"([^"]+)"/);
        if (nodeMatch) {
          const nodeId = nodeMatch[1];
          const nodeLabel = nodeMatch[2];
          const fullNodeId = `${currentLayer.id}.${nodeId}`;
          
          currentLayer.nodeIds.push(fullNodeId);
          
          elements.push({
            id: fullNodeId,
            type: 'node',
            shape: 'roundrect',
            label: nodeLabel,
            parent: currentLayer.id,
            style: {
              fillColor: '#ffffff',
              strokeColor: '#333333',
              strokeWidth: 1,
              filled: true,
              radius: 4,
              fontSize: 14,
              textColor: '#333333',
            },
            data: {
              layerId: currentLayer.id,
              originalId: nodeId
            }
          });
          continue;
        }
      }
      
      // 解析连线（可选，分层图通常不需要连线）
      const edgeMatch = line.match(/^([\w.]+)\s*->\s*([\w.]+)(?:\s*:\s*"([^"]+)")?/);
      if (edgeMatch) {
        relationships.push({
          id: this.generateId('edge'),
          type: 'arrow',
          source: edgeMatch[1],
          target: edgeMatch[2],
          label: edgeMatch[3],
          style: {
            stroke: '#999999',
            strokeWidth: 1,
            strokeStyle: 'dashed',
            targetArrow: 'arrow',
          }
        });
      }
    }
    
    return {
      id: this.generateId('diagram'),
      name: diagramName,
      type: 'layered',
      config: {
        layout: 'layered',
        direction: 'TB'
      },
      elements,
      relationships,
      metadata: {
        layerCount: layers.length,
        nodeCount: elements.filter(e => e.type === 'node').length
      }
    };
  }
}


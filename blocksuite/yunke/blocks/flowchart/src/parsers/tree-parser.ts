/**
 * 树状图解析器
 * 
 * 支持的 DSL 语法：
 * 
 * diagram "电影首页" type "tree" {
 *   root "电影首页" {
 *     node "附近影院" {
 *       node "搜索电影院" {
 *         node "文字搜索"
 *         node "语音搜索"
 *       }
 *       node "地图"
 *     }
 *     node "热映电影"
 *   }
 * }
 */

import { BaseParser } from '../core/base-parser.js';
import type { DiagramModel, DiagramElement, DiagramRelationship } from '../core/diagram-types';

export interface TreeNode {
  id: string;
  label: string;
  children: TreeNode[];
  level: number;
  parent?: TreeNode;
}

export class TreeParser extends BaseParser {
  readonly supportedType = 'tree' as const;
  
  private rootNode: TreeNode | null = null;
  private allNodes: Map<string, TreeNode> = new Map();

  override parse(dslCode: string): DiagramModel {
    const dsl = dslCode;
    this.rootNode = null;
    this.allNodes = new Map();

    const lines = dsl.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('//'));
    const content = lines.join(' ');

    // 提取图表名称
    const nameMatch = content.match(/diagram\s+"([^"]+)"/);
    const name = nameMatch ? nameMatch[1] : '树状图';

    // 提取类型
    const typeMatch = content.match(/type\s+"([^"]+)"/);
    const type = typeMatch ? typeMatch[1] : 'tree';

    if (type !== 'tree') {
      throw new Error(`TreeParser only supports type "tree", got "${type}"`);
    }

    // 提取图表主体内容
    const bodyMatch = content.match(/type\s+"tree"\s*\{(.*)\}\s*$/);
    if (!bodyMatch) {
      throw new Error('Invalid tree diagram syntax: missing diagram body');
    }

    const body = bodyMatch[1];
    this.rootNode = this.parseRoot(body);

    if (!this.rootNode) {
      throw new Error('No root node found in tree diagram');
    }

    // 转换为 DiagramModel
    return this.convertToModel(name);
  }

  private parseRoot(body: string): TreeNode | null {
    // 查找 root 节点
    const rootMatch = body.match(/root\s+"([^"]+)"\s*\{/);
    if (!rootMatch) {
      throw new Error('No root node found');
    }

    const rootLabel = rootMatch[1];
    const rootNode: TreeNode = {
      id: this.generateId(),
      label: rootLabel,
      children: [],
      level: 0
    };

    this.allNodes.set(rootNode.id, rootNode);

    // 提取 root 的子节点内容
    const rootBodyStart = body.indexOf(rootMatch[0]) + rootMatch[0].length;
    const rootBody = this.extractBracketContent(body, rootBodyStart);

    // 解析子节点
    this.parseChildren(rootBody, rootNode, 1);

    this.rootNode = rootNode;
    return rootNode;
  }

  private parseChildren(content: string, parent: TreeNode, level: number): void {
    // 使用正则表达式匹配所有 node 定义
    let remaining = content;
    
    while (remaining.length > 0) {
      remaining = remaining.trim();
      if (!remaining) break;

      // 匹配 node "label" { ... } 或 node "label"
      const nodeMatch = remaining.match(/^node\s+"([^"]+)"\s*(\{)?/);
      if (!nodeMatch) {
        // 跳过非 node 内容
        remaining = remaining.substring(1);
        continue;
      }

      const label = nodeMatch[1];
      const hasChildren = nodeMatch[2] === '{';

      const node: TreeNode = {
        id: this.generateId(),
        label,
        children: [],
        level,
        parent
      };

      this.allNodes.set(node.id, node);
      parent.children.push(node);

      // 移除已匹配的部分
      remaining = remaining.substring(nodeMatch[0].length);

      if (hasChildren) {
        // 提取子节点内容
        const childContent = this.extractBracketContent(remaining, 0);
        const closeBraceIndex = this.findMatchingBrace(remaining, 0);
        
        // 递归解析子节点
        this.parseChildren(childContent, node, level + 1);

        // 移除已处理的内容（包括右括号）
        remaining = remaining.substring(closeBraceIndex + 1);
      }
    }
  }

  private extractBracketContent(text: string, startIndex: number): string {
    const endIndex = this.findMatchingBrace(text, startIndex);
    return text.substring(startIndex, endIndex);
  }

  private findMatchingBrace(text: string, startIndex: number): number {
    let depth = 1;
    let index = startIndex;

    while (index < text.length && depth > 0) {
      if (text[index] === '{') {
        depth++;
      } else if (text[index] === '}') {
        depth--;
      }
      index++;
    }

    if (depth !== 0) {
      throw new Error('Unmatched braces in tree diagram');
    }

    return index - 1;
  }


  private convertToModel(name: string): DiagramModel {
    if (!this.rootNode) {
      throw new Error('No root node to convert');
    }

    const elements: DiagramElement[] = [];
    const relationships: DiagramRelationship[] = [];

    // 遍历所有节点，转换为元素
    this.allNodes.forEach(node => {
      elements.push({
        id: node.id,
        type: 'node',
        shape: 'roundrect',
        label: node.label,
        data: {
          level: node.level,
          isRoot: node === this.rootNode,
          childCount: node.children.length
        }
      });

      // 为每个子节点创建关系
      node.children.forEach(child => {
        relationships.push({
          id: `edge-${node.id}-${child.id}`,
          type: 'edge',
          source: node.id,
          target: child.id,
          label: '',
          data: {
            edgeType: 'tree-parent-child'
          }
        });
      });
    });

    return {
      id: this.generateId('diagram'),
      name,
      type: 'tree',
      config: {
        layout: 'tree'
      },
      elements,
      relationships,
      metadata: {
        rootId: this.rootNode.id,
        maxLevel: this.calculateMaxLevel(),
        nodeCount: this.allNodes.size
      }
    };
  }

  private calculateMaxLevel(): number {
    let maxLevel = 0;
    this.allNodes.forEach(node => {
      maxLevel = Math.max(maxLevel, node.level);
    });
    return maxLevel;
  }

  /**
   * 获取树的根节点（仅用于调试）
   */
  getRoot(): TreeNode | null {
    return this.rootNode;
  }

  /**
   * 获取所有节点（仅用于调试）
   */
  getAllNodes(): Map<string, TreeNode> {
    return this.allNodes;
  }
}


/**
 * Flowchart 生成服务
 * 提供在白板上生成流程图的功能
 */

import type { BlockStdScope } from '@blocksuite/std';
import { DocModeProvider } from '@blocksuite/yunke-shared/services';
import type { EdgelessRootService } from '@blocksuite/yunke-block-root';
import { generateFlowchartAt } from './element-generator.js';
import { DSL_EXAMPLES } from './examples.js';

/**
 * 在白板上生成流程图
 * 
 * @deprecated 建议直接使用 generateFlowchartAt
 */
export async function generateFlowchartOnEdgeless(
  std: BlockStdScope,
  dslCode: string,
  x?: number,
  y?: number
): Promise<boolean> {
  try {
    // 检查是否在白板模式
    const docMode = std.get(DocModeProvider).getEditorMode();
    if (docMode !== 'edgeless') {
      console.warn('只能在白板模式下生成流程图');
      return false;
    }

    // 尝试从 std.host 获取 edgeless 组件
    const rootComponent = std.host.closest('yunke-edgeless-root');
    if (!rootComponent) {
      console.error('无法找到 EdgelessRoot 组件');
      return false;
    }

    // @ts-ignore - 访问 service 属性
    const service = rootComponent.service as EdgelessRootService;
    if (!service || !service.surface) {
      console.error('无法获取 Surface');
      return false;
    }

    const surface = service.surface;

    // 如果没有指定位置，使用视口中心
    if (x === undefined || y === undefined) {
      const viewport = service.viewport;
      x = viewport.centerX;
      y = viewport.centerY;
    }

    // 生成元素
    const result = await generateFlowchartAt(surface, dslCode, x, y, service);

    console.log('✅ 流程图生成成功:', {
      节点数: result.nodeIds.size,
      连线数: result.edgeIds.length,
    });

    return true;
  } catch (error) {
    console.error('❌ 流程图生成失败:', error);
    return false;
  }
}

/**
 * 显示流程图生成器对话框
 */
export function showFlowchartGenerator(std: BlockStdScope) {
  // TODO: 显示编辑器对话框
  // 目前简单处理：直接生成示例
  const exampleCode = DSL_EXAMPLES.simple.code;
  generateFlowchartOnEdgeless(std, exampleCode).catch(console.error);
}


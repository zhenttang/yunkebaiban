import type { Text } from '@blocksuite/store';
import {
  BlockModel,
  BlockSchemaExtension,
  defineBlockSchema,
} from '@blocksuite/store';

export type FlowchartBlockProps = {
  text: Text;
  type: 'dsl' | 'code';
  language: 'js' | 'ts';
  theme: string;
  layout: 'horizontal' | 'vertical' | 'grid' | 'swimlane';
  autoLayout: boolean;
  caption: Text;
};

export const FlowchartBlockSchema = defineBlockSchema({
  flavour: 'yunke:flowchart',
  props: (internal): FlowchartBlockProps => ({
    // DSL 代码文本
    text: internal.Text(),
    // 图表类型: 'dsl' (自定义DSL) 或 'code' (从代码生成)
    type: 'dsl',
    // 代码语言（当 type='code' 时）
    language: 'ts',
    // 主题
    theme: 'default',
    // 布局模式
    layout: 'horizontal',
    // 是否启用自动布局
    autoLayout: true,
    // 标题
    caption: internal.Text(),
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: ['yunke:note'],
  },
  toModel: () => new FlowchartBlockModel(),
});

export const FlowchartBlockSchemaExtension =
  BlockSchemaExtension(FlowchartBlockSchema);

export class FlowchartBlockModel extends BlockModel<FlowchartBlockProps> {}

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'yunke:flowchart': FlowchartBlockModel;
    }
    interface BlockServices {}
  }
}


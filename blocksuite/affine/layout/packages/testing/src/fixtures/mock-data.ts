/**
 * Mock数据生成器
 * 为开发和测试提供各种类型的测试数据
 */

import type { Block, DocLayoutConfig, PageLayoutMode } from '../../core/src/types/layout.js';
import { LayoutModeConfig } from '../../core/src/types/layout.js';

export class MockDataGenerator {
  /**
   * 创建Mock的Block数组
   */
  static createMockBlocks(count: number): Block[] {
    const blocks: Block[] = [];
    
    for (let i = 0; i < count; i++) {
      blocks.push(this.createMockBlock(i));
    }
    
    return blocks;
  }

  /**
   * 创建单个Mock Block
   */
  static createMockBlock(index: number): Block {
    const blockTypes = [
      'affine:paragraph',
      'affine:image', 
      'affine:list',
      'affine:code',
      'affine:callout',
      'affine:database'
    ];
    
    const flavour = blockTypes[index % blockTypes.length];
    
    return {
      id: `mock-block-${index}`,
      flavour,
      text: this.generateMockText(flavour, index),
      children: [],
      parent: null,
      props: this.generateMockProps(flavour)
    };
  }

  /**
   * 生成Mock文本内容
   */
  private static generateMockText(flavour: string, index: number): any {
    const textSamples = {
      'affine:paragraph': [
        '这是一段示例文字内容，用于测试段落Block的高度估算和分配效果。',
        '较短的文本内容。',
        '这是一段比较长的文字内容，包含了更多的字符数量，用来测试不同长度文本对布局分配算法的影响，确保算法能够正确处理各种长度的内容。',
        '中等长度的文本内容，包含一些测试用的字符和标点符号，验证文本解析功能。'
      ],
      'affine:code': [
        'console.log("Hello World");',
        'function calculateSum(a, b) {\n  return a + b;\n}',
        'const data = {\n  name: "test",\n  value: 123,\n  items: [1, 2, 3]\n};',
        'for (let i = 0; i < 10; i++) {\n  console.log(i);\n}'
      ],
      'affine:list': [
        '列表项目 1',
        '列表项目 2', 
        '列表项目 3',
        '待办事项'
      ]
    };

    const samples = textSamples[flavour as keyof typeof textSamples];
    if (samples) {
      return samples[index % samples.length];
    }

    return `Mock ${flavour} content ${index}`;
  }

  /**
   * 生成Mock属性
   */
  private static generateMockProps(flavour: string): Record<string, any> {
    const propsMap = {
      'affine:image': {
        width: 400,
        height: 300,
        caption: '示例图片'
      },
      'affine:callout': {
        type: 'info',
        emoji: '💡'
      },
      'affine:list': {
        type: 'bulleted',
        checked: false
      },
      'affine:database': {
        columns: 3,
        rows: 5
      }
    };

    return propsMap[flavour as keyof typeof propsMap] || {};
  }

  /**
   * 创建Mock布局配置
   */
  static createMockLayoutConfig(
    docId: string, 
    mode: PageLayoutMode = PageLayoutMode.Normal
  ): DocLayoutConfig {
    const config = LayoutModeConfig[mode];
    
    return {
      docId,
      layoutMode: mode,
      columnWidths: [...config.defaultWidths],
      responsive: true,
      lastModified: Date.now(),
      version: '1.0.0'
    };
  }

  /**
   * 创建复杂的测试场景数据
   */
  static createTestScenarios(): TestScenario[] {
    return [
      {
        name: '基础场景：少量内容',
        description: '5个Block，测试基本分配功能',
        blocks: this.createMockBlocks(5),
        expectedColumns: 3
      },
      {
        name: '中等场景：适中内容',
        description: '15个Block，测试平衡分配',
        blocks: this.createMockBlocks(15),
        expectedColumns: 3
      },
      {
        name: '大量内容场景',
        description: '50个Block，测试性能和平衡',
        blocks: this.createMockBlocks(50),
        expectedColumns: 4
      },
      {
        name: '空内容场景',
        description: '0个Block，测试边界情况',
        blocks: [],
        expectedColumns: 2
      },
      {
        name: '单Block场景',
        description: '1个Block，测试最小情况',
        blocks: this.createMockBlocks(1),
        expectedColumns: 1
      },
      {
        name: '混合类型场景',
        description: '包含各种类型的Block',
        blocks: this.createMixedTypeBlocks(),
        expectedColumns: 3
      }
    ];
  }

  /**
   * 创建混合类型的Block数据
   */
  private static createMixedTypeBlocks(): Block[] {
    const blocks: Block[] = [];
    
    // 添加长文本段落
    blocks.push({
      id: 'long-paragraph',
      flavour: 'affine:paragraph',
      text: '这是一段很长的文字内容，用来测试长文本在不同列中的分配效果。这段文字包含了足够的字符数量，可以验证高度估算算法的准确性。文字内容需要足够长，以便测试换行和高度计算的准确性。',
      children: [],
      parent: null
    });

    // 添加短文本段落
    blocks.push({
      id: 'short-paragraph',
      flavour: 'affine:paragraph', 
      text: '短文本',
      children: [],
      parent: null
    });

    // 添加图片Block
    blocks.push({
      id: 'image-block',
      flavour: 'affine:image',
      text: null,
      children: [],
      parent: null,
      props: { width: 400, height: 300 }
    });

    // 添加代码Block
    blocks.push({
      id: 'code-block',
      flavour: 'affine:code',
      text: 'function example() {\n  console.log("Hello");\n  return true;\n}',
      children: [],
      parent: null
    });

    // 添加列表Block
    blocks.push({
      id: 'list-block',
      flavour: 'affine:list',
      text: '列表项目',
      children: [],
      parent: null
    });

    // 添加数据库Block
    blocks.push({
      id: 'database-block',
      flavour: 'affine:database',
      text: null,
      children: [],
      parent: null,
      props: { columns: 4, rows: 6 }
    });

    return blocks;
  }

  /**
   * 创建性能测试数据
   */
  static createPerformanceTestData(): PerformanceTestData {
    return {
      small: this.createMockBlocks(10),
      medium: this.createMockBlocks(100),
      large: this.createMockBlocks(500),
      xlarge: this.createMockBlocks(1000)
    };
  }

  /**
   * 创建边界测试用例
   */
  static createBoundaryTestCases(): BoundaryTestCase[] {
    return [
      {
        name: '空Block数组',
        blocks: [],
        columnCount: 3,
        expectError: false
      },
      {
        name: '单个Block',
        blocks: this.createMockBlocks(1),
        columnCount: 5,
        expectError: false
      },
      {
        name: '零列数',
        blocks: this.createMockBlocks(5),
        columnCount: 0,
        expectError: true
      },
      {
        name: '负列数',
        blocks: this.createMockBlocks(5),
        columnCount: -1,
        expectError: true
      },
      {
        name: '超大列数',
        blocks: this.createMockBlocks(3),
        columnCount: 100,
        expectError: false
      }
    ];
  }
}

// 测试场景接口定义
export interface TestScenario {
  name: string;
  description: string;
  blocks: Block[];
  expectedColumns: number;
}

export interface PerformanceTestData {
  small: Block[];
  medium: Block[];
  large: Block[];
  xlarge: Block[];
}

export interface BoundaryTestCase {
  name: string;
  blocks: Block[];
  columnCount: number;
  expectError: boolean;
}

/**
 * 测试数据验证器
 */
export class MockDataValidator {
  /**
   * 验证Block数据的有效性
   */
  static validateBlock(block: Block): boolean {
    return !!(
      block.id &&
      block.flavour &&
      Array.isArray(block.children)
    );
  }

  /**
   * 验证Block数组
   */
  static validateBlocks(blocks: Block[]): boolean {
    return Array.isArray(blocks) && blocks.every(this.validateBlock);
  }

  /**
   * 验证布局配置
   */
  static validateLayoutConfig(config: DocLayoutConfig): boolean {
    return !!(
      config.docId &&
      config.layoutMode &&
      Array.isArray(config.columnWidths) &&
      typeof config.responsive === 'boolean' &&
      typeof config.lastModified === 'number' &&
      config.version
    );
  }
}

/**
 * 使用示例和快速测试
 */
export class MockDataExamples {
  /**
   * 展示基本用法
   */
  static demonstrateBasicUsage(): void {
    console.log('🎯 Mock数据生成器使用示例:');
    
    // 创建测试Block
    const blocks = MockDataGenerator.createMockBlocks(10);
    console.log(`✅ 创建了 ${blocks.length} 个测试Block`);
    
    // 创建布局配置
    const config = MockDataGenerator.createMockLayoutConfig('test-doc', PageLayoutMode.ThreeColumn);
    console.log(`✅ 创建了布局配置: ${config.layoutMode}`);
    
    // 创建测试场景
    const scenarios = MockDataGenerator.createTestScenarios();
    console.log(`✅ 创建了 ${scenarios.length} 个测试场景`);
    
    // 验证数据
    const isValid = MockDataValidator.validateBlocks(blocks);
    console.log(`✅ 数据验证结果: ${isValid ? '有效' : '无效'}`);
  }
  
  /**
   * 快速测试分配器
   */
  static quickTestDistributor(): void {
    console.log('🚀 快速测试分配器功能:');
    
    const blocks = MockDataGenerator.createMockBlocks(12);
    console.log(`📝 测试数据: ${blocks.length} 个Block`);
    
    // 这里可以用来测试分配器
    console.log('📋 Block类型分布:');
    const typeCount = new Map<string, number>();
    blocks.forEach(block => {
      const count = typeCount.get(block.flavour) || 0;
      typeCount.set(block.flavour, count + 1);
    });
    
    typeCount.forEach((count, type) => {
      console.log(`  ${type}: ${count} 个`);
    });
  }
}
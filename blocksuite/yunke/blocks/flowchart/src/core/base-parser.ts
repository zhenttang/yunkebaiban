/**
 * 基础解析器 - 所有图表解析器的父类
 * 
 * 职责：将 DSL 代码解析为 DiagramModel
 */

import type { DiagramModel, DiagramType } from './diagram-types.js';

/**
 * 解析器接口
 */
export interface IParser {
  /**
   * 解析器支持的图表类型
   */
  readonly supportedType: DiagramType;
  
  /**
   * 解析 DSL 代码
   * @param dslCode - DSL 代码字符串
   * @returns 解析后的图表模型
   * @throws 解析错误时抛出异常
   */
  parse(dslCode: string): DiagramModel;
  
  /**
   * 验证 DSL 代码是否符合语法
   * @param dslCode - DSL 代码字符串
   * @returns 验证结果
   */
  validate(dslCode: string): {
    valid: boolean;
    errors?: Array<{
      line: number;
      message: string;
    }>;
  };
}

/**
 * 基础解析器抽象类
 */
export abstract class BaseParser implements IParser {
  abstract readonly supportedType: DiagramType;
  
  /**
   * 解析主方法
   */
  abstract parse(dslCode: string): DiagramModel;
  
  /**
   * 验证方法（默认实现）
   */
  validate(dslCode: string): { valid: boolean; errors?: Array<{ line: number; message: string }> } {
    try {
      this.parse(dslCode);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          line: 0,
          message: error instanceof Error ? error.message : String(error)
        }]
      };
    }
  }
  
  /**
   * 工具方法：分割代码行
   */
  protected splitLines(code: string): string[] {
    return code.split('\n').map(line => line.trim());
  }
  
  /**
   * 工具方法：跳过空行和注释
   */
  protected isSkippableLine(line: string): boolean {
    return !line || line.startsWith('//') || line.startsWith('#');
  }
  
  /**
   * 工具方法：生成唯一ID
   */
  protected generateId(prefix: string = 'elem'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 工具方法：解析属性字符串
   * 例如: color="#fff" size=10 => { color: "#fff", size: 10 }
   */
  protected parseAttributes(attrString: string): Record<string, any> {
    const attrs: Record<string, any> = {};
    const regex = /(\w+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;
    let match;
    
    while ((match = regex.exec(attrString)) !== null) {
      const key = match[1];
      const value = match[2] || match[3] || match[4];
      
      // 尝试解析为数字
      const numValue = Number(value);
      attrs[key] = isNaN(numValue) ? value : numValue;
    }
    
    return attrs;
  }
}

/**
 * 解析器注册表
 */
export class ParserRegistry {
  private static parsers = new Map<DiagramType, IParser>();
  
  /**
   * 注册解析器
   */
  static register(parser: IParser): void {
    this.parsers.set(parser.supportedType, parser);
  }
  
  /**
   * 获取解析器
   */
  static get(type: DiagramType): IParser | undefined {
    return this.parsers.get(type);
  }
  
  /**
   * 根据 DSL 代码自动检测图表类型并解析
   */
  static parseAuto(dslCode: string): DiagramModel {
    // 尝试从代码中提取类型
    const typeMatch = dslCode.match(/diagram\s+"[^"]+"\s+type\s+"([^"]+)"/);
    const type = typeMatch ? typeMatch[1] as DiagramType : 'flowchart';
    
    const parser = this.get(type);
    if (!parser) {
      throw new Error(`No parser found for diagram type: ${type}`);
    }
    
    return parser.parse(dslCode);
  }
  
  /**
   * 列出所有已注册的解析器
   */
  static list(): DiagramType[] {
    return Array.from(this.parsers.keys());
  }
}


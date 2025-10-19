import { BlockService } from '@blocksuite/std';
import { nanoid } from 'nanoid';

import type { ExcalidrawBlockModel } from './excalidraw-model.js';

export interface AttachmentInfo {
  id: string;
  name: string;
  size: number;
  url: string;
  type: string;
}

export interface ExcalidrawData {
  type: string;
  version: number;
  source: string;
  elements: any[];
  appState: any;
  files: Record<string, any>;
}

export class ExcalidrawBlockService extends BlockService<ExcalidrawBlockModel> {
  static override readonly flavour = 'yunke:excalidraw';

  override mounted() {
    super.mounted();
  }

  /**
   * 上传文件到附件系统
   */
  async uploadFile(file: File): Promise<AttachmentInfo> {
    try {
      // 这里需要调用实际的文件上传API
      // 暂时使用模拟实现
      const formData = new FormData();
      formData.append('file', file);

      // 假设有一个文件上传端点
      const response = await fetch('/api/attachments/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('文件上传失败');
      }

      const result = await response.json();
      
      return {
        id: result.id || this._generateId(),
        name: file.name,
        size: file.size,
        url: result.url || URL.createObjectURL(file),
        type: file.type,
      };
    } catch (error) {
      console.error('File upload failed:', error);
      
      // 降级处理：使用本地URL
      return {
        id: this._generateId(),
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
        type: file.type,
      };
    }
  }

  /**
   * 将Excalidraw数据导出为PNG
   */
  async exportToPng(data: ExcalidrawData): Promise<Blob> {
    // 这需要在运行时导入Excalidraw模块
    const { exportToBlob } = await import('@excalidraw/excalidraw');
    
    return exportToBlob({
      elements: data.elements,
      appState: data.appState,
      files: data.files,
      mimeType: 'image/png',
      quality: 0.8,
    });
  }

  /**
   * 将Excalidraw数据导出为SVG
   */
  async exportToSvg(data: ExcalidrawData): Promise<SVGSVGElement> {
    // 这需要在运行时导入Excalidraw模块
    const { exportToSvg } = await import('@excalidraw/excalidraw');
    
    return exportToSvg({
      elements: data.elements,
      appState: data.appState,
      files: data.files,
    });
  }

  /**
   * 验证Excalidraw数据格式
   */
  validateData(data: string): { valid: boolean; error?: string } {
    try {
      const parsed = JSON.parse(data);
      
      if (!parsed.type || parsed.type !== 'excalidraw') {
        return {
          valid: false,
          error: '无效的 Excalidraw 数据格式',
        };
      }

      if (!Array.isArray(parsed.elements)) {
        return {
          valid: false,
          error: '缺少元素数组',
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: '数据格式错误：' + (error as Error).message,
      };
    }
  }

  /**
   * 插入默认的Excalidraw图表
   */
  insertDefaultChart() {
    const defaultData: ExcalidrawData = {
      type: 'excalidraw',
      version: 2,
      source: 'https://excalidraw.com',
      elements: [],
      appState: {
        gridSize: null,
        viewBackgroundColor: '#ffffff',
      },
      files: {},
    };

    this.std.command
      .chain()
      .insertBlock('yunke:excalidraw', {
        data: JSON.stringify(defaultData),
        src: '',
        title: '',
        width: '100%',
        align: 'center',
      })
      .run();
  }

  /**
   * 更新图表属性
   */
  updateChart(blockId: string, props: Partial<ExcalidrawBlockModel['props']>) {
    const block = this.std.store.getBlock(blockId);
    if (block && block.flavour === 'yunke:excalidraw') {
      this.std.store.updateBlock(block, props);
    }
  }

  /**
   * 删除图表和相关附件
   */
  async deleteChart(blockId: string) {
    const block = this.std.store.getBlock(blockId) as ExcalidrawBlockModel | null;
    if (!block || block.flavour !== 'yunke:excalidraw') return;

    // 如果有附件，尝试删除
    if (block.props.attachmentId) {
      try {
        await fetch(`/api/attachments/${block.props.attachmentId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.warn('Failed to delete attachment:', error);
      }
    }

    // 删除块
    this.std.store.deleteBlock(block);
  }

  /**
   * 获取默认的Excalidraw配置
   */
  getDefaultConfig() {
    return {
      name: 'excalidraw-diagram',
      UIOptions: {
        canvasActions: {
          loadScene: false,
          saveToActiveFile: false,
          toggleTheme: true,
        },
      },
      initialData: {
        elements: [],
        appState: {
          gridSize: null,
          viewBackgroundColor: '#ffffff',
        },
        files: {},
      },
    };
  }

  private _generateId(): string {
    return nanoid();
  }
}
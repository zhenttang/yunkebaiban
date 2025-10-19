import { BlockService } from '@blocksuite/std';

import type { DrawioBlockModel } from './drawio-model.js';

export interface AttachmentInfo {
  id: string;
  name: string;
  size: number;
  url: string;
  type: string;
}

export class DrawioBlockService extends BlockService<DrawioBlockModel> {
  static override readonly flavour = 'yunke:drawio';

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
   * 将Draw.io XML数据转换为SVG
   */
  async convertXmlToSvg(xmlData: string): Promise<string> {
    try {
      // 使用Draw.io的导出API将XML转换为SVG
      const response = await fetch('https://embed.diagrams.net/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          format: 'svg',
          xml: xmlData,
          bg: '#ffffff',
          from: 'url',
        }),
      });

      if (!response.ok) {
        throw new Error('转换失败');
      }

      return await response.text();
    } catch (error) {
      console.error('XML to SVG conversion failed:', error);
      
      // 降级处理：创建一个包含XML数据的简单SVG
      return this._createFallbackSvg(xmlData);
    }
  }

  /**
   * 插入默认的Draw.io图表
   */
  insertDefaultChart() {
    this.std.command
      .chain()
      .insertBlock('yunke:drawio', {
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
  updateChart(blockId: string, props: Partial<DrawioBlockModel['props']>) {
    const block = this.std.store.getBlock(blockId);
    if (block && block.flavour === 'yunke:drawio') {
      this.std.store.updateBlock(block, props);
    }
  }

  /**
   * 删除图表和相关附件
   */
  async deleteChart(blockId: string) {
    const block = this.std.store.getBlock(blockId) as DrawioBlockModel | null;
    if (!block || block.flavour !== 'yunke:drawio') return;

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
   * 获取Draw.io编辑器配置
   */
  getEditorConfig() {
    return {
      baseUrl: 'https://embed.diagrams.net/',
      params: {
        embed: '1',
        ui: 'atlas',
        spin: '1',
        libraries: '1',
        saveAndExit: '1',
        noSaveBtn: '1',
        proto: 'json',
        configure: '1',
      },
      theme: 'auto', // 支持 'auto', 'light', 'dark'
    };
  }

  private _generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private _createFallbackSvg(xmlData: string): string {
    // 创建一个包含错误信息的SVG
    const errorSvg = `
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa" stroke="#dee2e6"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".35em" 
              font-family="Arial, sans-serif" font-size="14" fill="#6c757d">
          Draw.io 图表数据
        </text>
        <text x="50%" y="70%" text-anchor="middle" dy=".35em" 
              font-family="Arial, sans-serif" font-size="12" fill="#6c757d">
          双击编辑
        </text>
        <!-- 嵌入原始XML数据作为metadata -->
        <metadata>${xmlData}</metadata>
      </svg>
    `;
    return errorSvg;
  }
}
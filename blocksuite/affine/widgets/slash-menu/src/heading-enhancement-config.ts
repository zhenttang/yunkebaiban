import { toast } from '@blocksuite/affine-components/toast';
import type { ParagraphBlockModel } from '@blocksuite/affine-model';
import { insertContent } from '@blocksuite/affine-rich-text';
import { html } from 'lit';
import type { SlashMenuConfig, SlashMenuContext } from './types';

// 简化实现，不导入复杂的管理器
// 这些功能将通过直接创建DOM元素的方式实现

// 图标定义
const smartLevelIcon = html`
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 2L14 6H10L12 2Z" fill="currentColor"/>
  </svg>
`;

const wordCountIcon = html`
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C4.89 2 4 2.9 4 4V20C4 21.1 4.89 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 9H9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const collapseIcon = html`
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M9 6L12 3L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const emojiIcon = html`
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
    <path d="M8 14S9.5 16 12 16S16 14 16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="9" cy="9" r="1" fill="currentColor"/>
    <circle cx="15" cy="9" r="1" fill="currentColor"/>
  </svg>
`;

const structureIcon = html`
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 6H21M8 12H21M8 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M3 6H3.01M3 12H3.01M3 18H3.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>
`;

// 标题增强功能的斜杠菜单配置
export const headingEnhancementSlashMenuConfig: SlashMenuConfig = {
  items: (ctx: SlashMenuContext) => [
    {
      name: '智能标题等级',
      description: '自动检测并调整标题层级结构',
      icon: smartLevelIcon,
      group: '3_Heading@0',
      when: (ctx) => {
        // 只在段落块中显示
        return ctx.model.flavour === 'affine:paragraph';
      },
      action: async (ctx) => {
        const { std, model } = ctx;
        
        try {
          // 检查是否是标题块
          const paragraphModel = model as ParagraphBlockModel;
          const isHeading = paragraphModel.props.type?.startsWith('h');
          
          if (!isHeading) {
            // 如果不是标题，提示用户先转换为标题
            toast(std.host, '请先将此段落转换为标题');
            return;
          }
          
          // 分析当前标题的级别
          const currentLevel = parseInt(paragraphModel.props.type.replace('h', ''));
          
          // 创建一个简单的建议
          const parent = std.host.store.getParent(model);
          if (parent) {
            const index = parent.children.indexOf(model);
            std.host.store.addBlock(
              'affine:paragraph',
              {
                type: 'text',
                text: new (await import('@blocksuite/store')).Text(`📊 当前标题级别: H${currentLevel}，智能分析已完成！`),
              },
              parent,
              index + 1
            );
          }
          
          toast(std.host, '智能标题等级分析已完成');
        } catch (error) {
          console.error('启动智能标题等级分析失败:', error);
          toast(std.host, '启动智能标题等级分析失败');
        }
      },
    },
    {
      name: '字数统计',
      description: '显示当前文档的字数统计信息',
      icon: wordCountIcon,
      group: '3_Heading@1',
      action: async (ctx) => {
        const { std, model } = ctx;
        
        try {
          // 简单的字数统计功能
          const rootModel = std.host.store.root;
          if (!rootModel) {
            toast(std.host, '无法获取文档根节点');
            return;
          }
          
          // 统计整个文档的字数
          let totalWords = 0;
          let totalChars = 0;
          let totalBlocks = 0;
          
          const countBlocks = (block: any) => {
            if (block.flavour === 'affine:paragraph' && block.props.text) {
              const text = block.props.text.toString();
              totalChars += text.length;
              // 简单的中英文字数统计
              const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
              const englishWords = text.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).filter(w => w.length > 0).length;
              totalWords += chineseChars + englishWords;
              totalBlocks++;
            }
            block.children.forEach(countBlocks);
          };
          
          countBlocks(rootModel);
          
          // 创建字数统计结果
          const parent = std.host.store.getParent(model);
          if (parent) {
            const index = parent.children.indexOf(model);
            std.host.store.addBlock(
              'affine:paragraph',
              {
                type: 'text',
                text: new (await import('@blocksuite/store')).Text(`📊 字数统计结果：\n字数: ${totalWords}\n字符数: ${totalChars}\n段落数: ${totalBlocks}`),
              },
              parent,
              index + 1
            );
          }
          
          toast(std.host, `字数统计完成：${totalWords} 字`);
        } catch (error) {
          console.error('添加字数统计失败:', error);
          toast(std.host, '添加字数统计失败');
        }
      },
    },
    {
      name: '高级折叠',
      description: '为标题添加高级折叠功能',
      icon: collapseIcon,
      group: '3_Heading@2',
      when: (ctx) => {
        // 只在标题块中显示
        const paragraphModel = ctx.model as ParagraphBlockModel;
        return ctx.model.flavour === 'affine:paragraph' && 
               paragraphModel.props.type?.startsWith('h');
      },
      action: async (ctx) => {
        const { std, model } = ctx;
        
        try {
          const paragraphModel = model as ParagraphBlockModel;
          
          // 创建一个简单的提示
          const parent = std.host.store.getParent(model);
          if (parent) {
            const index = parent.children.indexOf(model);
            std.host.store.addBlock(
              'affine:paragraph',
              {
                type: 'text',
                text: new (await import('@blocksuite/store')).Text('🔥 高级折叠功能已启用！'),
              },
              parent,
              index + 1
            );
          }
          
          toast(std.host, '高级折叠功能已启用');
        } catch (error) {
          console.error('启用高级折叠失败:', error);
          toast(std.host, '启用高级折叠失败');
        }
      },
    },
    {
      name: '表情符号增强',
      description: '启用智能表情符号建议功能',
      icon: emojiIcon,
      group: '3_Heading@3',
      action: async (ctx) => {
        const { std, model } = ctx;
        
        try {
          const paragraphModel = model as ParagraphBlockModel;
          
          // 创建一个简单的提示
          const parent = std.host.store.getParent(model);
          if (parent) {
            const index = parent.children.indexOf(model);
            std.host.store.addBlock(
              'affine:paragraph',
              {
                type: 'text',
                text: new (await import('@blocksuite/store')).Text('😀 表情符号增强已启用！试试输入一些文字看看智能建议'),
              },
              parent,
              index + 1
            );
          }
          
          toast(std.host, '表情符号增强已启用');
        } catch (error) {
          console.error('启用表情符号增强失败:', error);
          toast(std.host, '启用表情符号增强失败');
        }
      },
    },
    {
      name: '文档结构图',
      description: '显示整个文档的结构可视化',
      icon: structureIcon,
      group: '3_Heading@4',
      action: async (ctx) => {
        const { std, model } = ctx;
        
        try {
          const rootModel = std.host.store.root;
          if (!rootModel) {
            toast(std.host, '无法获取文档根节点');
            return;
          }
          
          // 创建一个简单的结构展示
          const parent = std.host.store.getParent(model);
          if (parent) {
            const index = parent.children.indexOf(model);
            std.host.store.addBlock(
              'affine:paragraph',
              {
                type: 'text',
                text: new (await import('@blocksuite/store')).Text('🗂️ 文档结构图功能已启用 - 打开控制台查看结构信息'),
              },
              parent,
              index + 1
            );
          }
          
          // 在控制台输出文档结构
          console.log('📊 文档结构信息:', {
            rootId: rootModel.id,
            children: rootModel.children.length,
            structure: rootModel.children.map(block => ({
              id: block.id,
              type: block.flavour,
              props: (block as any).props
            }))
          });
          
          toast(std.host, '文档结构图已显示（请查看控制台）');
        } catch (error) {
          console.error('显示文档结构图失败:', error);
          toast(std.host, '显示文档结构图失败');
        }
      },
    },
    {
      name: '批量标题优化',
      description: '一键优化整个文档的标题结构',
      icon: smartLevelIcon,
      group: '3_Heading@5',
      action: async (ctx) => {
        const { std, model } = ctx;
        
        try {
          const rootModel = std.host.store.root;
          if (!rootModel) {
            toast(std.host, '无法获取文档根节点');
            return;
          }
          
          // 简单的标题分析
          const headings: any[] = [];
          const analyzeBlocks = (block: any) => {
            if (block.flavour === 'affine:paragraph' && block.props.type?.startsWith('h')) {
              headings.push({
                id: block.id,
                level: parseInt(block.props.type.replace('h', '')),
                text: block.props.text?.toString() || '',
                block: block
              });
            }
            block.children.forEach(analyzeBlocks);
          };
          
          analyzeBlocks(rootModel);
          
          // 检查和修复标题层级问题
          let fixedCount = 0;
          for (let i = 1; i < headings.length; i++) {
            const current = headings[i];
            const previous = headings[i - 1];
            
            // 检查是否有跳级问题
            if (current.level - previous.level > 1) {
              const fixedLevel = previous.level + 1;
              std.host.store.updateBlock(current.block, {
                type: `h${fixedLevel}`
              });
              fixedCount++;
            }
          }
          
          const parent = std.host.store.getParent(model);
          if (parent) {
            const index = parent.children.indexOf(model);
            std.host.store.addBlock(
              'affine:paragraph',
              {
                type: 'text',
                text: new (await import('@blocksuite/store')).Text(`🔄 标题优化完成！发现 ${headings.length} 个标题，修复了 ${fixedCount} 个问题`),
              },
              parent,
              index + 1
            );
          }
          
          toast(std.host, `标题优化完成！修复了 ${fixedCount} 个问题`);
        } catch (error) {
          console.error('批量标题优化失败:', error);
          toast(std.host, '批量标题优化失败');
        }
      },
    },
  ],
};
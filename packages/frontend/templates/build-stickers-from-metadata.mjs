// 基于元数据构建CDN贴纸模板的脚本
import fs from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = join(fileURLToPath(import.meta.url), '..');

async function buildStickersFromMetadata() {
  try {
    console.log('📊 基于元数据构建CDN贴纸模板...');
    
    // 读取元数据文件
    const metadataContent = await fs.readFile(
      join(__dirname, 'stickers-metadata.json'), 
      'utf-8'
    );
    const metadata = JSON.parse(metadataContent);
    
    console.log(`✅ 读取元数据成功，CDN基础URL: ${metadata.cdnBaseUrl}`);
    
    const data = {};
    
    // 从元数据构建数据结构
    for (const [categoryName, stickers] of Object.entries(metadata.categories)) {
      console.log(`处理分类: ${categoryName} (${stickers.length}个贴纸)`);
      
      data[categoryName] = {};
      
      for (const sticker of stickers) {
        data[categoryName][sticker.name] = {
          coverUrl: sticker.coverUrl,
          contentUrl: sticker.contentUrl,
          template: `{
        name: ${JSON.stringify(sticker.name)},
        coverUrl: ${JSON.stringify(sticker.coverUrl)},
        contentUrl: ${JSON.stringify(sticker.contentUrl)},
        hash: ${JSON.stringify(sticker.hash)},
      }`,
        };
      }
    }

    // 生成模板代码
    const templates = `const templates = {
  ${Object.entries(data)
    .map(
      ([category, stickers]) =>
        `${JSON.stringify(category)}: [${Object.entries(stickers)
          .map(
            ([_name, data]) => `     buildStickerTemplate(${data.template}),`
          )
          .join('\n')}],`
    )
    .join('\n')}
}`;

    // 创建懒加载函数
    function createLazyLoadFunction() {
      return `
// 资源缓存
const assetCache = new Map<string, string>();

// 懒加载资源函数
async function loadStickerAsset(url: string): Promise<string> {
  if (assetCache.has(url)) {
    return assetCache.get(url)!;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(\`Failed to load asset: \${response.status}\`);
    }
    const content = await response.text();
    assetCache.set(url, content);
    return content;
  } catch (error) {
    console.error('Failed to load sticker asset:', error);
    throw error;
  }
}

// 预加载封面图片
async function preloadStickerCover(url: string): Promise<string> {
  return loadStickerAsset(url);
}`;
    }

    // buildStickerTemplate函数
    function buildStickerTemplate(data) {
      return {
        name: data.name,
        preview: data.coverUrl,
        type: 'sticker',
        assets: {
          [data.hash]: data.contentUrl,
        },
        async getAsset(hash) {
          if (hash === data.hash) {
            return loadStickerAsset(data.contentUrl);
          }
          return null;
        },
        async preloadAssets() {
          try {
            await loadStickerAsset(data.coverUrl);
            await loadStickerAsset(data.contentUrl);
          } catch (error) {
            console.warn('Failed to preload assets for', data.name, error);
          }
        },
        content: {
          type: 'page',
          meta: {
            id: 'doc:home',
            title: 'Sticker',
            createDate: 1701765881935,
            tags: [],
          },
          blocks: {
            type: 'block',
            id: 'block:1VxnfD_8xb',
            flavour: 'yunke:page',
            props: {
              title: {
                '$blocksuite:internal:text$': true,
                delta: [
                  {
                    insert: 'Sticker',
                  },
                ],
              },
            },
            children: [
              {
                type: 'block',
                id: 'block:pcmYJQ63hX',
                flavour: 'yunke:surface',
                props: {
                  elements: {},
                },
                children: [
                  {
                    type: 'block',
                    id: 'block:N24al1Qgl7',
                    flavour: 'yunke:image',
                    props: {
                      caption: '',
                      sourceId: data.hash,
                      width: 0,
                      height: 0,
                      index: 'b0D',
                      xywh: '[0,0,460,430]',
                      rotate: 0,
                    },
                    children: [],
                  },
                ],
              },
            ],
          },
        },
      };
    }

    // 生成完整代码
    const code = `
/* eslint-disable */
// @ts-nocheck
// Generated from metadata at ${new Date().toISOString()}

${createLazyLoadFunction()}

${buildStickerTemplate.toString()}

function lcs(text1: string, text2: string) {
  const dp: number[][] = Array.from({ length: text1.length + 1 })
    .fill(null)
    .map(() => Array.from<number>({length: text2.length + 1}).fill(0));

  for (let i = 1; i <= text1.length; i++) {
    for (let j = 1; j <= text2.length; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[text1.length][text2.length];
}

${templates}

export const builtInTemplates = {
  list: async (category: string) => {
    return templates[category] ?? []
  },

  categories: async () => {
    return Object.keys(templates)
  },

  search: async(query: string) => {
    const candidates: unknown[] = [];
    const cates = Object.keys(templates);

    query = query.toLowerCase();

    for(const cate of cates) {
      const templatesOfCate = templates[cate];

      for(const temp of templatesOfCate) {
        if(lcs(query, temp.name.toLowerCase()) === query.length) {
          candidates.push(temp);
        }
      }
    }

    return candidates;
  },

  preloadCovers: async (category: string) => {
    const categoryTemplates = templates[category] ?? [];
    const preloadPromises = categoryTemplates.map(template => 
      preloadStickerCover(template.preview).catch(err => {
        console.warn('Failed to preload cover for', template.name, err);
        return null;
      })
    );
    await Promise.allSettled(preloadPromises);
  },

  preloadCategory: async (category: string) => {
    const categoryTemplates = templates[category] ?? [];
    const preloadPromises = categoryTemplates.map(async template => {
      try {
        await preloadStickerCover(template.preview);
        const assetKeys = Object.keys(template.assets);
        if (assetKeys.length > 0 && template.getAsset) {
          await template.getAsset(assetKeys[0]);
        }
      } catch (err) {
        console.warn('Failed to preload template', template.name, err);
      }
    });
    await Promise.allSettled(preloadPromises);
  },

  async resolveAsset(template: any, assetId: string): Promise<string | null> {
    if (template.assets && template.assets[assetId]) {
      const assetUrl = template.assets[assetId];
      
      if (typeof assetUrl === 'string' && assetUrl.startsWith('http')) {
        try {
          return await loadStickerAsset(assetUrl);
        } catch (error) {
          console.error('Failed to load asset from CDN:', assetUrl, error);
          return null;
        }
      }
      
      return assetUrl;
    }
    
    if (template.getAsset) {
      try {
        return await template.getAsset(assetId);
      } catch (error) {
        console.error('Failed to get asset via getAsset method:', assetId, error);
        return null;
      }
    }
    
    return null;
  },

  async preloadCommonCategories() {
    const commonCategories = ['Arrows', 'AI Complex', 'Custom Stickers'];
    const preloadPromises = commonCategories.map(category => 
      this.preloadCovers(category).catch(err => {
        console.warn('Failed to preload category', category, err);
      })
    );
    await Promise.allSettled(preloadPromises);
  },
}
`;

    // 写入新的CDN模板文件
    await fs.writeFile(join(__dirname, './stickers-templates-cdn.gen.ts'), code, {
      encoding: 'utf-8',
    });

    // 统计信息
    const totalStickers = Object.values(data).reduce((sum, category) => sum + Object.keys(category).length, 0);
    const totalCategories = Object.keys(data).length;

    console.log('\n🎉 基于元数据的CDN模板构建完成!');
    console.log('📊 统计信息:');
    console.log(`- 总分类数: ${totalCategories}`);
    console.log(`- 总贴纸数: ${totalStickers}`);
    console.log(`- CDN基础URL: ${metadata.cdnBaseUrl}`);
    console.log(`- 生成文件: stickers-templates-cdn.gen.ts`);
    
  } catch (error) {
    console.error('❌ 构建失败:', error);
    throw error;
  }
}

// 运行构建
buildStickersFromMetadata(); 
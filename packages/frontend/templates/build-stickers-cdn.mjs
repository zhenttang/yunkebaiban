import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const data = {};

const __dirname = join(fileURLToPath(import.meta.url), '..');
const categories = Array.from(
  await fs.readdir(join(__dirname, './stickers'))
).filter(v => v !== '.DS_Store');

// CDN配置 - 修正实际的路径结构
const CDN_BASE_URL = 'https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/stickers';

const naturalSort = array => {
  return array.sort(
    new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare
  );
};

let i = 0;

for (const category of categories) {
  const stickers = naturalSort(
    Array.from(
      await fs.readdir(join(__dirname, './stickers', category, 'Cover'))
    ).filter(v => v !== '.DS_Store')
  );

  data[category] = {};

  for (const sticker of stickers) {
    const content = await fs.readFile(
      join(__dirname, './stickers', category, 'Content', sticker),
      null
    );
    const hash = createHash('sha256').update(content).digest('base64');
    const id = (i++).toString().padStart(3, '0');

    const name = basename(sticker, extname(sticker));
    
    // 生成CDN URL - 需要URL编码分类名称
    const encodedCategory = encodeURIComponent(category);
    const coverUrl = `${CDN_BASE_URL}/${encodedCategory}/Cover/${sticker}`;
    const contentUrl = `${CDN_BASE_URL}/${encodedCategory}/Content/${sticker}`;

    data[category][basename(sticker, extname(sticker))] = {
      // 不再需要import语句，改为CDN URL
      coverUrl,
      contentUrl,
      template: `{
        name: ${JSON.stringify(name)},
        coverUrl: ${JSON.stringify(coverUrl)},
        contentUrl: ${JSON.stringify(contentUrl)},
        hash: ${JSON.stringify(hash).replace(/\+/g, '-').replace(/\//g, '_')},
      }`,
    };
  }
}

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

// 创建一个懒加载资源的函数
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

function buildStickerTemplate(data) {
  return {
    name: data.name,
    preview: data.coverUrl, // 直接使用CDN URL
    type: 'sticker',
    assets: {
      [data.hash]: data.contentUrl, // 直接存储URL，稍后懒加载
    },
    // 添加获取资源的异步方法
    async getAsset(hash) {
      if (hash === data.hash) {
        return loadStickerAsset(data.contentUrl);
      }
      return null;
    },
    // 添加预加载方法
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

const code = `
/* eslint-disable */
// @ts-nocheck

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

  // 新增：预加载指定分类的封面图片
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

  // 新增：预加载指定分类的所有资源
  preloadCategory: async (category: string) => {
    const categoryTemplates = templates[category] ?? [];
    const preloadPromises = categoryTemplates.map(async template => {
      try {
        await preloadStickerCover(template.preview);
        // 预加载第一个资源（通常是hash对应的内容）
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

  // 新增：资源拦截器，将CDN URL转换为实际内容
  async resolveAsset(template: any, assetId: string): Promise<string | null> {
    // 如果模板有assets且包含该资源ID
    if (template.assets && template.assets[assetId]) {
      const assetUrl = template.assets[assetId];
      
      // 如果是URL，则懒加载
      if (typeof assetUrl === 'string' && assetUrl.startsWith('http')) {
        try {
          return await loadStickerAsset(assetUrl);
        } catch (error) {
          console.error('Failed to load asset from CDN:', assetUrl, error);
          return null;
        }
      }
      
      // 如果已经是内容，直接返回
      return assetUrl;
    }
    
    // 使用模板的getAsset方法
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

  // 新增：批量预加载所有常用分类
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

await fs.writeFile(join(__dirname, './stickers-templates-cdn.gen.ts'), code, {
  encoding: 'utf-8',
});

console.log('✅ CDN版本的贴纸模板已生成: stickers-templates-cdn.gen.ts');
console.log('📊 统计信息:');
console.log(`- 总分类数: ${Object.keys(data).length}`);
console.log(`- 总贴纸数: ${Object.values(data).reduce((sum, category) => sum + Object.keys(category).length, 0)}`);
console.log(`- CDN基础URL: ${CDN_BASE_URL}`); 
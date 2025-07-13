/* eslint-disable */
// @ts-nocheck


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
      throw new Error(`Failed to load asset: ${response.status}`);
    }
    const content = await response.text();
    assetCache.set(url, content);
    return content;
  } catch (error) {
    console.error('贴纸资源加载失败:', error);
    throw error;
  }
}

// 预加载封面图片
async function preloadStickerCover(url: string): Promise<string> {
  return loadStickerAsset(url);
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
        console.warn('资源预加载失败：', data.name, error);
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
        flavour: 'affine:page',
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
            flavour: 'affine:surface',
            props: {
              elements: {},
            },
            children: [
              {
                type: 'block',
                id: 'block:N24al1Qgl7',
                flavour: 'affine:image',
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

const templates = {
  "AI Complex": [     buildStickerTemplate({
        name: "ai-complex-1",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-1.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-1.svg",
        hash: "0gHveQVl9uIhl_-Q47LDknudgLlmOT1IUVw5Sm1Rcy8=",
      }),
     buildStickerTemplate({
        name: "ai-complex-2",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-2.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-2.svg",
        hash: "VF2mHdA9CCngIWIzhJU2UtQHKQlWfKdusbF406O_lV4=",
      }),
     buildStickerTemplate({
        name: "ai-complex-3",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-3.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-3.svg",
        hash: "5AWsjj16gnU1U0BcUf6xmIVbWzKJ5Z8GuMbEqkmxMrs=",
      }),
     buildStickerTemplate({
        name: "ai-complex-4",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-4.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-4.svg",
        hash: "_U1EOaViNMKZ5GO_mQ-t6EhDFbnXJ2tvfvsdUGIAeiI=",
      }),
     buildStickerTemplate({
        name: "ai-complex-5",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-5.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-5.svg",
        hash: "gPZYaNE7VfX8Rf1aIzoc64In3W7ktHVMpsLKiTNjsWU=",
      }),
     buildStickerTemplate({
        name: "ai-complex-6",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-6.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-6.svg",
        hash: "pCsCwlGKD9mWQX9rfZRXoxAfjRNNLgm9_dfVHZ-oVls=",
      }),
     buildStickerTemplate({
        name: "ai-complex-7",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-7.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-7.svg",
        hash: "XJkCvK-JDvxu84WNbLx9zbJK1SMiKRabTKnKcVGU50Y=",
      }),
     buildStickerTemplate({
        name: "ai-complex-8",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-8.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-8.svg",
        hash: "yuaFw_iyk20jwTlKJNdlHQB1uj4qvpFAssf_hWrXOlE=",
      }),
     buildStickerTemplate({
        name: "ai-complex-9",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-9.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-9.svg",
        hash: "qy4WxeTiR9HnDhKadeKtafduCUXX3Tp82EXTzQLlpVY=",
      }),
     buildStickerTemplate({
        name: "ai-complex-10",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-10.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-10.svg",
        hash: "w7EBGwBKsa_dK0p-vWQ6I888nXtfeAhAbp2La1Pt5uI=",
      }),
     buildStickerTemplate({
        name: "ai-complex-11",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-11.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-11.svg",
        hash: "vX85b8DitiLBvJf24OioVvsr4Bv7aSIswcJQAU8b5L0=",
      }),
     buildStickerTemplate({
        name: "ai-complex-12",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-12.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-12.svg",
        hash: "l3wWh7G1Urco4tLj415yyMJPCS8A2Zf9IreK1WDW0ug=",
      }),
     buildStickerTemplate({
        name: "ai-complex-13",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-13.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-13.svg",
        hash: "_S472Q5N-gRzARa096laFNIkuEdopvAB11iAfyLLGR0=",
      }),
     buildStickerTemplate({
        name: "ai-complex-14",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-14.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-14.svg",
        hash: "Z_5TQguJ-H7CqR-7f7kNESviF8wwdFGaO_t_Gd8x3OU=",
      }),
     buildStickerTemplate({
        name: "ai-complex-15",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-15.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-15.svg",
        hash: "O679B0qleRtpylt2R_50WQt4xhwu7Lxc_zMZG21waHQ=",
      }),
     buildStickerTemplate({
        name: "ai-complex-16",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-16.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-16.svg",
        hash: "iosiL3rTwz-_d98JBNSZoCBRECM9fds22uvMlyfVwHc=",
      }),
     buildStickerTemplate({
        name: "ai-complex-17",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-17.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-17.svg",
        hash: "Ag1OrOmf17uVu7DOMoBB-mUCuBFiz1X5diu6OzvASkY=",
      }),
     buildStickerTemplate({
        name: "ai-complex-18",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Cover/ai-complex-18.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Complex/Content/ai-complex-18.svg",
        hash: "j8AF5IPM_m6f0TX60X777BTx2GIDOrGZgB7njuIRP5A=",
      }),],
"AI Generated": [     buildStickerTemplate({
        name: "ai-pattern-1",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Cover/ai-pattern-1.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Content/ai-pattern-1.svg",
        hash: "fZj8ByIBUANrnIiIa7hRWQrzWCgCJzYYNzW3G3XNRLI=",
      }),
     buildStickerTemplate({
        name: "ai-pattern-2",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Cover/ai-pattern-2.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Content/ai-pattern-2.svg",
        hash: "n7PRLzL0xcRpzadGx3OjoG4s5IwNs4fF2NFxZT_Y0mw=",
      }),
     buildStickerTemplate({
        name: "ai-pattern-3",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Cover/ai-pattern-3.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Content/ai-pattern-3.svg",
        hash: "4xn1jEWplsakGR2aqkc1cciqolAUtihCVOC38CxRUrs=",
      }),
     buildStickerTemplate({
        name: "ai-pattern-4",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Cover/ai-pattern-4.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Content/ai-pattern-4.svg",
        hash: "jDaJojbg8o3ok-t5IxJHUXa8Sdd8-T05Gl_jOzF5kSM=",
      }),
     buildStickerTemplate({
        name: "ai-pattern-5",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Cover/ai-pattern-5.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Content/ai-pattern-5.svg",
        hash: "uO7tvxMG6Kcd7IJN574ds21RU4AqyxgAdBiYfshq1TA=",
      }),
     buildStickerTemplate({
        name: "ai-pattern-6",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Cover/ai-pattern-6.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Content/ai-pattern-6.svg",
        hash: "6zpeB_pUqErszFZvIeeJbgE3t-5UcShkQT_-CNkfL6w=",
      }),
     buildStickerTemplate({
        name: "ai-pattern-7",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Cover/ai-pattern-7.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Content/ai-pattern-7.svg",
        hash: "6kM6aSy_a2WdRZlvdiP43H7-ZRWxfquWVYw9ieezMA8=",
      }),
     buildStickerTemplate({
        name: "ai-pattern-8",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Cover/ai-pattern-8.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Content/ai-pattern-8.svg",
        hash: "1TpEObHO1hKZlvPkWVun2Xa-46fTgIHzHRMQUEoojZQ=",
      }),
     buildStickerTemplate({
        name: "ai-pattern-9",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Cover/ai-pattern-9.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Generated/Content/ai-pattern-9.svg",
        hash: "J1Sq6iIMRx6Hpt0kpYbQuD3hYfwc1nXgW9L25GGvIGg=",
      }),],
"AI Patterns": [     buildStickerTemplate({
        name: "ai-pattern-1",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Patterns/Cover/ai-pattern-1.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Patterns/Content/ai-pattern-1.svg",
        hash: "Z-juIEAFObj-6qtZAs9n1EHJWID9taQAxx96ZW_wUEQ=",
      }),
     buildStickerTemplate({
        name: "ai-pattern-2",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Patterns/Cover/ai-pattern-2.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Patterns/Content/ai-pattern-2.svg",
        hash: "ei6CYQwukVrYOfBT6Wd_pWkiSqGLsmg38_DUTdNVXhk=",
      }),
     buildStickerTemplate({
        name: "ai-pattern-3",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Patterns/Cover/ai-pattern-3.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Patterns/Content/ai-pattern-3.svg",
        hash: "0xA_CjayQan6L0u-GniqiXJpNAJ4pkOI3GeOMr4sFEU=",
      }),
     buildStickerTemplate({
        name: "ai-pattern-4",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Patterns/Cover/ai-pattern-4.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Patterns/Content/ai-pattern-4.svg",
        hash: "6rJlfgQ0Qdf2jm6URZaBRRTkzq5gUdsUrC6Gt31diko=",
      }),
     buildStickerTemplate({
        name: "ai-pattern-5",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Patterns/Cover/ai-pattern-5.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Patterns/Content/ai-pattern-5.svg",
        hash: "FouC9zwgxSgFlMGPadt6u0KzjLvLXiyJKLxQDjJFGH0=",
      }),
     buildStickerTemplate({
        name: "ai-pattern-6",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Patterns/Cover/ai-pattern-6.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Patterns/Content/ai-pattern-6.svg",
        hash: "k-j-bF4qzvIcKwRRSZdAUsbw0XuRVz92zKlW2CegMYY=",
      }),
     buildStickerTemplate({
        name: "ai-pattern-7",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Patterns/Cover/ai-pattern-7.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Patterns/Content/ai-pattern-7.svg",
        hash: "nkKdwIN6rYUKH9Es1e6W7HkfaUA6yTizYFxkgBJA6CM=",
      }),
     buildStickerTemplate({
        name: "ai-pattern-8",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Patterns/Cover/ai-pattern-8.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/AI%20Patterns/Content/ai-pattern-8.svg",
        hash: "pMSDi87BzVPmcMEeWUN1-AbZc8UDvt1-NAT2ojT3Yns=",
      }),],
"Arrows": [     buildStickerTemplate({
        name: "arrow-1",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-1.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-1.svg",
        hash: "YaaYGysUizxrn-koKS9MlYXg2R2zpQecoFx08jya0aQ=",
      }),
     buildStickerTemplate({
        name: "arrow-2",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-2.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-2.svg",
        hash: "T3QfBMbD4gWhI6lL4TRNe5FMat02T2YBvPe-Rm4FkrY=",
      }),
     buildStickerTemplate({
        name: "arrow-3",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-3.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-3.svg",
        hash: "zfqg42rHf9B8I74XfxaZ4-mXnmFlwX9SZk47AN-MuY8=",
      }),
     buildStickerTemplate({
        name: "arrow-4",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-4.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-4.svg",
        hash: "OYOorxDDTlC73QmhkhpxYlpCl00nZGG_MY3fCaChAyw=",
      }),
     buildStickerTemplate({
        name: "arrow-5",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-5.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-5.svg",
        hash: "lVpqGZ4JOJLnF8Lj6LUr3HXt8Uzg14HUKTdy61mA06E=",
      }),
     buildStickerTemplate({
        name: "arrow-6",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-6.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-6.svg",
        hash: "YQvXGmyQ5CMoeQOqiICDhRlPMx4GxJbK1s1VcCgWJXg=",
      }),
     buildStickerTemplate({
        name: "arrow-7",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-7.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-7.svg",
        hash: "W0soM0fGEdNGDj8Aes2l2XpXfC8ib-8zpCw8HbEMcsI=",
      }),
     buildStickerTemplate({
        name: "arrow-8",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-8.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-8.svg",
        hash: "UU1vpJSy17AzURffXHIfQbkNPQ8nH5_Z60xTYUy2ifI=",
      }),
     buildStickerTemplate({
        name: "arrow-9",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-9.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-9.svg",
        hash: "SrCFM2aHAyR6-oBEqHdhiflZVmVL2zt-rDbgLtANvAM=",
      }),
     buildStickerTemplate({
        name: "arrow-10",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-10.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-10.svg",
        hash: "lehO7Xs0UKt0MR8RyZ6kV74M_zCy0GgrTSiOD7oNRmE=",
      }),
     buildStickerTemplate({
        name: "arrow-11",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-11.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-11.svg",
        hash: "_dXUvx5tTcm4IykbislTxwNoSLJ4g3oqmd7A9x4ONdY=",
      }),
     buildStickerTemplate({
        name: "arrow-12",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-12.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-12.svg",
        hash: "cwaReNMJ3a7-qEjDWyiqV-BZB3hH7yJmm7xTRyEQktM=",
      }),
     buildStickerTemplate({
        name: "arrow-13",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-13.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-13.svg",
        hash: "OZS78ZRp59njtnYy4EMPrDJRBaW7GHCHOAnlB7oquBo=",
      }),
     buildStickerTemplate({
        name: "arrow-14",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-14.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-14.svg",
        hash: "3htAxVQCWAm3c0_xy0sUXKB_TAzwqwcodLA2W-633nA=",
      }),
     buildStickerTemplate({
        name: "arrow-15",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-15.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-15.svg",
        hash: "xjqPPHMP_NtP_T4c8SDW-9XMiZJOf01BnXATYq7WwUc=",
      }),
     buildStickerTemplate({
        name: "arrow-16",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-16.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-16.svg",
        hash: "celWgMBt-s1RP6U9e4XY0Cl2DbQ640-d-dmmKJOTPbU=",
      }),
     buildStickerTemplate({
        name: "arrow-17",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-17.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-17.svg",
        hash: "tlHzKPxi-aD8VBnvYY92WL44AXLrS1fiiAT4Q2BZM0A=",
      }),
     buildStickerTemplate({
        name: "arrow-18",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-18.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-18.svg",
        hash: "_XMVZ9Ky61ezOSN9lhOUpIozBo8s0rzWDnb7wmOhpXA=",
      }),
     buildStickerTemplate({
        name: "arrow-19",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-19.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-19.svg",
        hash: "Wz0AJRnxvmUP5tVN2lauHdJ8zTaM9YNp6bDGqz1oeJk=",
      }),
     buildStickerTemplate({
        name: "arrow-20",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-20.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-20.svg",
        hash: "spOLMoa4_zQrMdEQVp7N9WNP2p-fidto0KBHPcONRPE=",
      }),
     buildStickerTemplate({
        name: "arrow-21",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-21.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-21.svg",
        hash: "h38dM2XAmu4KuVJX9ub4KN0BRoTz9HL0bSF6wsH-GZU=",
      }),
     buildStickerTemplate({
        name: "arrow-22",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-22.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-22.svg",
        hash: "Q06vAxpk3bVg7tPPx6d_rLt_BXSn2XtQm04Y83o5mVE=",
      }),
     buildStickerTemplate({
        name: "arrow-23",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-23.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-23.svg",
        hash: "A4rLg-FbEFkqP7NMZV1clkPRT-QINd26jg16Fa3fVwU=",
      }),
     buildStickerTemplate({
        name: "arrow-24",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-24.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-24.svg",
        hash: "WvD3rniT5lIIXDPzZjLDRFA8Dyh9fyZXu3pTWEtF1-s=",
      }),
     buildStickerTemplate({
        name: "arrow-25",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-25.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-25.svg",
        hash: "Qvp034XeuAbYvvHqbJJ6FYU15EqR9JMSQwNVLBVHeyk=",
      }),
     buildStickerTemplate({
        name: "arrow-26",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-26.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-26.svg",
        hash: "e7hjjnG2FI3n2dfUfRg5Knpn944nnMQYhdr1LVCNhRU=",
      }),
     buildStickerTemplate({
        name: "arrow-27",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-27.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-27.svg",
        hash: "c8fsJDnXqHrRFg3Ju83wRHa1RCO9k3o2NFF1Tjr8thQ=",
      }),
     buildStickerTemplate({
        name: "arrow-28",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-28.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-28.svg",
        hash: "JGY17Y2grsR8lGd0sZf85_ZjL6-uvAp0ONtX3FK95ck=",
      }),
     buildStickerTemplate({
        name: "arrow-29",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-29.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-29.svg",
        hash: "F4YbPiTTNGq9cyiqSKjIxAEBYdWORNLFYxHMmfAs24o=",
      }),
     buildStickerTemplate({
        name: "arrow-30",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-30.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-30.svg",
        hash: "wDMTQN26VcBOOF9nDhlem7ovgKLdNbFOvPyEDoHk6H0=",
      }),
     buildStickerTemplate({
        name: "arrow-31",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-31.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-31.svg",
        hash: "c9p-sdq9YXFyNcsfgn6CC6n-DNDi9MxAW7v-4u_sLbo=",
      }),
     buildStickerTemplate({
        name: "arrow-32",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-32.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-32.svg",
        hash: "lQr19wl2u3bkJ4y_q5BaLDe6K2DtIpu8AUktOAEou38=",
      }),
     buildStickerTemplate({
        name: "arrow-33",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-33.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-33.svg",
        hash: "wGi2efXTFGlBV97YvMm72_miToeWITK_SfSgEmL04LY=",
      }),
     buildStickerTemplate({
        name: "arrow-34",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-34.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-34.svg",
        hash: "-nOQjmN_oJrfSZqwRVK5SxKVNcLNDjsgd1CkpOyBIyY=",
      }),
     buildStickerTemplate({
        name: "arrow-35",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-35.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-35.svg",
        hash: "I0WOQG_uY4j7l7xonH2D0dEpcvsqE7g5h_B8ZZqxBgI=",
      }),
     buildStickerTemplate({
        name: "arrow-36",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-36.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-36.svg",
        hash: "Cov5L8kmEp9w5xza4bDj_EQ6u--_Xx1GNO3vcGgx3YE=",
      }),
     buildStickerTemplate({
        name: "arrow-37",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-37.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-37.svg",
        hash: "3V1oNO4Mpy2GMi8uAqSqpYXYPJBGp_1ZCgDaEl9wVxI=",
      }),
     buildStickerTemplate({
        name: "arrow-38",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-38.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-38.svg",
        hash: "uvdQrHq3w8jVwJe5KRBJHi9kd0CmEJl2sZfAEj2XKdM=",
      }),
     buildStickerTemplate({
        name: "arrow-39",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-39.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-39.svg",
        hash: "Az86WgB08HFKq7bUIokNEw-nEp42A27Gt3_ZbJXksyw=",
      }),
     buildStickerTemplate({
        name: "arrow-40",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-40.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-40.svg",
        hash: "X0XV84s7C0Kdu3YwrSPgENA9ljWCXzSXpgY3A-xyaXA=",
      }),
     buildStickerTemplate({
        name: "arrow-41",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-41.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-41.svg",
        hash: "mYOSSo5okBDq6skCILrS8LTpW6-xfwusBoKVlkuCkzQ=",
      }),
     buildStickerTemplate({
        name: "arrow-42",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-42.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-42.svg",
        hash: "4l6wtVF-XjqEnsKe-IorebIcgUG4GGLLLlbns2LFh5Y=",
      }),
     buildStickerTemplate({
        name: "arrow-43",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-43.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-43.svg",
        hash: "3gR8h5LNWKGH8gA2C5_AjzrfDZD62pgJADPVTFDDaCw=",
      }),
     buildStickerTemplate({
        name: "arrow-44",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-44.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-44.svg",
        hash: "qDhEedh5a5F5qXuGGec6_y_v4Qp1TFrgtuKqF4PG9Xc=",
      }),
     buildStickerTemplate({
        name: "arrow-45",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-45.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-45.svg",
        hash: "R2Xz-yMk_8lA_svgD8p0kt1qEiDoNh0kmqggaMcqLAE=",
      }),
     buildStickerTemplate({
        name: "arrow-46",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-46.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-46.svg",
        hash: "zJ8gOpjZ-v9dgH7lsJBohyTCPqCLCY_hAmRLkgnXuOs=",
      }),
     buildStickerTemplate({
        name: "arrow-47",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-47.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-47.svg",
        hash: "AmYp6Sz1U336rD4IbOlLFg0vxCbuhhSXbqBdXz7Uxjw=",
      }),
     buildStickerTemplate({
        name: "arrow-48",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-48.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-48.svg",
        hash: "TKnls2KcG0don7CExsXGfGoCR__wxKHywMClrdalLt4=",
      }),
     buildStickerTemplate({
        name: "arrow-49",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-49.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-49.svg",
        hash: "39a8HJTi7-d-fWMsbS52trjZRXv6dCeZprY3C7Z87K8=",
      }),
     buildStickerTemplate({
        name: "arrow-50",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-50.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-50.svg",
        hash: "EbBer46rRfgwQrkn-wmvGtlnPt8E0BPtys5AZaAiCBg=",
      }),
     buildStickerTemplate({
        name: "arrow-51",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-51.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-51.svg",
        hash: "0AUgxWzhjSlb6dJ00JdlaDauf3XYbu6s5LkREGOQu2o=",
      }),
     buildStickerTemplate({
        name: "arrow-52",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-52.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-52.svg",
        hash: "lod43ond8UWBEt1BuCtARNI4CR4dxM7rWpslbDpgI64=",
      }),
     buildStickerTemplate({
        name: "arrow-53",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-53.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-53.svg",
        hash: "Jacw1kzigDegUKTqoGCblNRKLZ1x5v0DKdDzeX1ZOI4=",
      }),
     buildStickerTemplate({
        name: "arrow-54",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-54.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-54.svg",
        hash: "Kt1rXTJAbBpYPBFa503w_lT5tB3T1elds1FAFZP3uSQ=",
      }),
     buildStickerTemplate({
        name: "arrow-55",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-55.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-55.svg",
        hash: "B9NdjtekEcN5oAl5OJNCS_nLpKejXTRNgsCoHDlrMOU=",
      }),
     buildStickerTemplate({
        name: "arrow-56",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-56.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-56.svg",
        hash: "qHg56iOOdWQuE-rZaow6EjW8xCmM8KW89s2kUXnsPPk=",
      }),
     buildStickerTemplate({
        name: "arrow-57",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-57.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-57.svg",
        hash: "10MHITGc7WLFxUHX48DBaT4kGB4-_U387XnY8sLckyk=",
      }),
     buildStickerTemplate({
        name: "arrow-58",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-58.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-58.svg",
        hash: "AR3Vb5Ls8s1bYxNcKyqNp1hzbEN_0ONG7XbCOOP9MIQ=",
      }),
     buildStickerTemplate({
        name: "arrow-59",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-59.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-59.svg",
        hash: "FhklHxC9FkPnYOelqR9fmyDePimgC2AdFUal9lQTxT0=",
      }),
     buildStickerTemplate({
        name: "arrow-60",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-60.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-60.svg",
        hash: "qxGeYRvhJdFiDHFKeh1x1PFdGOwMB5vcS_TS84plCnU=",
      }),
     buildStickerTemplate({
        name: "arrow-61",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-61.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-61.svg",
        hash: "KAdP7kc19_WdMA8-liEOPC1ziXaxTXmA7tppdFq8e9s=",
      }),
     buildStickerTemplate({
        name: "arrow-62",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-62.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-62.svg",
        hash: "UnGxrjNjKzW34c_q1Aot6xquEa2tmLht9FjTSM4tABg=",
      }),
     buildStickerTemplate({
        name: "arrow-63",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-63.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-63.svg",
        hash: "T7jQAdOwCgw3q4kPSWiuhMuiTyYSqc66OSnvfs9FRJ0=",
      }),
     buildStickerTemplate({
        name: "arrow-64",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-64.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-64.svg",
        hash: "sKzuGfE90E8IIluGiUwuyx8OJKbvoTReiOAHDCSRp1M=",
      }),
     buildStickerTemplate({
        name: "arrow-65",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-65.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-65.svg",
        hash: "XI_NKdIzwCHUdpKJWIjLbcIRAfqWcndTysQM4rih9ts=",
      }),
     buildStickerTemplate({
        name: "arrow-66",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-66.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-66.svg",
        hash: "RleQTrXAxdfBAULTfmrQniFREUI_Qsz4dTjmDGhccQo=",
      }),
     buildStickerTemplate({
        name: "arrow-67",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-67.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-67.svg",
        hash: "x5TMf4rI1S-YzA0V9wERKTdOaMbRKBZD1NDu_1I5THY=",
      }),
     buildStickerTemplate({
        name: "arrow-68",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-68.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-68.svg",
        hash: "a6KuDZVNqxg1m8zcdPJ5X37yp1Z2RaPBibLON6DHG_o=",
      }),
     buildStickerTemplate({
        name: "arrow-69",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-69.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-69.svg",
        hash: "w9ONvmYzWnZZOOjQNGZHNvHBj4O_tEii3aSSk27604E=",
      }),
     buildStickerTemplate({
        name: "arrow-70",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-70.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-70.svg",
        hash: "q-TzLIs1Vnom51w4gCmvmcsB_X8ZzauX-reEqIzL4AE=",
      }),
     buildStickerTemplate({
        name: "arrow-71",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-71.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-71.svg",
        hash: "nJt3Lie_4lb7JfZvJYbr_JbanmvN2HspMw11Cd1FsGw=",
      }),
     buildStickerTemplate({
        name: "arrow-72",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-72.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-72.svg",
        hash: "_4yssK79DQYCjYpmVR71G1J_jGDsWqUpnLRjl2fxl1g=",
      }),
     buildStickerTemplate({
        name: "arrow-73",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-73.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-73.svg",
        hash: "XxN6YXRVZMVXGhkZbuqrTGZapUCKWQ5eCKkWqzWpm6o=",
      }),
     buildStickerTemplate({
        name: "arrow-74",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-74.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-74.svg",
        hash: "gTDGr6agieS0aX7Zqn_JeHzXwK_4zh_bu21dT_azrEg=",
      }),
     buildStickerTemplate({
        name: "arrow-75",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-75.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-75.svg",
        hash: "cQQFdMzD9BHwFEKveUdf4TBSSn5v6RzFEWRgNbT-2aE=",
      }),
     buildStickerTemplate({
        name: "arrow-76",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-76.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-76.svg",
        hash: "jLYcblTKLLbF3LqlH2y6hct4davXDEGzgL47IYNgjMA=",
      }),
     buildStickerTemplate({
        name: "arrow-77",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-77.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-77.svg",
        hash: "_mWNkJ8I_nAuO7KsPgKm-3MjAutNc-WSS0uYvvKlYz8=",
      }),
     buildStickerTemplate({
        name: "arrow-78",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-78.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-78.svg",
        hash: "koB_mtrAP5nO43INYL17oBFgMcdAOBg01myAEa-WeaU=",
      }),
     buildStickerTemplate({
        name: "arrow-79",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-79.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-79.svg",
        hash: "sxgXGRnY1INaau0E7lB-9BIUdKSDuRv3yhkhZ735WNo=",
      }),
     buildStickerTemplate({
        name: "arrow-80",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-80.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-80.svg",
        hash: "WoKb0XxY2vkV9qwFyGMYC0T7sPFlUmP9CZIKypuDM4Q=",
      }),
     buildStickerTemplate({
        name: "arrow-81",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-81.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-81.svg",
        hash: "eKh09dHTXqvmMICV1HoJeEKQUBFP3uD0n6dB2qs6etM=",
      }),
     buildStickerTemplate({
        name: "arrow-82",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-82.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-82.svg",
        hash: "uaezPvW7KieyG0_58MD6BkJEbfjnnUpQBIE3ZhsRGiw=",
      }),
     buildStickerTemplate({
        name: "arrow-83",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-83.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-83.svg",
        hash: "1EGNaIXzya6Gy_MhxB_nuvzVWVa3osLYhcAj6ZpX4BI=",
      }),
     buildStickerTemplate({
        name: "arrow-84",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-84.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-84.svg",
        hash: "mvQMRlR_GJ8tp8ncap4jIgBmPalapJV-cJVdTRMZgXM=",
      }),
     buildStickerTemplate({
        name: "arrow-85",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-85.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-85.svg",
        hash: "qFvtDG3q_nsUl5FR3cPH6bcfkbVwOWn1XCyac8QoQBY=",
      }),
     buildStickerTemplate({
        name: "arrow-86",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-86.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-86.svg",
        hash: "uXpsDDpWzxUBu2OaMxFJFGkHuJDQ59NTQXocl5HmiNE=",
      }),
     buildStickerTemplate({
        name: "arrow-87",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-87.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-87.svg",
        hash: "2V5PR2qrVW516Td2advDoYFrQVPO2HGHv82xZ5jxVds=",
      }),
     buildStickerTemplate({
        name: "arrow-88",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-88.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-88.svg",
        hash: "YxmlQ71SPxltuf3pHx6DUOvCFtQB9z9nCgETxX4iW8Y=",
      }),
     buildStickerTemplate({
        name: "arrow-89",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-89.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-89.svg",
        hash: "hIeVzZMwHE5mKg7s0cQ__4v9MIOKNbgvoYybrChR9_c=",
      }),
     buildStickerTemplate({
        name: "arrow-90",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-90.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-90.svg",
        hash: "e2Fh3BuJJ9r3eyN92MeLeP-rTfGVgtGw4-10BeIfR-c=",
      }),
     buildStickerTemplate({
        name: "arrow-91",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-91.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-91.svg",
        hash: "quwM6cyRSvnsn1j6fsB4saZUpAxooky3F_9BSLKn21Y=",
      }),
     buildStickerTemplate({
        name: "arrow-92",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-92.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-92.svg",
        hash: "poYBN2TaRZ2vqOU7SSDl2lfftpWZxqQW0iC7JWK-EaA=",
      }),
     buildStickerTemplate({
        name: "arrow-93",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-93.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-93.svg",
        hash: "XWVUNPUtdC-XouXk1lduRIftYPrv6evaATxUWnUh7P0=",
      }),
     buildStickerTemplate({
        name: "arrow-94",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-94.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-94.svg",
        hash: "9MGtE1XdWXKTCdBJr7nnA5bpcxLCCu_A8aBBSWzpCSI=",
      }),
     buildStickerTemplate({
        name: "arrow-95",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-95.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-95.svg",
        hash: "hgMEGBkWqMHfIkWVLcZ1PbK-LVqRxgXYapd6EuBWcaA=",
      }),
     buildStickerTemplate({
        name: "arrow-96",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-96.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-96.svg",
        hash: "IceU12pEQ7MBcrQC35LhJ_Zn3L04QuFV3Mdv7YT7FMk=",
      }),
     buildStickerTemplate({
        name: "arrow-97",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-97.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-97.svg",
        hash: "o_H8jR75oxwJEF9JZobNHeQaxz_UXNeGyVHErb95bo4=",
      }),
     buildStickerTemplate({
        name: "arrow-98",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-98.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-98.svg",
        hash: "T_Nv1A4TIaiyXAwt8gljpkAT2Z3J_LTB02_x-fx3QfY=",
      }),
     buildStickerTemplate({
        name: "arrow-99",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-99.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-99.svg",
        hash: "RKbA1LvkNKrqITLidXxAtkabVSmqXn4CyUBc3CZ3oKc=",
      }),
     buildStickerTemplate({
        name: "arrow-100",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-100.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-100.svg",
        hash: "YHrOpB868jEjxFoCAEjx11RMw7AEhnLEoBCMwlt3LYo=",
      }),
     buildStickerTemplate({
        name: "arrow-101",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-101.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-101.svg",
        hash: "maGNtNtcIRjZNSCvmrg06iUnJa1w5Nf4JvzSmIGY8ws=",
      }),
     buildStickerTemplate({
        name: "arrow-102",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-102.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-102.svg",
        hash: "ODaH0-jBWhlR0xy2ELPGP78Xokjrr5VjoQnfPZu0EcE=",
      }),
     buildStickerTemplate({
        name: "arrow-103",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-103.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-103.svg",
        hash: "qYjgNfKU265UxXMDWPWYUNsjeN46VUYS6jnEJ4xeQUI=",
      }),
     buildStickerTemplate({
        name: "arrow-104",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-104.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-104.svg",
        hash: "Tj0oBWQKtSO_1528dsfUlwgOqnPq8EBhC7aZYDWXfhs=",
      }),
     buildStickerTemplate({
        name: "arrow-105",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-105.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-105.svg",
        hash: "KJS9VQh7NVNidvVTr8ue0mHPABDIe_OCqlWYejZr1Hg=",
      }),
     buildStickerTemplate({
        name: "arrow-106",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-106.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-106.svg",
        hash: "Ut25LI6ck53-qeZ78Cydd0R3l1Rc6NORHudUd6wvTj4=",
      }),
     buildStickerTemplate({
        name: "arrow-107",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-107.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-107.svg",
        hash: "7HpyfAAitzLHycn52giubS8TI7nVsR29LQ1oP4m8tEs=",
      }),
     buildStickerTemplate({
        name: "arrow-108",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-108.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-108.svg",
        hash: "eoAS3h5skTCH12LqQ1_XkpZkZnSiJIoz51l-Q7Hhcuc=",
      }),
     buildStickerTemplate({
        name: "arrow-109",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-109.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-109.svg",
        hash: "MagxHByjiJ2s33LdBCxP9JNTEy-qnHdYJ_EOg1OYdb4=",
      }),
     buildStickerTemplate({
        name: "arrow-110",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-110.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-110.svg",
        hash: "UoOMFSmjXcHqtngkSNdx68zRVhU5Hp3uxERKLlooQVY=",
      }),
     buildStickerTemplate({
        name: "arrow-111",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-111.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-111.svg",
        hash: "m2DEb21bFxLa6XkfLvCtxmIQfnDDllSdOrxXvFcOMT4=",
      }),
     buildStickerTemplate({
        name: "arrow-112",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-112.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-112.svg",
        hash: "OokShOsH5aZC5Zbfh8Lkqj01HoPbnfbjdQkJQaaw3ug=",
      }),
     buildStickerTemplate({
        name: "arrow-113",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-113.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-113.svg",
        hash: "dnKWQym8Dgz0UzYcUaK2tfph0kp7PrP0pY1wEFIcgZ0=",
      }),
     buildStickerTemplate({
        name: "arrow-114",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-114.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-114.svg",
        hash: "QrU4_P6AF-1K1EaD68OHBQf0uPXOhTG24QfdcqOMa1Y=",
      }),
     buildStickerTemplate({
        name: "arrow-115",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-115.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-115.svg",
        hash: "GMkgR0E8CJUZ-tmyXAElVSAYz_NRG4sYrZdOv2oRB3Q=",
      }),
     buildStickerTemplate({
        name: "arrow-116",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-116.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-116.svg",
        hash: "UHl_GxFYv6N0vv14tia8ikpumzM_0U60tQBu7IRRgas=",
      }),
     buildStickerTemplate({
        name: "arrow-117",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-117.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-117.svg",
        hash: "djrkvvGtEKWqJaKEJYEtULt3-irEqCbrKpR9ZO5ZfEs=",
      }),
     buildStickerTemplate({
        name: "arrow-118",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-118.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-118.svg",
        hash: "FSjNcXiifqvpDqKTJgJmAbftD_NwfbUm5ls24hupE3A=",
      }),
     buildStickerTemplate({
        name: "arrow-119",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-119.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-119.svg",
        hash: "_-fmAAV8-Y_46ovEt7Cj4vjpguT_IUTNXMfzwmzpXvM=",
      }),
     buildStickerTemplate({
        name: "arrow-120",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-120.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-120.svg",
        hash: "GkDSsSD4vncYvGWmx5jD-VkyGLPZe74i34HHEV6lxs4=",
      }),
     buildStickerTemplate({
        name: "arrow-121",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-121.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-121.svg",
        hash: "54oAfew92u5k2i2m_wKzDrDKCZMPVwecWPNu-j8SlYI=",
      }),
     buildStickerTemplate({
        name: "arrow-122",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-122.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-122.svg",
        hash: "KORPcjmy9n9mMG0vqyxmBQA-4vJ0RjD7KoS5S45T3jw=",
      }),
     buildStickerTemplate({
        name: "arrow-123",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-123.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-123.svg",
        hash: "Qz59poJguyJw9AGiHRRPf3PW0ZeE8OgglRSmBa1D2rc=",
      }),
     buildStickerTemplate({
        name: "arrow-124",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-124.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-124.svg",
        hash: "GKr2EbYxDpz_q1Zkr6JJXTFzfSHUt2LJFbRAD75h9Bw=",
      }),
     buildStickerTemplate({
        name: "arrow-125",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-125.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-125.svg",
        hash: "WFMY2PQ03BRTNXwBu1JnMUUymFpkYMrRXDtnSPdldHQ=",
      }),
     buildStickerTemplate({
        name: "arrow-126",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-126.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-126.svg",
        hash: "gmsqvXOgIMM16zlHXLbfwZABSzAN3C0FBGq5Wk-v1xg=",
      }),
     buildStickerTemplate({
        name: "arrow-127",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-127.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-127.svg",
        hash: "e5bXvc6Uf0qPkajmzAL0sNSg8gFHPhPpKGh3O5eh1M0=",
      }),
     buildStickerTemplate({
        name: "arrow-128",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-128.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-128.svg",
        hash: "XDRUK8DczeG1-oCVPE8NGSkKT0DWo4LebdZ_qcW-frk=",
      }),
     buildStickerTemplate({
        name: "arrow-129",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-129.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-129.svg",
        hash: "7OUGO8MAMnuXrlJTa3n9tV_97BEUdmvUTEJJ_Su5o00=",
      }),
     buildStickerTemplate({
        name: "arrow-130",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-130.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-130.svg",
        hash: "UBjSYs2MzMR8knqu3SkZNerIpoQAesAFv9jb9y0qaWM=",
      }),
     buildStickerTemplate({
        name: "arrow-131",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-131.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-131.svg",
        hash: "gw0lkMrt8Nxf7VH4WB82psFO1CI1cge29F2FFDE6HVU=",
      }),
     buildStickerTemplate({
        name: "arrow-132",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-132.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-132.svg",
        hash: "JgcPNXMXJrlbGiVc_IyLcwxiAYjXVGTQKxZLvGnr_uk=",
      }),
     buildStickerTemplate({
        name: "arrow-133",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-133.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-133.svg",
        hash: "luQXiAzIJ7hxWEqiG483JKupOtkFpgOAKKgI8Wzms1o=",
      }),
     buildStickerTemplate({
        name: "arrow-134",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-134.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-134.svg",
        hash: "H5XE_wOB5dg1TKso2zxseeXIubLIhSwNZ3Py3n9k-FE=",
      }),
     buildStickerTemplate({
        name: "arrow-135",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-135.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-135.svg",
        hash: "HtTxkr8kBtSDHy7HW2_E_csFc4KhDRi3Z5gkZyDm4kM=",
      }),
     buildStickerTemplate({
        name: "arrow-136",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-136.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-136.svg",
        hash: "sDe_sAZ9japs2uB025cVp5qViZVw4m2LeAWE6HZKQnU=",
      }),
     buildStickerTemplate({
        name: "arrow-137",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-137.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-137.svg",
        hash: "75EsFpQ8QYEh2z-sLanaSWaJttlvuthbMPzQJjply64=",
      }),
     buildStickerTemplate({
        name: "arrow-138",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-138.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-138.svg",
        hash: "MLrbqX_vUy3k6lm42iKp4qJZWzXFDzf1DxzjQghElqI=",
      }),
     buildStickerTemplate({
        name: "arrow-139",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-139.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-139.svg",
        hash: "PQ4Qj4DuBFKF4J5SOmW2jcNLjtlIcnzoYYfiEdFU5Hk=",
      }),
     buildStickerTemplate({
        name: "arrow-140",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-140.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-140.svg",
        hash: "y8nOErU_v0Ko_nvzIhSlilF0ue6lbSTE7D3Tdla5cYo=",
      }),
     buildStickerTemplate({
        name: "arrow-141",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-141.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-141.svg",
        hash: "rta9VUGWRd_0PQ-5ZATrec3K4TKzPfoOXZ4aQbYJlC8=",
      }),
     buildStickerTemplate({
        name: "arrow-142",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-142.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-142.svg",
        hash: "JLhISwmOHa6UNuU5cQSXRZHWdbtWF-B7m7whN7H-440=",
      }),
     buildStickerTemplate({
        name: "arrow-143",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-143.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-143.svg",
        hash: "FPtqso4jtpd234L1b2f8aYJVSpoMdjrbDuTjTkGFSl8=",
      }),
     buildStickerTemplate({
        name: "arrow-144",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-144.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-144.svg",
        hash: "7O9NNBRHcHVsVWpzgx7gYSjR5F93SRw4MV2n53b-rfo=",
      }),
     buildStickerTemplate({
        name: "arrow-145",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-145.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-145.svg",
        hash: "Zy_Qh9RquYQy-NAqdd4f71SnULIw4kfih0clDMUXoJU=",
      }),
     buildStickerTemplate({
        name: "arrow-146",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-146.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-146.svg",
        hash: "unLJEDYQ-wmBigb-qUBQMoHbAkr0kpzmNaAkurJPd9I=",
      }),
     buildStickerTemplate({
        name: "arrow-147",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-147.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-147.svg",
        hash: "zFD6YXAGNl_BaxcnPe-MwXOj-6v1IoHWkyBb21ssnrE=",
      }),
     buildStickerTemplate({
        name: "arrow-148",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-148.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-148.svg",
        hash: "P6zOprXE8RAaqavT7JB_2Wm8TTtKe9SlWDslfayDG3I=",
      }),
     buildStickerTemplate({
        name: "arrow-149",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-149.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-149.svg",
        hash: "qDvs8pxqTYqjZRSIvjr4JIcLo00MMK5-REo_foIxqGk=",
      }),
     buildStickerTemplate({
        name: "arrow-150",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-150.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-150.svg",
        hash: "Xmw_3s09sxS2x68zK_4tKRJchcEGPOT4ekldYUBwuhc=",
      }),
     buildStickerTemplate({
        name: "arrow-151",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-151.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-151.svg",
        hash: "ncvXReXL12IJ_-jSPP3MNoaUm0sbJEiwDFbSOCm5YrA=",
      }),
     buildStickerTemplate({
        name: "arrow-152",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-152.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-152.svg",
        hash: "tc6g4G4P6sXFh_-RyIwC-mPARxlI9GGTWT2qM4qGQv8=",
      }),
     buildStickerTemplate({
        name: "arrow-153",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-153.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-153.svg",
        hash: "fgv878SEsW1-XSuSQvmtfvSEGTz6n2d_bkEX2LpFhxM=",
      }),
     buildStickerTemplate({
        name: "arrow-154",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-154.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-154.svg",
        hash: "ehrIzGjsE2q-5vqSG_mv8QBpMp9KYacRxxh9MoRgj4Y=",
      }),
     buildStickerTemplate({
        name: "arrow-155",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-155.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-155.svg",
        hash: "kLQkz14oGfs8pra_VArR6TwO6u08J3S58n4qfIm54PM=",
      }),
     buildStickerTemplate({
        name: "arrow-156",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-156.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-156.svg",
        hash: "rkK3vR72XGsQ7HnaZlaQe_ooBNy7wvELFPl-hIOR_Vk=",
      }),
     buildStickerTemplate({
        name: "arrow-157",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-157.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-157.svg",
        hash: "QEKKz5wIKf2cQotvTq3C86KkXhDMqSbE2lylbwkXDh4=",
      }),
     buildStickerTemplate({
        name: "arrow-158",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-158.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-158.svg",
        hash: "sqjVjNiIlEF3tO8g9JVEFScUKCPBY0caznqsP0G9H9Y=",
      }),
     buildStickerTemplate({
        name: "arrow-159",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-159.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-159.svg",
        hash: "2HmHLWQm_D9n8s-b8ozrmwfMLusAZ9ZJ6Ho2CAvvIDU=",
      }),
     buildStickerTemplate({
        name: "arrow-160",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-160.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-160.svg",
        hash: "oITqoWKu7lLGPUuIYVaxeZriD-9ScH54HJ_GSUEGeWY=",
      }),
     buildStickerTemplate({
        name: "arrow-161",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-161.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-161.svg",
        hash: "tT1v09rMg2t7jsjdBQlan-VhY3zn2HOQNt41bQz-CB4=",
      }),
     buildStickerTemplate({
        name: "arrow-162",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-162.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-162.svg",
        hash: "n5sh39cXKuzEt3xgOKe5qXL4jcxAWq-ofTPsZVFkQS0=",
      }),
     buildStickerTemplate({
        name: "arrow-163",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-163.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-163.svg",
        hash: "HVd59C5Za0TPfjZ7VP2VkgT33gdGL9EEod2JtyiKMzI=",
      }),
     buildStickerTemplate({
        name: "arrow-164",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-164.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-164.svg",
        hash: "2-UWNL3XDEYX1zQkORaDLLePdZDYYUdB8LdnxU3uGMA=",
      }),
     buildStickerTemplate({
        name: "arrow-165",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-165.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-165.svg",
        hash: "1-kbw2QzT09CqljGliDnNnqOIeDimVBCYaSgLkPMPsE=",
      }),
     buildStickerTemplate({
        name: "arrow-166",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-166.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-166.svg",
        hash: "m3NKcP-reCn2I5O2do79AtYyC-WvKEgWOYfFCUhsxDk=",
      }),
     buildStickerTemplate({
        name: "arrow-167",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-167.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-167.svg",
        hash: "7_2MDEWn8DO6re_dBgDXqST_KD8P8oU8fLqCXgqX5yU=",
      }),
     buildStickerTemplate({
        name: "arrow-168",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-168.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-168.svg",
        hash: "uqghDJdRp3nYpE3w3bDhga8Hplwl9Wqj610njR0IF_Y=",
      }),
     buildStickerTemplate({
        name: "arrow-169",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-169.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-169.svg",
        hash: "L8rCxau1aGk5jTgkDJnJOxKuR5AJ8c0m6ba7-A7nJ44=",
      }),
     buildStickerTemplate({
        name: "arrow-170",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-170.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-170.svg",
        hash: "E3KTyPCwLWhSMK_yEYUJIBvcBEDahQDyBq3iWCidIrk=",
      }),
     buildStickerTemplate({
        name: "arrow-171",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-171.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-171.svg",
        hash: "mpnL0nWiiZQgc8J2k3waH0KfEatljxPRyqiDOMls0EM=",
      }),
     buildStickerTemplate({
        name: "arrow-172",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-172.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-172.svg",
        hash: "wOh96Sl2ZJa_dOYHD6jasbMmdy8M-vnui64gX5L-kLY=",
      }),
     buildStickerTemplate({
        name: "arrow-173",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-173.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-173.svg",
        hash: "Jcz5e418FcYZO3VkkFT7_2agkFzjFEsaA2zepwdOjgc=",
      }),
     buildStickerTemplate({
        name: "arrow-174",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-174.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-174.svg",
        hash: "NX8g8xaf9VaR_IUxYFvGN4W96gtY08t1xn3o7ABRO7c=",
      }),
     buildStickerTemplate({
        name: "arrow-175",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-175.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-175.svg",
        hash: "wB3lJNTCUkHF3-TL9DLlevqxHlLHdJxi7HoR5r0Wg08=",
      }),
     buildStickerTemplate({
        name: "arrow-176",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-176.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-176.svg",
        hash: "jn9sQ9iPETR1k3hep0hH03f74x-nWtpDsFHP3h2yor8=",
      }),
     buildStickerTemplate({
        name: "arrow-177",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-177.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-177.svg",
        hash: "9GO5x53CdMLEodGlKfjBwMHcUDMZ2KoxFrxKdy3i1DY=",
      }),
     buildStickerTemplate({
        name: "arrow-178",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-178.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-178.svg",
        hash: "PAwkZBx_VXXXPLHhPJtf4fpWbYa4YJe8iZbhsovXrB4=",
      }),
     buildStickerTemplate({
        name: "arrow-179",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-179.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-179.svg",
        hash: "SJR0JAX-p8esSoC6csYz1fRl3AXBs3VJglyf5nd8Deg=",
      }),
     buildStickerTemplate({
        name: "arrow-180",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-180.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-180.svg",
        hash: "cTLltuV1M3z6lmdrtDDx0MbHJUnKp7KVG-WanFqjxTI=",
      }),
     buildStickerTemplate({
        name: "arrow-181",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-181.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-181.svg",
        hash: "enogocPOFTCe_-q8scyRcK2E326DG_3h8YM0CvoPyuw=",
      }),
     buildStickerTemplate({
        name: "arrow-182",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-182.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-182.svg",
        hash: "iNTYzdLr4Y5sbhnjgAWgXFuf7WYB03oxzKVDfudR42k=",
      }),
     buildStickerTemplate({
        name: "arrow-183",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-183.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-183.svg",
        hash: "FuV06U5Dc6S8b8m3pp0fml_1Imi_wMfVOZEAUOM_71g=",
      }),
     buildStickerTemplate({
        name: "arrow-184",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-184.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-184.svg",
        hash: "SQdUoVHFVgchAjKVwpaLSdvrqKsi9hkJh1b3Ev85S-w=",
      }),
     buildStickerTemplate({
        name: "arrow-185",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/arrow-185.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/arrow-185.svg",
        hash: "vADqPOh_77ICtLfNIWFfI0IvORhi8GFitltmLfk1TKk=",
      }),
     buildStickerTemplate({
        name: "source",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Cover/source.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Arrows/Content/source.svg",
        hash: "jrNiKwN_bph3bSCDPhK5EkzUATynRUUxhrDvcMkDNEQ=",
      }),],
"Cheeky Piggies": [     buildStickerTemplate({
        name: "Crybaby",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Cover/Crybaby.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Content/Crybaby.svg",
        hash: "bRWBcaZveq6swjn8MwKVISsVnAr2tf4ZHTSTU-eRA5Q=",
      }),
     buildStickerTemplate({
        name: "Drool",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Cover/Drool.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Content/Drool.svg",
        hash: "BUwkYl7SHNQCypB_SvkggKwAD3XxCRUPV6dorpW_ki0=",
      }),
     buildStickerTemplate({
        name: "Fuming",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Cover/Fuming.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Content/Fuming.svg",
        hash: "Iu2DZ5PecYn6Rg7ONIzLqIVZa2v5WYnRKkMv8qTD8a8=",
      }),
     buildStickerTemplate({
        name: "Hi~",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Cover/Hi~.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Content/Hi~.svg",
        hash: "h6r0wW-eIhWUF1AkN_EnHv-q8VfpZ4NOQKKTsbU8RPc=",
      }),
     buildStickerTemplate({
        name: "Holding Tears",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Cover/Holding Tears.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Content/Holding Tears.svg",
        hash: "NnXjSqFfmw_D3Ne13JOx0yXIWtA9Exm6hggPGDgDfgc=",
      }),
     buildStickerTemplate({
        name: "Love Blows",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Cover/Love Blows.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Content/Love Blows.svg",
        hash: "Oggqz68tzBBYevbwcwXqZjb4im48-f3hh94wf8RS-Ok=",
      }),
     buildStickerTemplate({
        name: "Me_ Really_",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Cover/Me_ Really_.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Content/Me_ Really_.svg",
        hash: "W8dfy2MD-Fu2VOIPcYfHOuPNBnEIWcFg8TJJeta9iOc=",
      }),
     buildStickerTemplate({
        name: "OK",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Cover/OK.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Content/OK.svg",
        hash: "aTpuWm7bxzUevhFn_xyIz0HO5YD-I4GmdoPvmw590PY=",
      }),
     buildStickerTemplate({
        name: "Sassy Flick",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Cover/Sassy Flick.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Content/Sassy Flick.svg",
        hash: "ai5PdJq184Vxlagtbo5fo90RIvT7K0kQtKlhFF0T3h0=",
      }),
     buildStickerTemplate({
        name: "Shockwave",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Cover/Shockwave.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Content/Shockwave.svg",
        hash: "NfiIZ-FHd2XWYF8L7pp8X1M3nGTM3-005VUtCOchld8=",
      }),
     buildStickerTemplate({
        name: "Snooze Drool",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Cover/Snooze Drool.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Content/Snooze Drool.svg",
        hash: "HiRDmqZNvnKQDBX05caQF4Fg9PHh4_ZS0n_alWZcQ_M=",
      }),
     buildStickerTemplate({
        name: "Swag",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Cover/Swag.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Content/Swag.svg",
        hash: "4bEGq5-p-s6HfbtbVNwGEvEg-YEQ8wA8NA7Uj_vxTBE=",
      }),
     buildStickerTemplate({
        name: "Sweatdrop",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Cover/Sweatdrop.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Content/Sweatdrop.svg",
        hash: "6axmrPIHx4ahOGB_TtjLOPh4J6HYggLxxx0VGxnMu2E=",
      }),
     buildStickerTemplate({
        name: "Thumbs Up",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Cover/Thumbs Up.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Content/Thumbs Up.svg",
        hash: "r97GwoejPTxjumyvS9kdAnB16nZvlM81xsHo0FqdUrM=",
      }),
     buildStickerTemplate({
        name: "What_",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Cover/What_.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Cheeky%20Piggies/Content/What_.svg",
        hash: "JqWfcP9Q0kGE4wDuVZCi4lW2U7O15trpL--fdNrRJvQ=",
      }),],
"Contorted Stickers": [     buildStickerTemplate({
        name: "AFFiNE",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Cover/AFFiNE.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Content/AFFiNE.svg",
        hash: "i3piAMnoD4STQnEjTrAe_ZRdwHcD34n-sJZY8IN1blg=",
      }),
     buildStickerTemplate({
        name: "AI",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Cover/AI.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Content/AI.svg",
        hash: "VZJPB8ZBVtiZ-m04KNtlguY_t9VLx4itHILIQ3l1MRw=",
      }),
     buildStickerTemplate({
        name: "Cat",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Cover/Cat.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Content/Cat.svg",
        hash: "IS6xbnAo5WXDRxnP98UBkdOP2Zt2luQXEojcLfnfsR4=",
      }),
     buildStickerTemplate({
        name: "关闭",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Cover/Closed.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Content/Closed.svg",
        hash: "wzrJyCiyflFnyvvHdH2XONsuwbuw119wiFCekvopsmQ=",
      }),
     buildStickerTemplate({
        name: "Eyes",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Cover/Eyes.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Content/Eyes.svg",
        hash: "eT4Nbl90OC9ivTjRBmEabaWqjdmITjCgOtTJNSJu1SU=",
      }),
     buildStickerTemplate({
        name: "Fire",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Cover/Fire.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Content/Fire.svg",
        hash: "cQnt7T9qxI5-It-reeo3E4XVA3HA89L2myi1k2EJfn8=",
      }),
     buildStickerTemplate({
        name: "信息",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Cover/Info.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Content/Info.svg",
        hash: "kwKlgzVYNRk4AyOJs3Xtyt0vMWovo-7BfEqaWndDInM=",
      }),
     buildStickerTemplate({
        name: "King",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Cover/King.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Content/King.svg",
        hash: "W-RCNTaadPNEI9OALAGHqv1cGmYD1y7KxIRGLsbr-DM=",
      }),
     buildStickerTemplate({
        name: "Love Face",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Cover/Love Face.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Content/Love Face.svg",
        hash: "51B1S9eZ1rgxT-zG5npI_5l1sGss6dTVYiyut5fNPrs=",
      }),
     buildStickerTemplate({
        name: "Love",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Cover/Love.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Content/Love.svg",
        hash: "fK5Bk7hxwSEHuNQ2WfO-ysII_T20z37P1JvLf00ocUQ=",
      }),
     buildStickerTemplate({
        name: "Notice",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Cover/Notice.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Content/Notice.svg",
        hash: "RS787c3FcijjBEhKrKFa6KwB8ZINUD5MSCEMWL7F53w=",
      }),
     buildStickerTemplate({
        name: "Pin",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Cover/Pin.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Content/Pin.svg",
        hash: "HDozRCXEtlDfNFFs3sSozkvXUVAP3XXd3zQVI8aW1ak=",
      }),
     buildStickerTemplate({
        name: "Question",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Cover/Question.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Content/Question.svg",
        hash: "bvNeY3Q-At8NxFzcjTYx_mn3YnJkbUhh6XEBp3xB0Uk=",
      }),
     buildStickerTemplate({
        name: "Smile Face",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Cover/Smile Face.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Content/Smile Face.svg",
        hash: "nBVc87wjO0NnM4utzjOLxjUzFjeFcf90C0jkgrpBhrA=",
      }),
     buildStickerTemplate({
        name: "Stop",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Cover/Stop.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Contorted%20Stickers/Content/Stop.svg",
        hash: "oH6E3y8ZpdgrMGbtcSX5k3NASEkgayohDCEoO0eU7hE=",
      }),],
"Custom Stickers": [     buildStickerTemplate({
        name: "未标题-2-01",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-01.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-01.svg",
        hash: "SV1y9Z4bbJBZKk7PPaky66l-8X6Op88s73OjDE1Duy8=",
      }),
     buildStickerTemplate({
        name: "未标题-2-02",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-02.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-02.svg",
        hash: "qsTQw2hO8l91zJev67VbHMYaT04jwbyej8JQfhCQDqs=",
      }),
     buildStickerTemplate({
        name: "未标题-2-03",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-03.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-03.svg",
        hash: "5KpKyHmq-3x3kBs1Ce6AwHv2_KLun3_wvgl4ZRTi8CE=",
      }),
     buildStickerTemplate({
        name: "未标题-2-04",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-04.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-04.svg",
        hash: "Ft8cINYo0RgFEsTO_WWoJpkSZ1r2DbnDhdQgWjTxNfQ=",
      }),
     buildStickerTemplate({
        name: "未标题-2-05",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-05.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-05.svg",
        hash: "zWVbt-mnktEIvn9_ngo7G8L0Ona7duRVbN8p_Yu8GlU=",
      }),
     buildStickerTemplate({
        name: "未标题-2-06",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-06.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-06.svg",
        hash: "04wUh0btMdAO7PM1N9B05g7NFF1vkaRxfgxFC-fQsQE=",
      }),
     buildStickerTemplate({
        name: "未标题-2-07",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-07.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-07.svg",
        hash: "EDFfUf4_mGKaouQsEMnwBBkwFjSZiQiy2x_FKozlzFI=",
      }),
     buildStickerTemplate({
        name: "未标题-2-08",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-08.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-08.svg",
        hash: "Ik65TONMn4LJL6s_7h2dEjE6uzigQnEH90p1VnslPUg=",
      }),
     buildStickerTemplate({
        name: "未标题-2-09",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-09.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-09.svg",
        hash: "n77ghHzGgDED08Q8bX2bwIFka_PiUkBHbNgg3FAT_Bc=",
      }),
     buildStickerTemplate({
        name: "未标题-2-10",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-10.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-10.svg",
        hash: "ViqDFvh4_0w24Qj-E747jkHzBlf5M7GP4qRBjq71sXQ=",
      }),
     buildStickerTemplate({
        name: "未标题-2-11",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-11.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-11.svg",
        hash: "c5dd5Zj9yI40fSS6Q2-ecTzmFjySeu3bEiIhec7RBGM=",
      }),
     buildStickerTemplate({
        name: "未标题-2-12",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-12.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-12.svg",
        hash: "LQtivoonKim1u_QgiFJBDyxlbcY_UAwyy50wKVlSEvk=",
      }),
     buildStickerTemplate({
        name: "未标题-2-13",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-13.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-13.svg",
        hash: "q4NlUGpSiaQA1QN_MF4xWA_SS-fzJguoavPdsd_0PmM=",
      }),
     buildStickerTemplate({
        name: "未标题-2-14",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-14.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-14.svg",
        hash: "N66IsRFb3SXJNpoNHqr0K1L_kcsgd8DJnk58CHbUg2I=",
      }),
     buildStickerTemplate({
        name: "未标题-2-15",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-15.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-15.svg",
        hash: "oKbR0Vdc4i0Nb-3NzNpSj0Npb-vyJuopKYfm6uJBSUY=",
      }),
     buildStickerTemplate({
        name: "未标题-2-16",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-16.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-16.svg",
        hash: "sPXtpYPs4x_AsRi_-eOfGi6t_gZ8O9As_Ujq9mAJF6I=",
      }),
     buildStickerTemplate({
        name: "未标题-2-17",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-17.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-17.svg",
        hash: "nLwRWq2dDse79nsimVopk0-69-N8uGFkpRcfzSmQhLU=",
      }),
     buildStickerTemplate({
        name: "未标题-2-18",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-18.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-18.svg",
        hash: "IWENkQb0zRcjkXbBIAeVoADKJxqsuOwcP5dbT36tzKk=",
      }),
     buildStickerTemplate({
        name: "未标题-2-19",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-19.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-19.svg",
        hash: "hPkhFFMCIjxqky8L0LHAG1PamVLqw1E2-2NVnf4O6kI=",
      }),
     buildStickerTemplate({
        name: "未标题-2-20",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-20.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-20.svg",
        hash: "fE-Y6oOQPubc0F3i6cTG1u8qtIi0B3ULi4MMk_-aTpE=",
      }),
     buildStickerTemplate({
        name: "未标题-2-21",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-21.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-21.svg",
        hash: "BAawECFDxR1sWZ4Vkqvw6hD0E4jAbGLmd1ML0OWdkZs=",
      }),
     buildStickerTemplate({
        name: "未标题-2-22",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-22.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-22.svg",
        hash: "E-1lbPbBBMFfgM8YJutCS6SbUoy134Az9k0TGNZUHkQ=",
      }),
     buildStickerTemplate({
        name: "未标题-2-23",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-23.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-23.svg",
        hash: "dkPUa0PAtI-EiefV1ygVnLiPIgc5VeLURfZATKW11sU=",
      }),
     buildStickerTemplate({
        name: "未标题-2-24",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-24.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-24.svg",
        hash: "P_cnmxl_I0_olhwfDPpG4EvvO37hanZH0ilTsAF6flU=",
      }),
     buildStickerTemplate({
        name: "未标题-2-25",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-25.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-25.svg",
        hash: "L8uu1Bw4oRHCnZdjJuV-q1e0agUknCChHy3VNs0joFI=",
      }),
     buildStickerTemplate({
        name: "未标题-2-26",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-26.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-26.svg",
        hash: "msc4-GOVzl7TL23-HWvIDqDOC9yMhdHAT6phMWy8wnw=",
      }),
     buildStickerTemplate({
        name: "未标题-2-27",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-27.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-27.svg",
        hash: "CuaRuDARVzkTOCkivfw8WH8rIXz3Fbq-gVygRd4j9v8=",
      }),
     buildStickerTemplate({
        name: "未标题-2-28",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-28.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-28.svg",
        hash: "Za2AdMWNmFdS5rAo-GplyY-D8M6mvNXFBwv5ZoQjLLY=",
      }),
     buildStickerTemplate({
        name: "未标题-2-29",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-29.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-29.svg",
        hash: "b0EpJq_pyES1OMNfdYUPjkdeTgbY8MNC7NF9qcm8C4s=",
      }),
     buildStickerTemplate({
        name: "未标题-2-30",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-30.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-30.svg",
        hash: "VcV6ZL_v23a1ex9l70MUBu_M8q5p_sTb2ilRxS1Xsrw=",
      }),
     buildStickerTemplate({
        name: "未标题-2-31",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-31.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-31.svg",
        hash: "u-7Cgh2EjkoyxtB_6FHRCcip8XqBseoea7AGSpd7jJs=",
      }),
     buildStickerTemplate({
        name: "未标题-2-32",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-32.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-32.svg",
        hash: "4yGaJ9kM9BSqzWzuqHIeqoBygAO9aFqrKszEzl_WgrY=",
      }),
     buildStickerTemplate({
        name: "未标题-2-33",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-33.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-33.svg",
        hash: "QuWbBrVLRgCyD6MXKzG2RpjACxAEefvhEiuMYCr5vzw=",
      }),
     buildStickerTemplate({
        name: "未标题-2-34",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-34.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-34.svg",
        hash: "9yZ4FVzTd2FMUGIS4RHnJZ2kT1LZrKI6eFdQtdVzI24=",
      }),
     buildStickerTemplate({
        name: "未标题-2-35",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-35.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-35.svg",
        hash: "WqGnJHH8lzkq0hTNIBACqkfFBwhFf7ZKVIYKaOTjPRQ=",
      }),
     buildStickerTemplate({
        name: "未标题-2-36",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-36.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-36.svg",
        hash: "GcHgwa25RmTu8KJj6_qpEk9qYKT5NX3-O-7JfDjXt6k=",
      }),
     buildStickerTemplate({
        name: "未标题-2-37",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-37.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-37.svg",
        hash: "nwA7vKvSg5IgnBv-xDTpEslXbFXWlBpVn7KCjUmhK10=",
      }),
     buildStickerTemplate({
        name: "未标题-2-38",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-38.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-38.svg",
        hash: "fvPT6cUB-FoC5c60Q79lB914HtDzGm0dl6VReKlO0H0=",
      }),
     buildStickerTemplate({
        name: "未标题-2-39",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-39.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-39.svg",
        hash: "Msj8YJiB5Zu_dFq7MUhlK935bCiR-y2RTBbhJGe8X4g=",
      }),
     buildStickerTemplate({
        name: "未标题-2-40",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-40.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-40.svg",
        hash: "puNxV-ksw4-espP4jfmVmQRhRXibOJgyBOq_24ASqiU=",
      }),
     buildStickerTemplate({
        name: "未标题-2-41",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-41.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-41.svg",
        hash: "f_fkEEtJ7CUCzEnbLKAmldNfP73pObQBslrssBTktdc=",
      }),
     buildStickerTemplate({
        name: "未标题-2-42",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-42.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-42.svg",
        hash: "DhPDDqbYwwNuCp6YzJqrO5NjffGiBFV4iQgG8PvQNeE=",
      }),
     buildStickerTemplate({
        name: "未标题-2-43",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-43.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-43.svg",
        hash: "LJeuJrkiZyMbfn_ndQW3oIUVkcZsoj6ss1n4Qq_RyRQ=",
      }),
     buildStickerTemplate({
        name: "未标题-2-44",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-44.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-44.svg",
        hash: "UWPM2D5eZ8G1hNzYhxvK7lkJLeODULdA2IRgV1Oxm_s=",
      }),
     buildStickerTemplate({
        name: "未标题-2-45",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-45.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-45.svg",
        hash: "iYGTD52H1robBvFHEBZ1Tio3CUuJuEaZ0K7TPDFODHY=",
      }),
     buildStickerTemplate({
        name: "未标题-2-46",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-46.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-46.svg",
        hash: "JyqEI6RKyIMT15mKaBoAXXioKBdKfXtnoC4BXqBH-74=",
      }),
     buildStickerTemplate({
        name: "未标题-2-47",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-47.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-47.svg",
        hash: "TetD-u3CKtI2N3qFcE7ODKWyP_UoFzvyaucRcucWzww=",
      }),
     buildStickerTemplate({
        name: "未标题-2-48",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-48.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-48.svg",
        hash: "gvzkf4hA4uOuKY5fMSdlYxPnxjfrKHASQNxu36S--cI=",
      }),
     buildStickerTemplate({
        name: "未标题-2-49",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-49.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-49.svg",
        hash: "4PaBmrnQyc2xwYpUZ3Mq0P6WEpeEousgiEjK7iKSHvk=",
      }),
     buildStickerTemplate({
        name: "未标题-2-50",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-50.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-50.svg",
        hash: "p0VNVBmwB3uDNTpU6s1CdXLJhXQENw7yaRXRJirL4u4=",
      }),
     buildStickerTemplate({
        name: "未标题-2-51",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-51.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-51.svg",
        hash: "fx1pN6uPxS8kiq9tMohF0BMH9YveL6hDZpwr9VDIEpU=",
      }),
     buildStickerTemplate({
        name: "未标题-2-52",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-52.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-52.svg",
        hash: "zgu7lujdCnZUJqDWfi-ZrcKG88OFuEFvNVBHBpcMClo=",
      }),
     buildStickerTemplate({
        name: "未标题-2-53",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-53.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-53.svg",
        hash: "lqRxLIEvT-bytlz7pMBn3A3r-JC5QWsGQy6ns-hiduw=",
      }),
     buildStickerTemplate({
        name: "未标题-2-54",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-54.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-54.svg",
        hash: "1-nAYovb5hyfAQ4xniO6GPEYP0p0sG1ILk21wZZHKh4=",
      }),
     buildStickerTemplate({
        name: "未标题-2-55",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-55.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-55.svg",
        hash: "HCiJuXxreAqGDI8G9ROwaQYfDR5jjdGhzGSOrEJlUj0=",
      }),
     buildStickerTemplate({
        name: "未标题-2-56",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-56.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-56.svg",
        hash: "UzWBj_Thvj8rGX2UEI7lpMNxAH_7RPhuDLW1EarjLiU=",
      }),
     buildStickerTemplate({
        name: "未标题-2-57",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-57.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-57.svg",
        hash: "7lS-p3J0_VKAxMY-cXK2gk_ynJThhSOczHrWSUqpfs0=",
      }),
     buildStickerTemplate({
        name: "未标题-2-58",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-58.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-58.svg",
        hash: "Wo0stYstvbEZQFMJWZZNexQuLLMuZ0OJP7nw-X_afMM=",
      }),
     buildStickerTemplate({
        name: "未标题-2-59",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-59.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-59.svg",
        hash: "gnzpbcnasE0hn0V_lYIL6RhG_EKwhImU439gKlicEp4=",
      }),
     buildStickerTemplate({
        name: "未标题-2-60",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-60.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-60.svg",
        hash: "W5A06soW3URFxebpBrSfwi9PHfz6AX3WDvFpr8Macr0=",
      }),
     buildStickerTemplate({
        name: "未标题-2-61",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-61.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-61.svg",
        hash: "4xGqKZ3rZwSfv6CNBYSjlELU4q4OLRItvbIUvN_rsGs=",
      }),
     buildStickerTemplate({
        name: "未标题-2-62",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-62.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-62.svg",
        hash: "Wk1awU62twD4OooUdAri2-J0EScbrydTgykhtMyEEXo=",
      }),
     buildStickerTemplate({
        name: "未标题-2-63",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-63.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-63.svg",
        hash: "g-CVHBg7woqyCeH0bv5bBSM-Rr2b3QS_AhrcRfuZGN8=",
      }),
     buildStickerTemplate({
        name: "未标题-2-64",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-64.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-64.svg",
        hash: "w_IKkyuVTnwmj6YruA-waJ6P3xBRgr3fJJGWjQgqv84=",
      }),
     buildStickerTemplate({
        name: "未标题-2-65",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-65.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-65.svg",
        hash: "RaNoBPStd1DFNPVZbXC1Jdo50RtBt9LfCh5IdGKQ9J0=",
      }),
     buildStickerTemplate({
        name: "未标题-2-66",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-66.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-66.svg",
        hash: "DCaLfmOqQX3kzgUVIh--EDybfMgqT_41FEK9MPsilgk=",
      }),
     buildStickerTemplate({
        name: "未标题-2-67",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-67.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-67.svg",
        hash: "B8O9XzVizsqtUOhq1ISx4ZyfnUMng9jPHMKGXz0BLEQ=",
      }),
     buildStickerTemplate({
        name: "未标题-2-68",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-68.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-68.svg",
        hash: "1ceHs-xu4E0bLpmlEO3Sk1TRlj-2fmivX5P4xGP9eeM=",
      }),
     buildStickerTemplate({
        name: "未标题-2-69",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-69.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-69.svg",
        hash: "uinmjT939sJiN2N78qksGX7iIyGWgBa0fF0q96vrdT8=",
      }),
     buildStickerTemplate({
        name: "未标题-2-70",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-70.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-70.svg",
        hash: "u4OE0RDDWCFjKOpU3DoUOlwW_oJ3XLFFt3cIbTb4SO4=",
      }),
     buildStickerTemplate({
        name: "未标题-2-71",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-71.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-71.svg",
        hash: "JVCQYKgv_gkuedjtKK66MK7a01n_YiU5hBXquphgIo0=",
      }),
     buildStickerTemplate({
        name: "未标题-2-72",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-72.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-72.svg",
        hash: "TCABSRYnZNn2w5KzUtBsWgsIdeWiePzcPi3ZtpNikD8=",
      }),
     buildStickerTemplate({
        name: "未标题-2-76",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-76.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-76.svg",
        hash: "6ICqHrzivWe8fnUsz7f-GXnUC_sVofgV0JFgG4q7FpI=",
      }),
     buildStickerTemplate({
        name: "未标题-2-77",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-77.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-77.svg",
        hash: "WHEeqHetXbTElqx3dZClC4s4AW0Pg0zmsnGYnJeA6cc=",
      }),
     buildStickerTemplate({
        name: "未标题-2-78",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-78.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-78.svg",
        hash: "Bpnx7vrWkDvkcfZqRunbj9GddQmZgartTX68JrDnzKc=",
      }),
     buildStickerTemplate({
        name: "未标题-2-79",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-79.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-79.svg",
        hash: "3JN6Gp1ICdIQEFh0kURCBkexvOI66zSv1bZnzuqS8Sk=",
      }),
     buildStickerTemplate({
        name: "未标题-2-80",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-80.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-80.svg",
        hash: "aJULXbXIC4XJhZJqmbToK5jRuS3vGJ2yxOrPlwMSWmo=",
      }),
     buildStickerTemplate({
        name: "未标题-2-81",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-81.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-81.svg",
        hash: "Qkrv9_i1XbWVXHBvgCECp5UfRUMoKQvIOfLfTVG63VY=",
      }),
     buildStickerTemplate({
        name: "未标题-2-82",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-82.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-82.svg",
        hash: "ApqJQErNIk-aWMlY5ClLntcPY9gLgyMI0fHbNvOwQBg=",
      }),
     buildStickerTemplate({
        name: "未标题-2-83",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-83.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-83.svg",
        hash: "It1tuUWYqJrB33968gCz88F9D9l0OIwPC4CtU456sNw=",
      }),
     buildStickerTemplate({
        name: "未标题-2-84",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-84.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-84.svg",
        hash: "GfE2IWmqI5zEqITT0gBl0TQS9eWhQT0pLSVZMQFNgwo=",
      }),
     buildStickerTemplate({
        name: "未标题-2-85",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-85.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-85.svg",
        hash: "fsMGa8KVsRcfm3tpLVvwptpanBxyRjIEu5uHtT-d7ns=",
      }),
     buildStickerTemplate({
        name: "未标题-2-86",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-86.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-86.svg",
        hash: "nRUfhNwHSIMumR6a_PtLs1D9XS5KQ4n5m0vfEHpKVtE=",
      }),
     buildStickerTemplate({
        name: "未标题-2-87",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-87.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-87.svg",
        hash: "UR4FFvh0mhvSgBWQeRmsYBstroWXYZGRWNC6tLmD6uA=",
      }),
     buildStickerTemplate({
        name: "未标题-2-88",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-88.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-88.svg",
        hash: "PBAP7LEJ8npmWnEV-FkIK9aTBjPPB-WRDGlpbjYMpvc=",
      }),
     buildStickerTemplate({
        name: "未标题-2-89",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-89.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-89.svg",
        hash: "HIuZzctZ4FugEm2EcVMX6OUoHraA4xubZvoOhSuWPPI=",
      }),
     buildStickerTemplate({
        name: "未标题-2-90",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-90.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-90.svg",
        hash: "KSS0Mr0w7Nr1lgUQ0DFuUn-zK_31hvbw4uHf31lwESE=",
      }),
     buildStickerTemplate({
        name: "未标题-2-91",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-91.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-91.svg",
        hash: "BluyfvOxL_McK0nSV8w7KHOI9L1fq9In-nmhqAHNAcM=",
      }),
     buildStickerTemplate({
        name: "未标题-2-92",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-92.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-92.svg",
        hash: "qgoG5iRB0GmyAOqGkLoF_wIj-G5XZjYwRYSSzScyT4U=",
      }),
     buildStickerTemplate({
        name: "未标题-2-93",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-93.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-93.svg",
        hash: "crom_7XGwfqG2MEACD5G934EPA0LWKrFDHi_6xhRj8k=",
      }),
     buildStickerTemplate({
        name: "未标题-2-94",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-94.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-94.svg",
        hash: "twsYVqaR589CPvKx9LoAUSeY3MT1UVkD2z1_YL9NAv8=",
      }),
     buildStickerTemplate({
        name: "未标题-2-95",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-95.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-95.svg",
        hash: "th9N4qz6LZHgiVI6PUI2X67ASMGHTxLbb8ie9q6SjJg=",
      }),
     buildStickerTemplate({
        name: "未标题-2-96",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-96.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-96.svg",
        hash: "SOeH_uEU51RYAc5CwtcOjYLWUfgusF1a_e2DytxDcSs=",
      }),
     buildStickerTemplate({
        name: "未标题-2-97",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-97.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-97.svg",
        hash: "YP4RJVXeXbtWWiG-7VJaazwGvFOzeI7i_og3J15iD5M=",
      }),
     buildStickerTemplate({
        name: "未标题-2-98",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-98.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-98.svg",
        hash: "lHfkrE2_ULmok4mYXGIhD808ba7CdmLvUOsGF61lkAQ=",
      }),
     buildStickerTemplate({
        name: "未标题-2-100",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-100.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-100.svg",
        hash: "tWT-PxHmSfI0H4SggNFJzzhin_vKrOSYEFxj_Mv6PoA=",
      }),
     buildStickerTemplate({
        name: "未标题-2-101",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-101.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-101.svg",
        hash: "CSiqbp9FP8R9SoQEbD4243rCSYIHEws8Foh6aY0iel0=",
      }),
     buildStickerTemplate({
        name: "未标题-2-102",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-102.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-102.svg",
        hash: "BKqisSkLY3xv8GLQe56cEmPAytTgUPlDstwpop4eN0k=",
      }),
     buildStickerTemplate({
        name: "未标题-2-104",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-104.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-104.svg",
        hash: "FUUXWVN8lMplYoP4Ybc-nePpZ_fmcsNpXqckDgScYkg=",
      }),
     buildStickerTemplate({
        name: "未标题-2-105",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-105.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-105.svg",
        hash: "pBnm2sd3A0IKw495BMhSG_OvEBpK-mz4pXAczlLNpJg=",
      }),
     buildStickerTemplate({
        name: "未标题-2-106",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-106.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-106.svg",
        hash: "s3lHn-kPSI0fPsINlz6g5MNt8QZUH9gTg1DYOy3iOdY=",
      }),
     buildStickerTemplate({
        name: "未标题-2-107",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-107.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-107.svg",
        hash: "9PMd03Ou7N1lYKuF4wSQQXtVVX_bacwOel7xODmih58=",
      }),
     buildStickerTemplate({
        name: "未标题-2-108",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-108.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-108.svg",
        hash: "O3bl431EOQbOyv_VCAeHloHdl4aCOBNvpX9oILwjaQ4=",
      }),
     buildStickerTemplate({
        name: "未标题-2-109",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-109.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-109.svg",
        hash: "RFei5BWEXS2QzMmd9tv07yAwnPLatoAo0Kjut8hNhhM=",
      }),
     buildStickerTemplate({
        name: "未标题-2-110",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-110.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-110.svg",
        hash: "mTwDMh1Ajlpp_RCTnLnyO7IEMem260cVhapRW5tu9gs=",
      }),
     buildStickerTemplate({
        name: "未标题-2-111",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-111.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-111.svg",
        hash: "E7UyAMC3iVu1gtjDmUv3M9yskre5VzhAPf8az5SJQTI=",
      }),
     buildStickerTemplate({
        name: "未标题-2-112",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-112.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-112.svg",
        hash: "IIgvR_PopD1Wk9HYrwO03CcerLiOYtyaNTQnoRSrTsg=",
      }),
     buildStickerTemplate({
        name: "未标题-2-113",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-113.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-113.svg",
        hash: "ABralC8Cip4jTgjVshyCDZe46Fgn_N_YB1IWwGE_rb4=",
      }),
     buildStickerTemplate({
        name: "未标题-2-114",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-114.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-114.svg",
        hash: "nplDbz-pfQIhbmaR9wK96xr3IFGvKWbWrXvVaQF733Y=",
      }),
     buildStickerTemplate({
        name: "未标题-2-115",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-115.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-115.svg",
        hash: "AeIn9rxe17bw7dlruHCNC650snVpmm5O4G22ArJBZoM=",
      }),
     buildStickerTemplate({
        name: "未标题-2-116",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-116.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-116.svg",
        hash: "s8tVuMFkQTh_F8F3_F1zZt66Z7nQPoSvzemXgmmvmmk=",
      }),
     buildStickerTemplate({
        name: "未标题-2-117",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-117.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-117.svg",
        hash: "lQzdbHpiV097SILAznJ1Zr3j9zXn4sr3c2fZ307ZgPE=",
      }),
     buildStickerTemplate({
        name: "未标题-2-118",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-118.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-118.svg",
        hash: "vM3CaMl_FRs_uTMu8fn_aUPMselWspi06_p5NUY6zBk=",
      }),
     buildStickerTemplate({
        name: "未标题-2-119",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-119.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-119.svg",
        hash: "32nQmKQlFJ7DiXt-XyDsiGEMjpY8aaN20hK0gS2wa2U=",
      }),
     buildStickerTemplate({
        name: "未标题-2-120",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-120.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-120.svg",
        hash: "Tn5cMmXh-r_tD9LBacas3b9Y5thZr_SVCYba2fq1pVY=",
      }),
     buildStickerTemplate({
        name: "未标题-2-121",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-121.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-121.svg",
        hash: "t3MFyHz8gOyyH_y8sS11xi7QTRaPcckA1ZgDe5HGuec=",
      }),
     buildStickerTemplate({
        name: "未标题-2-122",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-122.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-122.svg",
        hash: "5MuwhV4PyWMNREZjtxtsm37X_CEkPLtV-DQpMgB6qyM=",
      }),
     buildStickerTemplate({
        name: "未标题-2-123",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-123.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-123.svg",
        hash: "mjwGB6ma0D6uHvk4xJnp-pCoUszLmO89ASJFrbkCSv0=",
      }),
     buildStickerTemplate({
        name: "未标题-2-124",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-124.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-124.svg",
        hash: "O7gfhERrKQZCqUEZkJ0DEWPq1c5cxbqDtU7qUTHVmw8=",
      }),
     buildStickerTemplate({
        name: "未标题-2-125",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-125.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-125.svg",
        hash: "AtpcSu4QoxeG2NHWJmIejK9npM9ib9uWwGr19WICINQ=",
      }),
     buildStickerTemplate({
        name: "未标题-2-126",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-126.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-126.svg",
        hash: "fVnfS23VrnMPYJXSGijQ7WWcDN5zK6kQ3gv0HwNq1h8=",
      }),
     buildStickerTemplate({
        name: "未标题-2-127",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-127.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-127.svg",
        hash: "OxCVjOmq-K4dQRcfkw8FaUpJqmPflKHd5f40xcWCelE=",
      }),
     buildStickerTemplate({
        name: "未标题-2-129",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-129.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-129.svg",
        hash: "I1M-jcJFJPsHLKANpDK85xmVetw_N_eZH2FV8sFUSAs=",
      }),
     buildStickerTemplate({
        name: "未标题-2-130",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-130.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-130.svg",
        hash: "ys4s6pCS5vH5jIbyee0-KciTCMXBySwmS31N0DcWj30=",
      }),
     buildStickerTemplate({
        name: "未标题-2-131",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-131.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-131.svg",
        hash: "4L3lI-k1j_iDB7PeWTOjk5iWMvhNGMqYWOoeehYuJIU=",
      }),
     buildStickerTemplate({
        name: "未标题-2-132",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Cover/未标题-2-132.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Custom%20Stickers/Content/未标题-2-132.svg",
        hash: "2YtFuaG45YyfnK_8nxX4vNn6ktHdOBgOBjX1fH6NR58=",
      }),],
"Paper": [     buildStickerTemplate({
        name: "+1",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Cover/+1.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Content/+1.svg",
        hash: "FEF1FPZ9H1lIO54e6gP5RlNNZqukz3ADuzPFgog5qH4=",
      }),
     buildStickerTemplate({
        name: "A lot of question",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Cover/A lot of question.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Content/A lot of question.svg",
        hash: "yKPa7vqOxC6rh-e0SVdlp0RwMWQ9mzDKTtE5g2UnHGk=",
      }),
     buildStickerTemplate({
        name: "AFFiNE AI",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Cover/AFFiNE AI.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Content/AFFiNE AI.svg",
        hash: "FwBs2WApEGkiFmu1XR4fHZ_7fOlSsSBdYEyGs2lDeLk=",
      }),
     buildStickerTemplate({
        name: "Arrow",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Cover/Arrow.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Content/Arrow.svg",
        hash: "evuSkommPr7PBAWCioYDRQpKPZGoY6izIGev2C8Xdt0=",
      }),
     buildStickerTemplate({
        name: "Atention",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Cover/Atention.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Content/Atention.svg",
        hash: "Lmvftjmkw5oQEyZ2VP6eTohbXgQyEtNWKkrg9AbDknI=",
      }),
     buildStickerTemplate({
        name: "Blue Screen",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Cover/Blue Screen.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Content/Blue Screen.svg",
        hash: "30OHymd5x-3zr_5KxQm3DzVfxyWWAf0QnmfHpIOoLzQ=",
      }),
     buildStickerTemplate({
        name: "Boom",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Cover/Boom.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Content/Boom.svg",
        hash: "mpTlbN8fJWJUMlHcCCrQuzKTK844-F9YuebgR0kgJa8=",
      }),
     buildStickerTemplate({
        name: "Cool",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Cover/Cool.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Content/Cool.svg",
        hash: "3OujPx_YOY1MTqmgrbWaNDJlJeoLNvTWw96gW22rxps=",
      }),
     buildStickerTemplate({
        name: "Dino",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Cover/Dino.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Content/Dino.svg",
        hash: "j13ZqHGUnVdGW3_1uWw_sFYeHj1SFoNsi5JwrTvpC-k=",
      }),
     buildStickerTemplate({
        name: "Histogram",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Cover/Histogram.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Content/Histogram.svg",
        hash: "A1oGPUmv-Ypb-W7_jPgpSsVGA71J8njyr9f-97UnJQg=",
      }),
     buildStickerTemplate({
        name: "Local First",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Cover/Local First.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Content/Local First.svg",
        hash: "LFIRZK4TswzJvThRO2Vch_aqfY2UZ6kjAyAEsQS-hHM=",
      }),
     buildStickerTemplate({
        name: "Medal",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Cover/Medal.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Content/Medal.svg",
        hash: "cMIe6PYQLi0s9ryW3fbiXA9ACs3YsQFDtKjlfliXTC8=",
      }),
     buildStickerTemplate({
        name: "Notice",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Cover/Notice.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Content/Notice.svg",
        hash: "oafBAmM8MB094GI9I4U2iG6TWoZpCoa4nDmGY2eH_Kw=",
      }),
     buildStickerTemplate({
        name: "Pin",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Cover/Pin.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Content/Pin.svg",
        hash: "kEy0pTA3dsClFtIwaJJV9NZQvn2xib-biyFJvRp9tzM=",
      }),
     buildStickerTemplate({
        name: "Star",
        coverUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Cover/Star.svg",
        contentUrl: "https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/Paper/Content/Star.svg",
        hash: "Au-JbxT7XZvvDueaVg37tJ4kyH9vLxiC7tLgcbrZV48=",
      }),],
}

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
        console.warn('资源预加载失败 for', template.name, err);
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
        console.warn('资源预加载失败 for', template.name, err);
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
          console.error('CDN资源加载失败:', assetUrl, error);
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
        console.error('通过getAsset方法获取资源失败:', assetId, error);
        return null;
      }
    }
    
    return null;
  },

  // 新增：批量预加载所有常用分类
  async preloadCommonCategories() {
    const commonCategories = ['Arrows', 'AI Complex', '自定义贴纸'];
    const preloadPromises = commonCategories.map(category => 
      this.preloadCovers(category).catch(err => {
        console.warn('分类预加载失败', category, err);
      })
    );
    await Promise.allSettled(preloadPromises);
  },
}

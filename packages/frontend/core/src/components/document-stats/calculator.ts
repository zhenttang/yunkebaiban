import type { Doc } from '@toeverything/infra';

export interface DocumentStats {
  chars: number;              // 总字符数
  charsNoSpaces: number;      // 不含空格字符数
  words: number;              // 总词数
  chineseChars: number;       // 中文字符数
  englishWords: number;       // 英文单词数
  paragraphs: number;         // 段落数
  headings: number;           // 标题数
  readingTime: {
    minutes: number;
    formatted: string;        // "约 5 分钟"
  };
}

/**
 * 统计中文字符数
 */
function countChineseChars(text: string): number {
  const matches = text.match(/[\u4e00-\u9fa5]/g);
  return matches ? matches.length : 0;
}

/**
 * 统计英文单词数
 */
function countEnglishWords(text: string): number {
  const matches = text.match(/[a-zA-Z]+/g);
  return matches ? matches.length : 0;
}

/**
 * 计算阅读时间
 * 中文: 300字/分钟
 * 英文: 200词/分钟
 */
function calculateReadingTime(
  chineseChars: number,
  englishWords: number
): { minutes: number; formatted: string } {
  const chineseMinutes = chineseChars / 300;
  const englishMinutes = englishWords / 200;
  const totalMinutes = Math.ceil(chineseMinutes + englishMinutes);

  return {
    minutes: totalMinutes,
    formatted: totalMinutes > 0 ? `约 ${totalMinutes} 分钟` : '少于 1 分钟',
  };
}

/**
 * 计算文档统计信息
 */
export function calculateDocumentStats(doc: Doc): DocumentStats {
  let chars = 0;
  let charsNoSpaces = 0;
  let chineseChars = 0;
  let englishWords = 0;
  let paragraphs = 0;
  let headings = 0;

  try {
    // 获取文档的所有块
    const blockSuiteDoc = doc.blockSuiteDoc;

    if (!blockSuiteDoc || !blockSuiteDoc.blocks) {
      return createEmptyStats();
    }

    // 遍历所有块
    for (const block of Object.values(blockSuiteDoc.blocks.value || {})) {
      // 检查块是否有 model 属性
      if (!block || typeof block !== 'object' || !('model' in block)) {
        continue;
      }

      const model = (block as any).model;
      if (!model || typeof model !== 'object') {
        continue;
      }

      // 检查 model 是否有 text 属性
      if ('text' in model) {
        const text = model.text;
        if (text && text.yText && typeof text.yText.toString === 'function') {
          const textContent = text.yText.toString();

          // 统计字符数
          chars += textContent.length;
          charsNoSpaces += textContent.replace(/\s/g, '').length;

          // 统计中文字符和英文单词
          chineseChars += countChineseChars(textContent);
          englishWords += countEnglishWords(textContent);
        }
      }

      // 统计段落数和标题数
      if ('flavour' in model) {
        const flavour = model.flavour as string;

        if (flavour === 'yunke:paragraph') {
          paragraphs++;
        } else if (flavour && flavour.match(/^yunke:h[1-6]$/)) {
          headings++;
        }
      }
    }
  } catch (error) {
    console.error('Failed to calculate document stats:', error);
    return createEmptyStats();
  }

  // 计算总词数 (中文按字符，英文按单词)
  const words = chineseChars + englishWords;

  // 计算阅读时间
  const readingTime = calculateReadingTime(chineseChars, englishWords);

  return {
    chars,
    charsNoSpaces,
    words,
    chineseChars,
    englishWords,
    paragraphs,
    headings,
    readingTime,
  };
}

/**
 * 创建空的统计数据
 */
function createEmptyStats(): DocumentStats {
  return {
    chars: 0,
    charsNoSpaces: 0,
    words: 0,
    chineseChars: 0,
    englishWords: 0,
    paragraphs: 0,
    headings: 0,
    readingTime: {
      minutes: 0,
      formatted: '少于 1 分钟',
    },
  };
}

/**
 * 格式化数字（添加千位分隔符）
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

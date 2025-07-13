// 从已生成的CDN模板文件中提取元数据
import fs from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = join(fileURLToPath(import.meta.url), '..');

async function extractMetadataFromCDN() {
  try {
    console.log('📊 从CDN模板文件提取元数据...');
    
    // 读取已生成的CDN模板文件
    const cdnTemplateContent = await fs.readFile(
      join(__dirname, 'stickers-templates-cdn.gen.ts'), 
      'utf-8'
    );
    
    // 提取模板定义部分
    const templatesMatch = cdnTemplateContent.match(/const templates = \{([\s\S]*?)\}/);
    if (!templatesMatch) {
      throw new Error('无法找到templates定义');
    }
    
    // 解析模板数据
    const metadata = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      cdnBaseUrl: 'https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/stickers',
      categories: {}
    };
    
    // 提取每个分类的数据
    const categoryMatches = cdnTemplateContent.matchAll(/\"([^"]+)\": \[\s*([\s\S]*?)\]/g);
    
    for (const match of categoryMatches) {
      const categoryName = match[1];
      const categoryContent = match[2];
      
      console.log(`处理分类: ${categoryName}`);
      
      // 提取该分类下的贴纸数据
      const stickerMatches = categoryContent.matchAll(/buildStickerTemplate\(\{\s*name: "([^"]+)",\s*coverUrl: "([^"]+)",\s*contentUrl: "([^"]+)",\s*hash: "([^"]+)",\s*\}\)/g);
      
      metadata.categories[categoryName] = [];
      
      for (const stickerMatch of stickerMatches) {
        const [, name, coverUrl, contentUrl, hash] = stickerMatch;
        
        metadata.categories[categoryName].push({
          name,
          hash,
          coverUrl,
          contentUrl,
          filename: name + '.svg'
        });
      }
      
      console.log(`  ✅ 找到 ${metadata.categories[categoryName].length} 个贴纸`);
    }
    
    // 写入元数据文件
    await fs.writeFile(
      join(__dirname, 'stickers-metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );
    
    // 统计信息
    const totalStickers = Object.values(metadata.categories).reduce((sum, stickers) => sum + stickers.length, 0);
    const totalCategories = Object.keys(metadata.categories).length;
    
    console.log('\n🎉 元数据生成完成!');
    console.log(`📊 统计信息:`);
    console.log(`- 总分类数: ${totalCategories}`);
    console.log(`- 总贴纸数: ${totalStickers}`);
    console.log(`- 元数据文件: stickers-metadata.json`);
    
    return metadata;
    
  } catch (error) {
    console.error('❌ 生成元数据失败:', error);
    throw error;
  }
}

// 运行提取
extractMetadataFromCDN(); 
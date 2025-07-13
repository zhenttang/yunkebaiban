// 测试CDN版本的贴纸模板
import { builtInTemplates } from './stickers-templates-cdn.gen.js';

async function testCDNTemplates() {
  try {
    console.log('🧪 测试CDN贴纸模板...');
    
    // 测试1: 获取分类列表
    console.log('\n📋 测试1: 获取分类列表');
    const categories = await builtInTemplates.categories();
    console.log(`✅ 找到 ${categories.length} 个分类:`, categories);
    
    // 测试2: 获取指定分类的模板列表
    console.log('\n📦 测试2: 获取"Custom Stickers"分类的模板');
    const customStickers = await builtInTemplates.list('Custom Stickers');
    console.log(`✅ 找到 ${customStickers.length} 个自定义贴纸`);
    
    if (customStickers.length > 0) {
      const firstSticker = customStickers[0];
      console.log(`   第一个贴纸: ${firstSticker.name}`);
      console.log(`   预览URL: ${firstSticker.preview}`);
      console.log(`   资源数量: ${Object.keys(firstSticker.assets).length}`);
    }
    
    // 测试3: 搜索功能
    console.log('\n🔍 测试3: 搜索功能');
    const searchResults = await builtInTemplates.search('arrow');
    console.log(`✅ 搜索"arrow"找到 ${searchResults.length} 个结果`);
    
    // 测试4: 预加载封面
    console.log('\n⚡ 测试4: 预加载封面图片');
    try {
      await builtInTemplates.preloadCovers('AI Complex');
      console.log('✅ AI Complex分类封面预加载成功');
    } catch (error) {
      console.log('❌ 预加载失败:', error.message);
    }
    
    // 测试5: 资源解析
    console.log('\n🔧 测试5: 资源解析');
    if (customStickers.length > 0) {
      const testTemplate = customStickers[0];
      const assetKeys = Object.keys(testTemplate.assets);
      if (assetKeys.length > 0) {
        try {
          const assetContent = await builtInTemplates.resolveAsset(testTemplate, assetKeys[0]);
          if (assetContent && assetContent.length > 0) {
            console.log(`✅ 成功加载资源，大小: ${assetContent.length} 字符`);
            console.log(`   内容预览: ${assetContent.substring(0, 100)}...`);
          } else {
            console.log('❌ 资源内容为空');
          }
        } catch (error) {
          console.log('❌ 资源解析失败:', error.message);
        }
      }
    }
    
    console.log('\n🎉 CDN模板测试完成!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testCDNTemplates(); 
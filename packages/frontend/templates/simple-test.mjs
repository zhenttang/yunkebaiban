// 简单测试CDN URL访问性
console.log('🧪 测试CDN URL访问性...');

const testUrls = [
  'https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/stickers/AI%20Complex/Cover/ai-complex-1.svg',
  'https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/stickers/Custom%20Stickers/Cover/未标题-2-01.svg',
  'https://yckeji0316-1312042802.cos.ap-beijing.myqcloud.com/localFile/stickers/stickers/Arrows/Cover/arrow-1.svg'
];

async function testUrl(url) {
  try {
    console.log(`🔗 测试: ${url}`);
    const response = await fetch(url);
    if (response.ok) {
      const content = await response.text();
      console.log(`✅ 成功! 状态: ${response.status}, 大小: ${content.length} 字符`);
      console.log(`   内容预览: ${content.substring(0, 100)}...`);
      return true;
    } else {
      console.log(`❌ 失败! 状态: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('开始测试CDN URL...\n');
  
  for (const url of testUrls) {
    await testUrl(url);
    console.log('');
  }
  
  console.log('🎉 测试完成!');
}

runTests(); 
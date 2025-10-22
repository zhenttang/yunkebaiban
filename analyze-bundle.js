#!/usr/bin/env node

/**
 * 🔥 Webpack Bundle 分析脚本
 * 使用 webpack-bundle-analyzer 分析打包产物
 * 
 * 使用方法:
 *   1. 先构建生产版本: yarn build
 *   2. 运行分析: node analyze-bundle.js
 */

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const webpack = require('webpack');
const { BundleCommand } = require('./tools/cli/dist/bundle.js');
const { Package } = require('./tools/cli/dist/context.js');

async function analyzeBundles() {
  console.log('🔍 开始分析 Webpack Bundle...\n');
  
  const pkg = new Package('@yunke/web');
  
  // 设置环境变量
  process.env.NODE_ENV = 'production';
  process.env.ANALYZE = 'true';
  
  try {
    console.log('📦 正在构建并生成分析报告...');
    console.log('⏳ 这可能需要几分钟时间...\n');
    
    // 调用构建命令
    await BundleCommand.build(pkg);
    
    console.log('\n✅ 分析完成！');
    console.log('📊 浏览器将自动打开分析报告');
    console.log('💡 重点关注:');
    console.log('   - 哪些包占用空间最大');
    console.log('   - 是否有重复依赖');
    console.log('   - 是否有不必要的大型依赖');
    console.log('\n建议优化方向:');
    console.log('   1. 使用动态导入拆分大型模块');
    console.log('   2. 检查是否可以用轻量级替代品');
    console.log('   3. 确保tree-shaking正常工作');
    
  } catch (error) {
    console.error('❌ 分析失败:', error);
    process.exit(1);
  }
}

// 运行分析
analyzeBundles();


// 设置腾讯云COS的CORS配置
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

async function setupCORS() {
  try {
    console.log('🔧 正在配置腾讯云COS的CORS规则...');
    
    // 加载COS SDK
    const COS = require('../../../node_modules/cos-nodejs-sdk-v5');
    
    // ⚠️ 请使用环境变量或从配置文件读取，不要硬编码密钥
    const cos = new COS({
      SecretId: process.env.COS_SECRET_ID || 'YOUR_SECRET_ID',
      SecretKey: process.env.COS_SECRET_KEY || 'YOUR_SECRET_KEY',
    });

    const corsConfig = {
      Bucket: 'yckeji0316-1312042802',
      Region: 'ap-beijing',
      CORSConfiguration: {
        CORSRules: [
          {
            ID: 'allow-all-origins',
            AllowedOrigin: ['*'],
            AllowedMethod: ['GET', 'HEAD', 'OPTIONS'],
            AllowedHeader: ['*'],
            ExposeHeader: ['*'],
            MaxAgeSeconds: 600
          }
        ]
      }
    };

    // 设置CORS配置
    cos.putBucketCors(corsConfig, function(err, data) {
      if (err) {
        console.error('❌ CORS配置失败:', err.message);
        console.log('');
        console.log('📋 手动配置步骤:');
        console.log('1. 登录腾讯云控制台: https://console.cloud.tencent.com/cos');
        console.log('2. 选择存储桶: yckeji0316-1312042802');
        console.log('3. 点击"安全管理" → "跨域访问CORS"');
        console.log('4. 点击"新增规则"并配置:');
        console.log('   - 来源Origin: *');
        console.log('   - 允许的方法: GET, HEAD, OPTIONS');
        console.log('   - 允许的Header: *');
        console.log('   - 暴露的Header: *');
        console.log('   - Max Age: 600');
      } else {
        console.log('✅ CORS配置成功!');
        console.log('📋 配置详情:');
        console.log('- 允许的来源: 所有域名 (*)');
        console.log('- 允许的方法: GET, HEAD, OPTIONS');
        console.log('- 允许的Headers: 所有 (*)');
        console.log('- 缓存时间: 600秒');
        console.log('');
        console.log('🎉 现在您可以重新刷新浏览器测试贴纸加载了！');
      }
    });

  } catch (error) {
    console.error('❌ 脚本执行失败:', error.message);
  }
}

setupCORS(); 
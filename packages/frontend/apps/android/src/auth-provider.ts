import type { Framework } from '@toeverything/infra';
import { Capacitor } from '@capacitor/core';

import { AuthProvider, ServerScope, ServerService } from '@affine/core/modules/cloud';
import { Auth } from './plugins/auth';

export function configureAndroidAuthProvider(framework: Framework) {
  framework.scope(ServerScope).override(AuthProvider, resolver => {
    const serverService = resolver.get(ServerService);
    
    console.log('=== 🔐 Android AuthProvider配置调试 ===');
    console.log('ServerService:', !!serverService);
    console.log('Server对象:', serverService.server);
    console.log('Server.baseUrl:', serverService.server?.baseUrl);
    console.log('Server.serverMetadata:', serverService.server?.serverMetadata);
    console.log('Server.serverMetadata.baseUrl:', serverService.server?.serverMetadata?.baseUrl);
    
    return {
      async signInMagicLink(
        email: string,
        token: string,
        clientNonce?: string
      ) {
        console.log('=== Android AuthProvider.signInMagicLink 开始 ===');
        console.log('使用Capacitor插件进行Magic Link登录');
        
        // 优先使用baseUrl，如果不存在则使用serverMetadata.baseUrl
        const endpoint = serverService.server?.baseUrl || serverService.server?.serverMetadata?.baseUrl;
        console.log('使用的endpoint:', endpoint);
        
        const result = await Auth.signInMagicLink({
          endpoint,
          email,
          token,
          clientNonce
        });
        
        console.log('=== Android AuthProvider.signInMagicLink 完成 ===');
        console.log('插件返回结果:', result);
        
        // AuthPlugin现在返回完整的数据结构
        return {
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken
        };
      },

      async signInOauth(
        code: string,
        state: string,
        provider: string,
        clientNonce?: string
      ) {
        const endpoint = serverService.server?.baseUrl || serverService.server?.serverMetadata?.baseUrl;
        console.log('OAuth endpoint:', endpoint);
        
        const result = await Auth.signInOauth({
          endpoint,
          code,
          state,
          clientNonce
        });
        
        return { redirectUri: undefined }; // OAuth在移动端不需要重定向
      },
      
      async signInWithCode(credential: {
        email: string;
        code: string;
      }) {
        console.log('=== Android AuthProvider.signInWithCode 开始 ===');
        
        // Android环境下，验证码登录可能需要通过HTTP API
        // 因为AuthPlugin可能没有实现这个方法
        // 这里先抛出错误，提示需要实现
        throw new Error('验证码登录在Android环境下暂未实现');
      },

      async signInPassword(credential: {
        email: string;
        password: string;
        verifyToken?: string;
        challenge?: string;
      }) {
        console.log('=== Android AuthProvider.signInPassword 开始 ===');
        
        const endpoint = serverService.server?.baseUrl || serverService.server?.serverMetadata?.baseUrl;
        console.log('Password登录endpoint:', endpoint);
        
        const result = await Auth.signInPassword({
          endpoint,
          email: credential.email,
          password: credential.password,
          verifyToken: credential.verifyToken,
          challenge: credential.challenge
        });
        
        console.log('=== Android AuthProvider.signInPassword 完成 ===');
        
        return {
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken
        };
      },
      
      async signOut() {
        const endpoint = serverService.server?.baseUrl || serverService.server?.serverMetadata?.baseUrl;
        console.log('SignOut endpoint:', endpoint);
        
        await Auth.signOut({
          endpoint
        });
      },
    };
  });
}
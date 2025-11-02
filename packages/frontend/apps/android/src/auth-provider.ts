import type { Framework } from '@toeverything/infra';
import { AuthProvider } from '@yunke/core/modules/cloud';
import { ServerScope } from '@yunke/core/modules/cloud';
import { FetchService } from '@yunke/core/modules/cloud/services/fetch';

// 统一与 Web 行为：Android 不再使用原生插件，改用 FetchService 直接访问 REST API
// 保持合理的超时预算（10s）
export function configureAndroidAuthProvider(framework: Framework) {
  framework.scope(ServerScope).override(AuthProvider, resolver => {
    const fetchService = resolver.get(FetchService);

    return {
      async signInMagicLink(email: string, token: string, clientNonce?: string) {
        console.log('🔵 AUTH_PROVIDER_STEP1: [signInMagicLink] 开始执行');
        console.log('🔵 AUTH_PROVIDER_STEP1: [signInMagicLink] 参数:', { email, hasToken: !!token, hasClientNonce: !!clientNonce });
        
        const body = JSON.stringify({ email, token, clientNonce });
        console.log('🔵 AUTH_PROVIDER_STEP2: [signInMagicLink] 准备调用 fetchService.fetch');
        console.log('🔵 AUTH_PROVIDER_STEP2: [signInMagicLink] fetchService 类型:', typeof fetchService);
        console.log('🔵 AUTH_PROVIDER_STEP2: [signInMagicLink] fetchService.fetch 类型:', typeof fetchService.fetch);
        
        console.log('🔵 AUTH_STEP1: [signInMagicLink] 准备发送请求', { email, hasToken: !!token });
        
        try {
          const res = await fetchService.fetch('/api/auth/magic-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            timeout: 10000,
          });
          
          console.log('✅ AUTH_PROVIDER_STEP3: [signInMagicLink] fetchService.fetch 返回 Response');
          console.log('✅ AUTH_STEP2: [signInMagicLink] fetch 完成，准备解析 JSON', {
            status: res.status,
            ok: res.ok,
            contentType: res.headers.get('Content-Type')
          });
          
          const data = await res.json();
          
          console.log('✅ AUTH_PROVIDER_STEP4: [signInMagicLink] res.json() 解析完成');
          console.log('✅ AUTH_STEP3: [signInMagicLink] JSON 解析完成', {
            hasData: !!data,
            success: data?.success,
            hasUser: !!data?.user,
            hasToken: !!data?.token
          });
          
          if (!data?.success) throw new Error(data?.error || 'Magic link sign in failed');
          
          console.log('✅ AUTH_PROVIDER_STEP5: [signInMagicLink] 准备返回结果');
          console.log('✅ AUTH_STEP4: [signInMagicLink] 登录成功，返回结果');
          return { user: data.user, token: data.token, refreshToken: data.refreshToken };
        } catch (error: any) {
          console.error('❌ AUTH_PROVIDER_ERROR: [signInMagicLink] 执行失败', {
            error: error.message,
            errorType: error.name,
            stack: error.stack?.substring(0, 500)
          });
          throw error;
        }
      },

      async signInPassword(credential: { email: string; password: string; verifyToken?: string; challenge?: string }) {
        const body = JSON.stringify({
          email: credential.email,
          password: credential.password,
          callbackUrl: null,
          clientNonce: null,
        });
        const res = await fetchService.fetch('/api/auth/sign-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          timeout: 10000,
        });
        const data = await res.json();
        if (!data?.success) throw new Error(data?.error || 'Password sign in failed');
        return { user: data.user, token: data.token, refreshToken: data.refreshToken };
      },

      async signInOauth(code: string, state: string, provider: string, clientNonce?: string) {
        const body = JSON.stringify({ code, state, provider, clientNonce });
        const res = await fetchService.fetch('/api/oauth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          timeout: 10000,
        });
        const data = await res.json();
        if (!data?.success) throw new Error(data?.error || 'OAuth sign in failed');
        return { redirectUri: data.redirectUri };
      },

      async signOut() {
        await fetchService.fetch('/api/auth/sign-out', { method: 'GET', timeout: 10000 });
      },
    };
  });
}

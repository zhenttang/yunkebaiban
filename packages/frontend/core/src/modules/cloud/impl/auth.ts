import type { Framework } from '@toeverything/infra';

import { AuthProvider } from '../provider/auth';
import { ServerScope } from '../scopes/server';
import { FetchService } from '../services/fetch';

export function configureDefaultAuthProvider(framework: Framework) {
  framework.scope(ServerScope).override(AuthProvider, resolver => {
    const fetchService = resolver.get(FetchService);
    return {
      async signInMagicLink(
        email: string,
        token: string,
        clientNonce?: string
      ) {
        const res = await fetchService.fetch('/api/auth/magic-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email, 
            token, 
            clientNonce: clientNonce 
          }),
        });
        
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Magic link sign in failed');
        }
      },

      async signInOauth(
        code: string,
        state: string,
        provider: string,
        clientNonce?: string
      ) {
        // 注意：Java后端可能需要实现OAuth回调端点
        // 这里暂时保持原有逻辑，但可能需要根据后端实际实现调整
        const res = await fetchService.fetch('/api/oauth/callback', {
          method: 'POST',
          body: JSON.stringify({ 
            code, 
            state, 
            provider,
            clientNonce: clientNonce 
          }),
          headers: {
            'content-type': 'application/json',
          },
        });
        
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'OAuth sign in failed');
        }
        
        return { redirectUri: data.redirectUri };
      },
      
      async signInPassword(credential: {
        email: string;
        password: string;
        verifyToken?: string;
        challenge?: string;
      }) {
        const res = await fetchService.fetch('/api/auth/sign-in', {
          method: 'POST',
          body: JSON.stringify({
            email: credential.email,
            password: credential.password,
            callbackUrl: null, // Java后端期望的字段
            clientNonce: null  // Java后端期望的字段
          }),
          headers: {
            'content-type': 'application/json',
          },
        });
        
        console.log('Login response status:', res.status);
        console.log('Login response headers:', res.headers);
        
        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            // 如果无法解析JSON，使用状态文本
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        let data;
        try {
          const responseText = await res.text();
          console.log('Login response text:', responseText);
          
          if (!responseText.trim()) {
            throw new Error('Empty response from server');
          }
          
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse login response:', e);
          throw new Error('Invalid response format from server');
        }
        
        if (!data.success) {
          throw new Error(data.error || 'Password sign in failed');
        }
        
        // 登录成功后，返回用户信息以便前端存储
        return data.user;
      },
      
      async sendVerificationCode(email: string) {
        const res = await fetchService.fetch('/api/auth/send-verification-code', {
          method: 'POST',
          body: JSON.stringify({ email }),
          headers: {
            'content-type': 'application/json',
          },
        });

        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to send verification code');
        }

        // 开发阶段返回验证码，生产环境不应该返回
        return { code: data.code, message: data.message };
      },

      async signInWithCode(credential: {
        email: string;
        code: string;
      }) {
        const res = await fetchService.fetch('/api/auth/sign-in-with-code', {
          method: 'POST',
          body: JSON.stringify({
            email: credential.email,
            code: credential.code,
          }),
          headers: {
            'content-type': 'application/json',
          },
        });

        console.log('Code login response status:', res.status);

        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        let data;
        try {
          const responseText = await res.text();
          console.log('Code login response text:', responseText);

          if (!responseText.trim()) {
            throw new Error('Empty response from server');
          }

          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse code login response:', e);
          throw new Error('Invalid response format from server');
        }

        if (!data.success) {
          throw new Error(data.error || 'Verification code sign in failed');
        }

        // 登录成功后，返回用户信息以便前端存储
        return data.user;
      },
      
      async signOut() {
        const res = await fetchService.fetch('/api/auth/sign-out', {
          method: 'GET',
        });
        
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Sign out failed');
        }
      },
    };
  });
}

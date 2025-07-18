import { createIdentifier } from '@toeverything/infra';

export interface AuthProvider {
  signInMagicLink(
    email: string,
    token: string,
    clientNonce?: string
  ): Promise<{ user: any; token: string; refreshToken: string }>;

  signInOauth(
    code: string,
    state: string,
    provider: string,
    clientNonce?: string
  ): Promise<{ redirectUri?: string }>;

  signInWithCode(credential: {
    email: string;
    code: string;
  }): Promise<{ user: any; token: string; refreshToken: string }>;

  signInPassword(credential: {
    email: string;
    password: string;
    verifyToken?: string;
    challenge?: string;
  }): Promise<{ user: any; token: string; refreshToken: string }>;

  signOut(): Promise<void>;
}

export const AuthProvider = createIdentifier<AuthProvider>('AuthProvider');

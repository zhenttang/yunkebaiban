export interface AuthPlugin {
  signInMagicLink(options: {
    endpoint: string;
    email: string;
    token: string;
    clientNonce?: string;
  }): Promise<{ user: any; token: string; refreshToken: string }>;
  signInOauth(options: {
    endpoint: string;
    code: string;
    state: string;
    clientNonce?: string;
  }): Promise<{ user: any; token: string; refreshToken: string }>;
  signInPassword(options: {
    endpoint: string;
    email: string;
    password: string;
    verifyToken?: string;
    challenge?: string;
  }): Promise<{ user: any; token: string; refreshToken: string }>;
  signOut(options: { endpoint: string }): Promise<void>;
}

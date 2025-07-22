export interface OAuthProvider {
  provider: string;
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  issuer?: string; // OIDC特有
  claimId?: string; // OIDC特有
  claimEmail?: string; // OIDC特有
  claimName?: string; // OIDC特有
  callbackUrl: string;
  configured: boolean;
  connectionStatus: string;
}

export interface OAuthTestResult {
  success: boolean;
  message: string;
  provider: string;
  testedAt: string;
  details: Record<string, any>;
  errorCode?: string;
  responseTime?: number;
}

export interface OAuthStatistics {
  totalProviders: number;
  enabledProviders: number;
  configuredProviders: number;
  totalOAuthUsers: number;
  usersByProvider: Record<string, number>;
  recentLogins?: Record<string, number>;
  mostPopularProvider?: string;
  lastUpdated: string;
}

export interface BatchToggleRequest {
  providers: string[];
  enabled: boolean;
}

export interface BatchToggleResult {
  successCount: number;
  totalCount: number;
  failedProviders: string[];
  enabled: boolean;
}
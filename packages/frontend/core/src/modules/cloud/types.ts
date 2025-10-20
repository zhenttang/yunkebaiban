// import type {
//   CredentialsRequirementType,
//   OAuthProviderType,
//   ServerDeploymentType,
//   ServerFeature,
// } from '@yunke/graphql';

// Temporary placeholder types since GraphQL backend removed
export interface CredentialsRequirementType {
  password: {
    minLength: number;
    maxLength: number;
  };
}

export enum OAuthProviderType {
  Google = 'google',
}

export enum ServerDeploymentType {
  Selfhosted = 'selfhosted',
  Yunke = 'yunke',
}

export enum ServerFeature {
  Captcha = 'captcha',
  Copilot = 'copilot',
  OAuth = 'oauth',
  Payment = 'payment',
}

export interface ServerMetadata {
  id: string;

  baseUrl: string;
}

export interface ServerConfig {
  serverName: string;
  features: ServerFeature[];
  oauthProviders: OAuthProviderType[];
  type: ServerDeploymentType;
  initialized?: boolean;
  version?: string;
  credentialsRequirement: CredentialsRequirementType;
}

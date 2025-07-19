// import type { FeatureType, ListUsersQuery } from '@affine/graphql';

// Temporary placeholders to replace @affine/graphql imports
export enum FeatureType {
  Admin = 'admin',
  Pro = 'pro',
}

type ListUsersQuery = {
  users: {
    id: string;
    name: string;
    email: string;
    enabled: boolean;
    registered: boolean;
    features: string[];
    createdAt?: string;
    updatedAt?: string;
    avatarUrl?: string;
  }[];
};

export type UserType = ListUsersQuery['users'][0];

export type UserInput = {
  name: string;
  email: string;
  password?: string;
  enabled?: boolean;
  features: FeatureType[];
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  enabled?: boolean;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  enabled?: boolean;
  avatarUrl?: string;
};

export type BatchOperationInput = {
  userIds: string[];
  operation: 'enable' | 'disable' | 'delete';
};

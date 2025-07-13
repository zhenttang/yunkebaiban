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
    features: string[];
    createdAt?: string;
    updatedAt?: string;
  }[];
};

export type UserType = ListUsersQuery['users'][0];
export type UserInput = {
  name: string;
  email: string;
  password?: string;
  features: FeatureType[];
};

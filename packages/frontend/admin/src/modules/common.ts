// import type { GetCurrentUserFeaturesQuery } from '@affine/graphql';
// import {
//   adminServerConfigQuery,
//   FeatureType,
//   getCurrentUserFeaturesQuery,
// } from '@affine/graphql';

// Temporary placeholders to replace @affine/graphql imports
type GetCurrentUserFeaturesQuery = {
  currentUser: {
    id: string;
    email: string;
    features: string[];
  } | null;
};

enum FeatureType {
  Admin = 'admin',
}

const adminServerConfigQuery = {
  id: 'adminServerConfig',
  query: 'query AdminServerConfig { serverConfig { id name } }',
};

const getCurrentUserFeaturesQuery = {
  id: 'getCurrentUserFeatures', 
  query: 'query GetCurrentUserFeatures { currentUser { id email features } }',
};

import { useEffect, useState } from 'react';

import { useMutateQueryResource } from '../use-mutation';
import { useQuery } from '../use-query';

export const useServerConfig = () => {
  try {
    const { data } = useQuery({
      query: adminServerConfigQuery,
    });
    return data?.serverConfig || {};
  } catch (error) {
    console.warn('Server config temporarily unavailable:', error);
    return {};
  }
};

export const useRevalidateServerConfig = () => {
  const revalidate = useMutateQueryResource();

  return () => {
    try {
      return revalidate(adminServerConfigQuery);
    } catch (error) {
      console.warn('Failed to revalidate server config:', error);
    }
  };
};

export const useRevalidateCurrentUser = () => {
  const revalidate = useMutateQueryResource();

  return () => {
    try {
      return revalidate(getCurrentUserFeaturesQuery);
    } catch (error) {
      console.warn('Failed to revalidate current user:', error);
    }
  };
};

export const useCurrentUser = () => {
  try {
    const { data } = useQuery({
      query: getCurrentUserFeaturesQuery,
    });
    return data?.currentUser || null;
  } catch (error) {
    console.warn('Current user temporarily unavailable:', error);
    return null;
  }
};

export function isAdmin(
  user: NonNullable<GetCurrentUserFeaturesQuery['currentUser']>
) {
  return user?.features?.includes(FeatureType.Admin) || false;
}

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = matchMedia(query);
    result.addEventListener('change', onChange);
    setValue(result.matches);

    return () => result.removeEventListener('change', onChange);
  }, [query]);

  return value;
}

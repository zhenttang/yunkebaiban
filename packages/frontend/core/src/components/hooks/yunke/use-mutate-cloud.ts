import { useCallback, useMemo } from 'react';
import { useSWRConfig } from 'swr';

type CloudScope = string | string[] | ((key: unknown) => boolean);

export function useMutateCloud(scope?: CloudScope) {
  const { mutate } = useSWRConfig();

  const matcher = useMemo(() => {
    if (typeof scope === 'function') {
      return (key: unknown) => Array.isArray(key) && key[0] === 'cloud' && scope(key);
    }

    const scopes = Array.isArray(scope) ? scope : scope ? [scope] : null;

    return (key: unknown) => {
      if (!Array.isArray(key)) return false;
      if (key[0] !== 'cloud') return false;
      if (!scopes) return true;
      return scopes.includes(key[1] as string);
    };
  }, [scope]);

  return useCallback(async () => {
    return mutate(key => matcher(key));
  }, [matcher, mutate]);
}

import { createIdentifier } from '@blocksuite/global/di';
import type { ExtensionType } from '@blocksuite/store';
import type { ReadonlySignal } from '@preact/signals-core';

import type { YunkeUserInfo } from './types';

export interface UserListService {
  users$: ReadonlySignal<YunkeUserInfo[]>;
  isLoading$: ReadonlySignal<boolean>;
  searchText$: ReadonlySignal<string>;
  hasMore$: ReadonlySignal<boolean>;
  loadMore(): void;
  search(keyword: string): void;
}

export const UserListProvider = createIdentifier<UserListService>(
  'yunke-user-list-service'
);

export function UserListServiceExtension(
  service: UserListService
): ExtensionType {
  return {
    setup(di) {
      di.addImpl(UserListProvider, () => service);
    },
  };
}

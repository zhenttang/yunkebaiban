import { MenuItem } from '@yunke/component';
import { IsFavoriteIcon } from '@yunke/core/components/pure/icons';
import { CompatibleFavoriteItemsAdapter } from '@yunke/core/modules/favorite';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { useMemo } from 'react';

export const FavoriteFolderOperation = ({ id }: { id: string }) => {
  const t = useI18n();
  const compatibleFavoriteItemsAdapter = useService(
    CompatibleFavoriteItemsAdapter
  );

  const favorite = useLiveData(
    useMemo(() => {
      return compatibleFavoriteItemsAdapter.isFavorite$(id, 'folder');
    }, [compatibleFavoriteItemsAdapter, id])
  );

  return (
    <MenuItem
      prefixIcon={<IsFavoriteIcon favorite={favorite} />}
      onClick={() => compatibleFavoriteItemsAdapter.toggle(id, 'folder')}
    >
      {favorite
        ? t['com.yunke.rootAppSidebar.organize.folder-rm-favorite']()
        : t['com.yunke.rootAppSidebar.organize.folder-add-favorite']()}
    </MenuItem>
  );
};

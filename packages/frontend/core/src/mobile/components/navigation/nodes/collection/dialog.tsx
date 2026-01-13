import { useI18n } from '@yunke/i18n';

import {
  RenameDialog,
  type RenameDialogProps,
  RenameSubMenu,
  type RenameSubMenuProps,
} from '../../../rename';

export const CollectionRenameSubMenu = ({
  title,
  text,
  ...props
}: RenameSubMenuProps) => {
  const t = useI18n();
  return (
    <RenameSubMenu
      title={title || t['com.yunke.m.explorer.collection.rename-menu-title']()}
      text={text || t['com.yunke.m.explorer.collection.rename']()}
      {...props}
    />
  );
};

const CollectionDesc = () => {
  const t = useI18n();
  return t['com.yunke.collection.emptyCollectionDescription']();
};

export const CollectionRenameDialog = ({
  title,
  confirmText,
  ...props
}: RenameDialogProps) => {
  return (
    <RenameDialog
      title={title}
      confirmText={confirmText}
      {...props}
      descRenderer={CollectionDesc}
    />
  );
};

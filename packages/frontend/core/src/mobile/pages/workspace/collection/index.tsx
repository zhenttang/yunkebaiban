import { useThemeColorV2 } from '@affine/component';

import { AllDocsHeader, CollectionList } from '../../../views';

export const Component = () => {
  useThemeColorV2('layer/background/mobile/primary');
  return (
    <>
      <AllDocsHeader />
      {/* Tabs moved to workspace layout to avoid remount flicker */}
      <CollectionList />
    </>
  );
};

import { ExplorerNavigation } from '@yunke/core/components/explorer/header/navigation';
import { Header } from '@yunke/core/components/pure/header';

export const AllTagHeader = () => {
  return <Header left={<ExplorerNavigation active={'tags'} />} />;
};

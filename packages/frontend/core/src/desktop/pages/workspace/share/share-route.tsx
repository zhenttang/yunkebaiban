import { useParams } from 'react-router-dom';
import { SharePage } from './share-page';

export const Component = () => {
  const { workspaceId, pageId } = useParams<{ workspaceId: string; pageId: string }>();
  
  if (!workspaceId || !pageId) {
    return null;
  }
  
  return <SharePage workspaceId={workspaceId} docId={pageId} />;
};


import { useI18n } from '@yunke/i18n';

import { Button } from '../../ui/button';
import { AuthPageContainer } from '../auth-components';

export const ExpiredPage = ({ onOpenYunke }: { onOpenYunke: () => void }) => {
  const t = useI18n();
  return (
    <AuthPageContainer
      title={t['com.yunke.expired.page.title']()}
      subtitle={t['com.yunke.expired.page.new-subtitle']()}
    >
      <Button variant="primary" size="large" onClick={onOpenYunke}>
        {t['com.yunke.auth.open.yunke']()}
      </Button>
    </AuthPageContainer>
  );
};

import { Button } from '@yunke/component';
import { useI18n } from '@yunke/i18n';

import * as styles from './tag-list-header.css';

export const TagListHeader = ({ onOpen }: { onOpen: () => void }) => {
  const t = useI18n();
  return (
    <div className={styles.tagListHeader}>
      <div className={styles.tagListHeaderTitle}>{t['Tags']()}</div>
      <Button
        className={styles.newTagButton}
        onClick={onOpen}
        data-testid="all-tags-new-button"
      >
        {t['com.yunke.tags.empty.new-tag-button']()}
      </Button>
    </div>
  );
};

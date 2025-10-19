import { Button } from '@yunke/component';
import { useNavigateHelper } from '@yunke/core/components/hooks/use-navigate-helper';
import { useI18n } from '@yunke/i18n';

export const ImportTemplateButton = ({
  name,
  snapshotUrl,
}: {
  name: string;
  snapshotUrl: string;
}) => {
  const t = useI18n();
  const { jumpToImportTemplate } = useNavigateHelper();
  return (
    <Button
      variant="primary"
      onClick={() => jumpToImportTemplate(name, snapshotUrl)}
    >
      {t['com.affine.share-page.header.import-template']()}
    </Button>
  );
};

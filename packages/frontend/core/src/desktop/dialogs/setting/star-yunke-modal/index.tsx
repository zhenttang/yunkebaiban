import { OverlayModal } from '@yunke/component';
import { useI18n } from '@yunke/i18n';

export const StarYUNKEModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const t = useI18n();

  return (
    <OverlayModal
      open={open}
      topImage={
        <video
          width={400}
          height={300}
          style={{ objectFit: 'cover' }}
          src={'/static/githubStar.mp4'}
          autoPlay
          loop
        />
      }
      title={t['com.yunke.star-yunke.title']()}
      onOpenChange={setOpen}
      description={t['com.yunke.star-yunke.description']()}
      cancelText={t['com.yunke.star-yunke.cancel']()}
      to={BUILD_CONFIG.githubUrl}
      confirmButtonOptions={{
        variant: 'primary',
      }}
      confirmText={t['com.yunke.star-yunke.confirm']()}
      external
    />
  );
};

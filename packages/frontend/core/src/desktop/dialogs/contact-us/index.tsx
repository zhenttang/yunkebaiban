import { Button, Modal } from '@affine/component';
import type {
  DialogComponentProps,
  GLOBAL_DIALOG_SCHEMA,
} from '@affine/core/modules/dialogs';
import { useI18n } from '@affine/i18n';
import { EmailIcon, TelegramIcon } from '@blocksuite/icons/rc';
import { useCallback } from 'react';

import * as styles from './styles.css';

export const ContactUsDialog = ({
  close,
}: DialogComponentProps<GLOBAL_DIALOG_SCHEMA['contact-us']>) => {
  const t = useI18n();

  const handleEmailClick = useCallback(() => {
    window.open('mailto:contact@example.com', '_blank');
  }, []);

  const handleTelegramClick = useCallback(() => {
    window.open('https://t.me/your_telegram', '_blank');
  }, []);

  const handleWebsiteClick = useCallback(() => {
    window.open('https://your-website.com', '_blank');
  }, []);

  return (
    <Modal
      open
      modal={true}
      persistent={false}
      onOpenChange={() => close()}
      width={400}
      height="auto"
      title="联系我们"
      contentOptions={{
        ['data-testid' as string]: 'contact-us-modal',
        className: styles.modalContent,
      }}
    >
      <div className={styles.container}>
        <div className={styles.description}>
          如果您有任何问题或建议，欢迎通过以下方式联系我们：
        </div>
        
        <div className={styles.contactMethods}>
          <Button
            className={styles.contactButton}
            onClick={handleEmailClick}
            prefix={<EmailIcon />}
            variant="outline"
          >
            contact@example.com
          </Button>
          
          <Button
            className={styles.contactButton}
            onClick={handleTelegramClick}
            prefix={<TelegramIcon />}
            variant="outline"
          >
            电报联系
          </Button>
          
          <Button
            className={styles.contactButton}
            onClick={handleWebsiteClick}
            variant="outline"
          >
            访问官网
          </Button>
        </div>
        
        <div className={styles.footer}>
          <div className={styles.workingHours}>
            工作时间：周一至周五 9:00-18:00
          </div>
          <div className={styles.response}>
            我们将在24小时内回复您的消息
          </div>
        </div>
      </div>
    </Modal>
  );
}; 
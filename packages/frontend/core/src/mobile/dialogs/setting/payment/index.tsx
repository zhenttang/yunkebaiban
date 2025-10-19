import { NavigateContext } from '@yunke/core/components/hooks/use-navigate-helper';
import { useContext } from 'react';
import { SettingGroup } from '../group';
import { RowLayout } from '../row.layout';
import * as styles from './styles.css';

export const PaymentGroup = () => {
  const navigate = useContext(NavigateContext);
  
  const handlePaymentTest = () => {
    // 直接使用原生navigate方法跳转到支付测试页面
    if (navigate) {
      navigate('/payment-test');
    }
  };

  return (
    <SettingGroup title="支付功能">
      <RowLayout
        label="支付测试"
        onClick={handlePaymentTest}
      >
        <div className={styles.testBadge}>测试</div>
      </RowLayout>
    </SettingGroup>
  );
};
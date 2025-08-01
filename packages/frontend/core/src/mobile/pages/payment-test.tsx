// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useNavigate } from 'react-router-dom';

import { PaymentTestPage } from '../../components/payment-test-page';

export const Component = () => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate(-1);
  };
  
  return (
    <div>
      <button onClick={handleBack} style={{ margin: '10px' }}>
        ← 返回
      </button>
      <PaymentTestPage />
    </div>
  );
};

export default Component;
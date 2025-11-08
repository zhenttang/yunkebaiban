import { useNavigate } from 'react-router-dom';

import { NavigateContext } from '../components/hooks/use-navigate-helper';
import { RootWrapper } from './pages/root';

export function RootRouter() {
  const navigate = useNavigate();

  return (
    <NavigateContext.Provider value={navigate}>
      <RootWrapper />
    </NavigateContext.Provider>
  );
}


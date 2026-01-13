import { ScrollArea } from '@yunke/admin/components/ui/scroll-area';

import { Header } from '../header';
import { AboutYUNKE } from './about';

export function ConfigPage() {
  return (
    <div className=" h-screen flex-1 space-y-1 flex-col flex">
      <Header title="关于" />
      <ScrollArea>
        <AboutYUNKE />
      </ScrollArea>
    </div>
  );
}

export { ConfigPage as Component };

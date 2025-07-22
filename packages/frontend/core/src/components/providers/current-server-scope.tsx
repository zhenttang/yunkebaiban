import { ServersService } from '@affine/core/modules/cloud';
import { GlobalContextService } from '@affine/core/modules/global-context';
import { FrameworkScope, useLiveData, useService } from '@toeverything/infra';
import { useMemo } from 'react';

export const CurrentServerScopeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const globalContext = useService(GlobalContextService).globalContext;
  const serversService = useService(ServersService);
  const currentServerId = useLiveData(globalContext.serverId.$);
  const serverService = useLiveData(
    useMemo(() => {
      if (!currentServerId) {
        return null;
      }
      return serversService.server$(currentServerId);
    }, [currentServerId, serversService])
  );

  if (!serverService) {
    // todo(@pengx17): 如果未找到，在此渲染加载/错误组件？
    return null;
  }

  return (
    <FrameworkScope scope={serverService.scope}>{children}</FrameworkScope>
  );
};

export const useCurrentServerService = () => {
  const globalContext = useService(GlobalContextService).globalContext;
  const serversService = useService(ServersService);
  const currentServerId = useLiveData(globalContext.serverId.$);
  const serverService = useLiveData(
    useMemo(() => {
      if (!currentServerId) {
        return null;
      }
      return serversService.server$(currentServerId);
    }, [currentServerId, serversService])
  );

  return serverService ?? undefined;
};

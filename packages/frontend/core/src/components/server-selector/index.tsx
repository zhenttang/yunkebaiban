import {
  Menu,
  MenuItem,
  type MenuProps,
  MenuTrigger,
  Tooltip,
} from '@affine/component';
import type { Server } from '@affine/core/modules/cloud';
import { useMemo } from 'react';

import { triggerStyle } from './style.css';

export const ServerSelector = ({
  servers,
  selectedSeverName,
  onSelect,
  contentOptions,
}: {
  servers: Server[];
  selectedSeverName: string;
  onSelect: (server: Server) => void;
  contentOptions?: MenuProps['contentOptions'];
}) => {
  const menuItems = useMemo(() => {
    return servers.map(server => {
      const name = server.config$.value?.serverName ?? 'Server';
      return (
        <Tooltip key={server.id} content={`${name} (${server.baseUrl})`}>
          <MenuItem key={server.id} onSelect={() => onSelect(server)}>
            {name} ({server.baseUrl})
          </MenuItem>
        </Tooltip>
      );
    });
  }, [servers, onSelect]);

  return (
    <Menu
      items={menuItems}
      contentOptions={{
        ...contentOptions,
        style: {
          ...contentOptions?.style,
          width: 'var(--radix-dropdown-menu-trigger-width)',
        },
      }}
    >
      <MenuTrigger tooltip={selectedSeverName} className={triggerStyle}>
        {selectedSeverName}
      </MenuTrigger>
    </Menu>
  );
};

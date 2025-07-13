import { useCallback } from 'react';
import { NavLink } from 'react-router-dom';

import { buttonVariants } from '../../components/ui/button';
import { cn } from '../../utils';

export const NormalSubItem = ({
  module,
  title,
  changeModule,
  activeClass = 'bg-zinc-100',
  hoverClass = 'hover:bg-zinc-100/70',
}: {
  module: string;
  title: string;
  changeModule?: (module: string) => void;
  activeClass?: string;
  hoverClass?: string;
}) => {
  const handleClick = useCallback(() => {
    changeModule?.(module);
  }, [changeModule, module]);
  
  return (
    <div className="w-full flex">
      <NavLink
        to={`/admin/settings/${module}`}
        onClick={handleClick}
        className={({ isActive }) => {
          return cn(
            buttonVariants({
              variant: 'ghost',
              className: `ml-8 px-2 py-1.5 w-full justify-start text-sm rounded-lg transition-all duration-300 ${isActive ? activeClass : hoverClass}`,
            })
          );
        }}
      >
        {title}
      </NavLink>
    </div>
  );
};

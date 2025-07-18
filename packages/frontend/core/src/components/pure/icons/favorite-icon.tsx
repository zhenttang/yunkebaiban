import { FavoritedIcon, FavoriteIcon } from '@blocksuite/icons/rc';
import { cssVar } from '@toeverything/theme';
import { forwardRef, type SVGProps } from 'react';

export const IsFavoriteIcon = forwardRef<
  SVGSVGElement,
  { favorite?: boolean } & SVGProps<SVGSVGElement>
>(({ favorite, style, ...props }, ref) => {
  return favorite ? (
    <FavoritedIcon
      ref={ref}
      style={{ color: cssVar('primaryColor'), ...style }}
      {...props}
    />
  ) : (
    <FavoriteIcon ref={ref} style={style} {...props} />
  );
});

IsFavoriteIcon.displayName = 'IsFavoriteIcon';

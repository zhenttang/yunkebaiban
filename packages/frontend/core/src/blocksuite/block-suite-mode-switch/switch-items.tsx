import { Tooltip } from '@yunke/component';
import {
  type CustomLottieProps,
  InternalLottie,
} from '@yunke/component/internal-lottie';
import { useI18n } from '@yunke/i18n';
import type { HTMLAttributes } from 'react';
import type React from 'react';
import { cloneElement, forwardRef, useState } from 'react';

import edgelessHover from './animation-data/edgeless-hover.json';
import pageHover from './animation-data/page-hover.json';

type HoverAnimateControllerProps = {
  active?: boolean;
  hide?: boolean;
  trash?: boolean;
  children: React.ReactElement<CustomLottieProps>;
} & HTMLAttributes<HTMLDivElement>;

const HoverAnimateController = forwardRef<HTMLDivElement, HoverAnimateControllerProps>(({
  children,
  ...props
}, ref) => {
  const [startAnimate, setStartAnimate] = useState(false);
  return (
    <div
      ref={ref}
      onMouseEnter={() => setStartAnimate(true)}
      onMouseLeave={() => setStartAnimate(false)}
      {...props}
    >
      {cloneElement(children, {
        isStopped: !startAnimate,
        speed: 1,
        width: 20,
        height: 20,
      })}
    </div>
  );
});

HoverAnimateController.displayName = 'HoverAnimateController';

const pageLottieOptions = {
  loop: false,
  autoplay: false,
  animationData: pageHover,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice',
  },
};

const edgelessLottieOptions = {
  loop: false,
  autoplay: false,
  animationData: edgelessHover,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice',
  },
};

export const PageSwitchItem = forwardRef<HTMLDivElement, Omit<HoverAnimateControllerProps, 'children'>>(
  (props, ref) => {
    const t = useI18n();
    return (
      <Tooltip
        content={t['com.affine.header.mode-switch.page']()}
        shortcut={['$alt', 'S']}
        side="bottom"
      >
        <HoverAnimateController ref={ref} {...props}>
          <InternalLottie options={pageLottieOptions} />
        </HoverAnimateController>
      </Tooltip>
    );
  }
);

PageSwitchItem.displayName = 'PageSwitchItem';

export const EdgelessSwitchItem = forwardRef<HTMLDivElement, Omit<HoverAnimateControllerProps, 'children'>>(
  (props, ref) => {
    const t = useI18n();
    return (
      <Tooltip
        content={t['com.affine.header.mode-switch.edgeless']()}
        shortcut={['$alt', 'S']}
        side="bottom"
      >
        <HoverAnimateController ref={ref} {...props}>
          <InternalLottie options={edgelessLottieOptions} />
        </HoverAnimateController>
      </Tooltip>
    );
  }
);

EdgelessSwitchItem.displayName = 'EdgelessSwitchItem';

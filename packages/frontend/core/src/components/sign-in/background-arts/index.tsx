import { useTheme } from 'next-themes';

import darkArt from './art-dark.inline.svg';
import lightArt from './art-light.inline.svg';
import modernArt from './art-modern.svg';
import { arts, wrapper, modernIllustration } from './style.css';

export function SignInBackgroundArts() {
  const { resolvedTheme } = useTheme();

  return (
    <div className={wrapper}>
      {/* 亮色主题：使用现代科技感插画 */}
      {/* 暗色主题：使用原有插画（视觉更柔和） */}
      <img
        src={resolvedTheme === 'dark' ? darkArt : modernArt}
        className={arts}
        alt="Sign in illustration"
      />
    </div>
  );
}

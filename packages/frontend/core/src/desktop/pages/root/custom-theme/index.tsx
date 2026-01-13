import { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import { ThemeEditorService } from '@yunke/core/modules/theme-editor';
import { EditorSettingService } from '@yunke/core/modules/editor-setting';
import { useLiveData, useServices } from '@toeverything/infra';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

let _provided = false;

export const CustomThemeModifier = () => {
  const { themeEditorService, featureFlagService, editorSettingService } = useServices({
    ThemeEditorService,
    FeatureFlagService,
    EditorSettingService,
  });
  const enableThemeEditor = useLiveData(
    featureFlagService.flags.enable_theme_editor.$
  );
  const settings = useLiveData(editorSettingService.editorSetting.settings$);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // 清除所有自定义主题变量的辅助函数
    const clearCustomThemeVars = () => {
      // 获取所有以 --yunke- 开头的 CSS 变量
      const customVars: string[] = [];
      
      // 遍历所有通过 style 属性设置的 CSS 变量
      for (let i = 0; i < document.documentElement.style.length; i++) {
        const prop = document.documentElement.style[i];
        if (prop.startsWith('--yunke-')) {
          customVars.push(prop);
        }
      }
      
      // 清除所有自定义变量
      customVars.forEach(prop => {
        document.documentElement.style.removeProperty(prop);
      });
    };

    if (!enableThemeEditor) {
      // 如果 feature flag 关闭，清除之前应用的自定义主题
      clearCustomThemeVars();
      return;
    }
    if (_provided) return;

    _provided = true;

    const sub = themeEditorService.customTheme$.subscribe(themeObj => {
      if (!themeObj) {
        // 如果没有自定义主题，清除之前应用的样式
        clearCustomThemeVars();
        return;
      }

      const mode = resolvedTheme === 'dark' ? 'dark' : 'light';
      const valueMap = themeObj[mode];

      // 清除之前通过 setProperty 设置的自定义变量
      clearCustomThemeVars();

      // 恢复 color scheme
      document.documentElement.style.colorScheme = mode;

      // 应用新的自定义变量
      Object.entries(valueMap).forEach(([key, value]) => {
        if (value) {
          document.documentElement.style.setProperty(key, value);
        }
      });
    });

    return () => {
      _provided = false;
      sub.unsubscribe();
    };
  }, [resolvedTheme, enableThemeEditor, themeEditorService]);

  // Apply font size CSS variable when settings change
  useEffect(() => {
    if (settings.fontSize) {
      document.documentElement.style.setProperty('--yunke-font-base', `${settings.fontSize}px`);
    }
  }, [settings.fontSize]);

  return null;
};

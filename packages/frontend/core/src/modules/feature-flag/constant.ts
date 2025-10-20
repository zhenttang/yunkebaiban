import type { FlagInfo } from './types';

// const isNotStableBuild = BUILD_CONFIG.appBuildType !== 'stable';
const isDesktopEnvironment = BUILD_CONFIG.isElectron;
const isCanaryBuild = BUILD_CONFIG.appBuildType === 'canary';
const isBetaBuild = BUILD_CONFIG.appBuildType === 'beta';
const isMobile = BUILD_CONFIG.isMobileEdition;

export const YUNKE_FLAGS = {
  enable_ai: {
    category: 'yunke',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-ai.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-ai.description',
    hide: true,
    configurable: true,
    defaultState: true,
  },
  enable_ai_network_search: {
    category: 'yunke',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-ai-network-search.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-ai-network-search.description',
    hide: true,
    configurable: false,
    defaultState: true,
  },
  enable_ai_model_switch: {
    category: 'yunke',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-ai-model-switch.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-ai-model-switch.description',
    configurable: isCanaryBuild,
    defaultState: isCanaryBuild,
  },
  enable_edgeless_text: {
    category: 'blocksuite',
    bsFlag: 'enable_edgeless_text',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-edgeless-text.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-edgeless-text.description',
    configurable: false,
    defaultState: true,
  },
  enable_color_picker: {
    category: 'blocksuite',
    bsFlag: 'enable_color_picker',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-color-picker.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-color-picker.description',
    configurable: false,
    defaultState: true,
  },
  enable_ai_chat_block: {
    category: 'blocksuite',
    bsFlag: 'enable_ai_chat_block',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-ai-chat-block.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-ai-chat-block.description',
    configurable: false,
    defaultState: true,
  },
  enable_ai_onboarding: {
    category: 'blocksuite',
    bsFlag: 'enable_ai_onboarding',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-ai-onboarding.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-ai-onboarding.description',
    configurable: false,
    defaultState: true,
  },
  enable_mind_map_import: {
    category: 'blocksuite',
    bsFlag: 'enable_mind_map_import',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-mind-map-import.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-mind-map-import.description',
    configurable: false,
    defaultState: true,
  },
  enable_block_meta: {
    category: 'blocksuite',
    bsFlag: 'enable_block_meta',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-block-meta.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-block-meta.description',
    configurable: isCanaryBuild,
    defaultState: true,
  },
  enable_callout: {
    category: 'blocksuite',
    bsFlag: 'enable_callout',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-callout.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-callout.description',
    configurable: isCanaryBuild,
    defaultState: isCanaryBuild,
  },

  enable_emoji_folder_icon: {
    category: 'yunke',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-emoji-folder-icon.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-emoji-folder-icon.description',

    feedbackType: 'discord',
    feedbackLink:
      'https://discord.com/channels/959027316334407691/1280014319865696351',
    configurable: true,
    defaultState: true,
  },
  enable_emoji_doc_icon: {
    category: 'yunke',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-emoji-doc-icon.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-emoji-doc-icon.description',
    feedbackType: 'discord',
    feedbackLink:
      'https://discord.com/channels/959027316334407691/1280014319865696351',
    configurable: true,
    defaultState: true,
  },
  enable_editor_settings: {
    category: 'yunke',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-editor-settings.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-editor-settings.description',
    configurable: false,
    defaultState: true,
  },
  enable_theme_editor: {
    category: 'yunke',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-theme-editor.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-theme-editor.description',
    configurable: isCanaryBuild && !isMobile,
    defaultState: isCanaryBuild,
  },
  enable_local_workspace: {
    category: 'yunke',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-local-workspace.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-local-workspace.description',
    configurable: isCanaryBuild,
    defaultState: isDesktopEnvironment || isCanaryBuild,
  },
  enable_advanced_block_visibility: {
    category: 'blocksuite',
    bsFlag: 'enable_advanced_block_visibility',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-advanced-block-visibility.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-advanced-block-visibility.description',
    configurable: true,
    defaultState: false,
  },
  enable_mobile_keyboard_toolbar: {
    category: 'blocksuite',
    bsFlag: 'enable_mobile_keyboard_toolbar',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-mobile-keyboard-toolbar.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-mobile-keyboard-toolbar.description',
    configurable: false,
    defaultState: isMobile,
  },
  enable_mobile_linked_doc_menu: {
    category: 'blocksuite',
    bsFlag: 'enable_mobile_linked_doc_menu',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-mobile-linked-doc-menu.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-mobile-linked-doc-menu.description',
    configurable: false,
    defaultState: isMobile,
  },
  enable_mobile_edgeless_editing: {
    category: 'yunke',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-mobile-edgeless-editing.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-mobile-edgeless-editing.description',
    configurable: isMobile,
    defaultState: true, // 🔧 Android修复：启用移动端无界编辑
  },
  enable_pdf_embed_preview: {
    category: 'yunke',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-pdf-embed-preview.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-pdf-embed-preview.description',
    configurable: !isMobile,
    defaultState: true,
  },
  enable_editor_rtl: {
    category: 'yunke',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-editor-rtl.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-editor-rtl.description',
    configurable: isCanaryBuild,
    defaultState: false,
  },
  enable_mobile_ai_button: {
    category: 'yunke',
    displayName: '启用AI按钮',
    description: '在移动端启用AI按钮',
    configurable: BUILD_CONFIG.isMobileEdition && isCanaryBuild,
    defaultState: false,
  },
  enable_turbo_renderer: {
    category: 'blocksuite',
    bsFlag: 'enable_turbo_renderer',
    displayName: '启用加速渲染器',
    description: '启用实验性无边界加速渲染器',
    configurable: isCanaryBuild,
    defaultState: false,
  },
  enable_dom_renderer: {
    category: 'blocksuite',
    bsFlag: 'enable_dom_renderer',
    displayName: '启用DOM渲染器',
    description: '为图形元素启用DOM渲染器',
    configurable: isCanaryBuild,
    defaultState: false,
  },
  enable_edgeless_scribbled_style: {
    category: 'blocksuite',
    bsFlag: 'enable_edgeless_scribbled_style',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-edgeless-scribbled-style.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-edgeless-scribbled-style.description',
    configurable: isCanaryBuild,
    defaultState: false,
  },
  enable_table_virtual_scroll: {
    category: 'blocksuite',
    bsFlag: 'enable_table_virtual_scroll',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-table-virtual-scroll.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-table-virtual-scroll.description',
    configurable: isCanaryBuild,
    defaultState: false,
  },
  enable_setting_subpage_animation: {
    category: 'yunke',
    displayName: '启用设置子页面动画',
    description: 'Apply animation for setting subpage open/close',
    configurable: isCanaryBuild,
    defaultState: false,
  },
  enable_calendar_integration: {
    category: 'yunke',
    displayName: '启用日历集成',
    description: '启用日历集成',
    configurable: false,
    defaultState: isCanaryBuild,
  },
  enable_cloud_indexer: {
    category: 'yunke',
    displayName: '启用云索引器',
    description: 'Use cloud indexer to search docs',
    configurable: isBetaBuild || isCanaryBuild,
    defaultState: false,
  },
  enable_code_block_html_preview: {
    category: 'yunke',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-code-block-html-preview.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-code-block-html-preview.description',
    configurable: isCanaryBuild,
    defaultState: true,
  },
  enable_adapter_panel: {
    category: 'yunke',
    displayName:
      'com.yunke.settings.workspace.experimental-features.enable-adapter-panel.name',
    description:
      'com.yunke.settings.workspace.experimental-features.enable-adapter-panel.description',
    configurable: isCanaryBuild,
    defaultState: false,
  },
} satisfies { [key in string]: FlagInfo };

// oxlint-disable-next-line no-redeclare
export type YUNKE_FLAGS = typeof YUNKE_FLAGS;

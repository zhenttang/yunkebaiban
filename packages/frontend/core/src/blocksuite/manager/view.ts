import type { ReactToLit } from '@yunke/component';
import { AIViewExtension } from '@yunke/core/blocksuite/view-extensions/ai';
import { CloudViewExtension } from '@yunke/core/blocksuite/view-extensions/cloud';
import { CodeBlockPreviewViewExtension } from '@yunke/core/blocksuite/view-extensions/code-block-preview';
import { YunkeDatabaseViewExtension } from '@yunke/core/blocksuite/view-extensions/database';
import {
  EdgelessBlockHeaderConfigViewExtension,
  type EdgelessBlockHeaderViewOptions,
} from '@yunke/core/blocksuite/view-extensions/edgeless-block-header';
import { YunkeEditorConfigViewExtension } from '@yunke/core/blocksuite/view-extensions/editor-config';
import { createDatabaseOptionsConfig } from '@yunke/core/blocksuite/view-extensions/editor-config/database';
import { createLinkedWidgetConfig } from '@yunke/core/blocksuite/view-extensions/editor-config/linked';
import {
  YunkeEditorViewExtension,
  type YunkeEditorViewOptions,
} from '@yunke/core/blocksuite/view-extensions/editor-view/editor-view';
import { ElectronViewExtension } from '@yunke/core/blocksuite/view-extensions/electron';
import { YunkeLinkPreviewExtension } from '@yunke/core/blocksuite/view-extensions/link-preview-service';
import { MobileViewExtension } from '@yunke/core/blocksuite/view-extensions/mobile';
import { PdfViewExtension } from '@yunke/core/blocksuite/view-extensions/pdf';
import { YunkeThemeViewExtension } from '@yunke/core/blocksuite/view-extensions/theme';
import { TurboRendererViewExtension } from '@yunke/core/blocksuite/view-extensions/turbo-renderer';
import { DeckViewExtension } from '@yunke/core/components/deck-integration';
import { PeekViewService } from '@yunke/core/modules/peek-view';
import { DebugLogger } from '@yunke/debug';
import { mixpanel } from '@yunke/track';
import { DatabaseViewExtension } from '@blocksuite/yunke/blocks/database/view';
import { ParagraphViewExtension } from '@blocksuite/yunke/blocks/paragraph/view';
import type {
  PeekOptions,
  PeekViewService as BSPeekViewService,
} from '@blocksuite/yunke/components/peek';
import { ViewExtensionManager } from '@blocksuite/yunke/ext-loader';
import { getInternalViewExtensions } from '@blocksuite/yunke/extensions/view';
import { FoundationViewExtension } from '@blocksuite/yunke/foundation/view';
import { YunkeCanvasTextFonts } from '@blocksuite/yunke/shared/services';
import { LinkedDocViewExtension } from '@blocksuite/yunke/widgets/linked-doc/view';
import type { FrameworkProvider } from '@toeverything/infra';
import type { TemplateResult } from 'lit';

type Configure = {
  init: () => Configure;

  foundation: (framework?: FrameworkProvider) => Configure;
  editorView: (options?: YunkeEditorViewOptions) => Configure;
  theme: (framework?: FrameworkProvider) => Configure;
  editorConfig: (framework?: FrameworkProvider) => Configure;
  edgelessBlockHeader: (options?: EdgelessBlockHeaderViewOptions) => Configure;
  database: (framework?: FrameworkProvider) => Configure;
  linkedDoc: (framework?: FrameworkProvider) => Configure;
  paragraph: (enableAI?: boolean) => Configure;
  cloud: (framework?: FrameworkProvider, enableCloud?: boolean) => Configure;
  turboRenderer: (enableTurboRenderer?: boolean) => Configure;
  pdf: (enablePDFEmbedPreview?: boolean, reactToLit?: ReactToLit) => Configure;
  mobile: (framework?: FrameworkProvider) => Configure;
  ai: (enable?: boolean, framework?: FrameworkProvider) => Configure;
  electron: (framework?: FrameworkProvider) => Configure;
  linkPreview: (framework?: FrameworkProvider) => Configure;
  codeBlockHtmlPreview: (framework?: FrameworkProvider) => Configure;

  value: ViewExtensionManager;
};

const peekViewLogger = new DebugLogger('yunke::patch-peek-view-service');

class ViewProvider {
  static instance: ViewProvider | null = null;
  static getInstance() {
    if (!ViewProvider.instance) {
      ViewProvider.instance = new ViewProvider();
    }
    return ViewProvider.instance;
  }

  private readonly _manager: ViewExtensionManager;

  constructor() {
    this._manager = new ViewExtensionManager([
      ...getInternalViewExtensions(),

      YunkeThemeViewExtension,
      YunkeEditorViewExtension,
      YunkeEditorConfigViewExtension,
      CodeBlockPreviewViewExtension,
      EdgelessBlockHeaderConfigViewExtension,
      TurboRendererViewExtension,
      CloudViewExtension,
      PdfViewExtension,
      MobileViewExtension,
      AIViewExtension,
      ElectronViewExtension,
      YunkeLinkPreviewExtension,
      YunkeDatabaseViewExtension,
      DeckViewExtension,
    ]);
  }

  get value() {
    return this._manager;
  }

  get config(): Configure {
    return {
      init: this._initDefaultConfig,
      foundation: this._configureFoundation,
      editorView: this._configureEditorView,
      theme: this._configureTheme,
      editorConfig: this._configureEditorConfig,
      edgelessBlockHeader: this._configureEdgelessBlockHeader,
      database: this._configureDatabase,
      linkedDoc: this._configureLinkedDoc,
      paragraph: this._configureParagraph,
      cloud: this._configureCloud,
      turboRenderer: this._configureTurboRenderer,
      pdf: this._configurePdf,
      mobile: this._configureMobile,
      ai: this._configureAI,
      electron: this._configureElectron,
      linkPreview: this._configureLinkPreview,
      codeBlockHtmlPreview: this._configureCodeBlockHtmlPreview,
      value: this._manager,
    };
  }

  private readonly _initDefaultConfig = () => {
    this.config
      .foundation()
      .theme()
      .editorView()
      .editorConfig()
      .edgelessBlockHeader()
      .database()
      .linkedDoc()
      .paragraph()
      .cloud()
      .turboRenderer()
      .pdf()
      .mobile()
      .ai()
      .electron()
      .linkPreview()
      .codeBlockHtmlPreview();

    return this.config;
  };

  private readonly _configureFoundation = (framework?: FrameworkProvider) => {
    const peekViewService = framework?.get(PeekViewService);

    this._manager.configure(FoundationViewExtension, {
      telemetry: {
        track: (eventName, props) => {
          mixpanel.track(eventName, props);
        },
      },
      fontConfig: YunkeCanvasTextFonts.map(font => ({
        ...font,
        url: environment.publicPath + 'fonts/' + font.url.split('/').pop(),
      })),
      peekView: !peekViewService
        ? undefined
        : ({
            peek: (
              element: {
                target: HTMLElement;
                docId: string;
                blockIds?: string[];
                template?: TemplateResult;
              },
              options?: PeekOptions
            ) => {
              peekViewLogger.debug('center peek', element);
              const { template, target, ...props } = element;

              return peekViewService.peekView.open(
                {
                  element: target,
                  docRef: props,
                },
                template,
                options?.abortSignal
              );
            },
          } satisfies BSPeekViewService),
    });

    return this.config;
  };

  private readonly _configureEditorView = (
    options?: YunkeEditorViewOptions
  ) => {
    this._manager.configure(YunkeEditorViewExtension, options);
    return this.config;
  };

  private readonly _configureTheme = (framework?: FrameworkProvider) => {
    this._manager.configure(YunkeThemeViewExtension, { framework });
    return this.config;
  };

  private readonly _configureEditorConfig = (framework?: FrameworkProvider) => {
    this._manager.configure(YunkeEditorConfigViewExtension, { framework });
    return this.config;
  };

  private readonly _configureEdgelessBlockHeader = (
    options?: EdgelessBlockHeaderViewOptions
  ) => {
    this._manager.configure(EdgelessBlockHeaderConfigViewExtension, options);
    return this.config;
  };

  private readonly _configureDatabase = (framework?: FrameworkProvider) => {
    if (framework) {
      this._manager.configure(
        DatabaseViewExtension,
        createDatabaseOptionsConfig(framework)
      );
    }
    return this.config;
  };

  private readonly _configureLinkedDoc = (framework?: FrameworkProvider) => {
    if (framework) {
      this._manager.configure(
        LinkedDocViewExtension,
        createLinkedWidgetConfig(framework)
      );
    }
    return this.config;
  };

  private readonly _configureParagraph = (enableAI?: boolean) => {
    if (BUILD_CONFIG.isMobileEdition) {
      this._manager.configure(ParagraphViewExtension, {
        getPlaceholder: model => {
          const placeholders = {
            text: '',
            h1: '一级标题',
            h2: '二级标题',
            h3: '三级标题',
            h4: '四级标题',
            h5: '五级标题',
            h6: '六级标题',
            quote: '',
          };
          return placeholders[model.props.type] ?? '';
        },
      });
    } else if (enableAI) {
      this._manager.configure(ParagraphViewExtension, {
        getPlaceholder: model => {
          const placeholders = {
            text: "输入 '/' 调用命令，'空格' 调用AI",
            h1: '一级标题',
            h2: '二级标题',
            h3: '三级标题',
            h4: '四级标题',
            h5: '五级标题',
            h6: '六级标题',
            quote: '',
          };
          return placeholders[model.props.type] ?? '';
        },
      });
    }
    return this.config;
  };

  private readonly _configureCloud = (
    framework?: FrameworkProvider,
    enableCloud?: boolean
  ) => {
    this._manager.configure(CloudViewExtension, { framework, enableCloud });
    return this.config;
  };

  private readonly _configureTurboRenderer = (
    enableTurboRenderer?: boolean
  ) => {
    this._manager.configure(TurboRendererViewExtension, {
      enableTurboRenderer,
    });
    return this.config;
  };

  private readonly _configurePdf = (
    enablePDFEmbedPreview?: boolean,
    reactToLit?: ReactToLit
  ) => {
    this._manager.configure(PdfViewExtension, {
      enablePDFEmbedPreview,
      reactToLit,
    });
    return this.config;
  };

  private readonly _configureMobile = (framework?: FrameworkProvider) => {
    this._manager.configure(MobileViewExtension, { framework });
    return this.config;
  };

  private readonly _configureAI = (
    enable?: boolean,
    framework?: FrameworkProvider
  ) => {
    this._manager.configure(AIViewExtension, { framework, enable });
    return this.config;
  };

  private readonly _configureElectron = (framework?: FrameworkProvider) => {
    this._manager.configure(ElectronViewExtension, { framework });
    return this.config;
  };

  private readonly _configureLinkPreview = (framework?: FrameworkProvider) => {
    this._manager.configure(YunkeLinkPreviewExtension, { framework });
    return this.config;
  };

  private readonly _configureCodeBlockHtmlPreview = (
    framework?: FrameworkProvider
  ) => {
    this._manager.configure(CodeBlockPreviewViewExtension, { framework });
    return this.config;
  };
}

export function getViewManager() {
  return ViewProvider.getInstance();
}

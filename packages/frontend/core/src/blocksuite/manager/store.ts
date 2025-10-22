import { AIStoreExtension } from '@yunke/core/blocksuite/store-extensions/ai';
import type { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import { StoreExtensionManager } from '@blocksuite/yunke/ext-loader';
import { getInternalStoreExtensions } from '@blocksuite/yunke/extensions/store';

import { FeatureFlagStoreExtension } from '../store-extensions/feature-flag';
import { getYUNKEWorkspaceSchema } from '../../modules/workspace/global-schema';

interface Configure {
  init: () => Configure;

  featureFlag: (featureFlagService?: FeatureFlagService) => Configure;

  value: StoreExtensionManager;
}

class StoreProvider {
  static instance: StoreProvider | null = null;
  static getInstance() {
    if (!StoreProvider.instance) {
      StoreProvider.instance = new StoreProvider();
    }
    return StoreProvider.instance;
  }

  private readonly _manager: StoreExtensionManager;

  constructor() {
    console.log('📦 [StoreProvider] 初始化 StoreExtensionManager，注册 schema');
    const schema = getYUNKEWorkspaceSchema();
    console.log('📦 [StoreProvider] Schema 注册了以下 flavours:', {
      count: schema.flavourSchemaMap.size,
      flavours: Array.from(schema.flavourSchemaMap.keys())
    });
    
    this._manager = new StoreExtensionManager([
      ...getInternalStoreExtensions(),
      AIStoreExtension,
      FeatureFlagStoreExtension,
    ]);
    
    // ✅ 注册全局 schema 到 manager
    this._manager.schema = schema;
    
    console.log('✅ [StoreProvider] StoreExtensionManager 初始化完成，schema 已注册');
  }

  get config(): Configure {
    return {
      init: this._initDefaultConfig,
      featureFlag: this._configureFeatureFlag,
      value: this._manager,
    };
  }

  get value(): StoreExtensionManager {
    return this._manager;
  }

  private readonly _initDefaultConfig = () => {
    this.config.featureFlag();

    return this.config;
  };

  private readonly _configureFeatureFlag = (
    featureFlagService?: FeatureFlagService
  ) => {
    this._manager.configure(FeatureFlagStoreExtension, { featureFlagService });
    return this.config;
  };
}

export function getStoreManager() {
  return StoreProvider.getInstance();
}

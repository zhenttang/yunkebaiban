import { AIStoreExtension } from '@yunke/core/blocksuite/store-extensions/ai';
import type { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import { StoreExtensionManager } from '@blocksuite/yunke/ext-loader';
import { getInternalStoreExtensions } from '@blocksuite/yunke/extensions/store';

import { FeatureFlagStoreExtension } from '../store-extensions/feature-flag';

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
    console.log('📦 [StoreProvider] 初始化 StoreExtensionManager');
    
    this._manager = new StoreExtensionManager([
      ...getInternalStoreExtensions(),
      AIStoreExtension,
      FeatureFlagStoreExtension,
    ]);
    
    console.log('✅ [StoreProvider] StoreExtensionManager 初始化完成');
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

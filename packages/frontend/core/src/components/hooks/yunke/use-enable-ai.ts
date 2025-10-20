import { ServerService } from '@yunke/core/modules/cloud';
import { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import { useLiveData, useService } from '@toeverything/infra';

export const useEnableAI = () => {
  const featureFlagService = useService(FeatureFlagService);
  const aiFeature = useLiveData(featureFlagService?.flags?.enable_ai?.$ || null);

  const serverService = useService(ServerService);
  const serverConfig = useLiveData(serverService.server.features$);
  const aiConfig = serverConfig.copilot;

  return aiFeature && aiConfig;
};

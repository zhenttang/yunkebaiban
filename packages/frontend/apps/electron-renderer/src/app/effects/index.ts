import { setupEvents } from './events';
import { setupModules } from './modules';
import { setupStoreManager } from './store-manager';

export async function setupEffects() {
  const { framework, frameworkProvider } = setupModules();
  await setupStoreManager(framework);
  setupEvents(frameworkProvider);
  return { framework, frameworkProvider };
}

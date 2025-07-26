import type { Framework } from '@toeverything/infra';
import { ConsoleHomepageService } from '../services/console-homepage';

export function configureConsoleHomepageModule(framework: Framework) {
  framework.service(ConsoleHomepageService);
}
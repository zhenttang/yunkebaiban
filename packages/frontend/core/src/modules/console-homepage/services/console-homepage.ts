import { Service } from '@toeverything/infra';
import { ConsoleHomepageManager } from '../entities/console-homepage-manager';

export class ConsoleHomepageService extends Service {
  private manager: ConsoleHomepageManager;

  constructor() {
    super();
    this.manager = new ConsoleHomepageManager();
  }

  /**
   * 手动显示控制台欢迎页面
   */
  showWelcomePage() {
    this.manager.showWelcomePageManually();
  }

  /**
   * 重置欢迎页面显示状态，下次打开控制台时会重新显示
   */
  resetWelcomeStatus() {
    this.manager.resetWelcomePageStatus();
  }

  /**
   * 获取管理器实例，用于高级操作
   */
  getManager() {
    return this.manager;
  }

  override dispose() {
    // 清理资源
    super.dispose();
  }
}
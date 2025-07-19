import { StorageSettings } from '../storages';
import type { AppConfig } from '../config';

/**
 * 存储配置操作组件
 */
export function StorageConfigOperation({ appConfig }: { appConfig: AppConfig }) {
  return <StorageSettings />;
}
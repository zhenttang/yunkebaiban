import { createIdentifier } from '@toeverything/infra';
import type { Observable } from 'rxjs';

export interface EditorSettingProvider {
  set(key: string, value: string): void;
  watchAll(): Observable<Record<string, string>>;
}

export const EditorSettingProvider = createIdentifier<EditorSettingProvider>(
  '编辑器设置提供者'
);

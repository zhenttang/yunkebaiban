import { createIdentifier, type Memento } from '@toeverything/infra';

export interface WorkspaceLocalState extends Memento {}
export interface WorkspaceLocalCache extends Memento {}

export const WorkspaceLocalState = createIdentifier<WorkspaceLocalState>(
  '工作区本地状态'
);

export const WorkspaceLocalCache = createIdentifier<WorkspaceLocalCache>(
  '工作区本地缓存'
);

import type { DocMode } from '@blocksuite/yunke/model';

import type { WorkspaceMetadata } from '../workspace';

export type SettingTab =
  | 'shortcuts'
  | 'notifications'
  | 'appearance'
  | 'about'
  | 'plans'
  | 'billing'
  | 'offline'
  | 'backup' // electron only
  | 'experimental-features'
  | 'editor'
  | 'account'
  | 'meetings'
  | `workspace:${'preference' | 'properties' | 'members' | 'storage' | 'billing' | 'license' | 'integrations' | 'embedding' | 'search'}`;

export type DialogProps<T extends (...args: any[]) => any> = Parameters<T>[0];
export type DialogResult<T extends (...args: any[]) => any> = Awaited<
  ReturnType<T>
>;

export type OpenedDialog<T extends Record<string, (...args: any[]) => any>> = {
  [K in keyof T]: {
    type: K;
    props: DialogProps<T[K]>;
    callback?: (result?: DialogResult<T[K]>) => void;
    id: string;
  };
}[keyof T];

export type GLOBAL_DIALOG_SCHEMA = {
  'create-workspace': (props: { serverId?: string }) => {
    metadata: WorkspaceMetadata;
    defaultDocId?: string;
  };
  'import-workspace': () => {
    workspace: WorkspaceMetadata;
  };
  'import-template': (props: {
    templateName: string;
    templateMode: DocMode;
    snapshotUrl: string;
  }) => void;
  'sign-in': (props: { server?: string; step?: string }) => void;
  'change-password': (props: { server?: string }) => void;
  'verify-email': (props: { server?: string; changeEmail?: boolean }) => void;
  'enable-cloud': (props: {
    workspaceId: string;
    openPageId?: string;
    serverId?: string;
  }) => boolean;
  'deleted-account': () => void;
  'contact-us': () => void;
};

export type WORKSPACE_DIALOG_SCHEMA = {
  setting: (props: { activeTab?: SettingTab; scrollAnchor?: string }) => void;
  'doc-info': (props: { docId: string }) => void;
  'doc-selector': (props: {
    init: string[];
    onBeforeConfirm?: (ids: string[], cb: () => void) => void;
  }) => string[];
  'collection-selector': (props: {
    init: string[];
    onBeforeConfirm?: (ids: string[], cb: () => void) => void;
  }) => string[];
  'collection-editor': (props: {
    collectionId: string;
    mode?: 'page' | 'rule';
  }) => void;
  'tag-selector': (props: {
    init: string[];
    onBeforeConfirm?: (ids: string[], cb: () => void) => void;
  }) => string[];
  'date-selector': (props: {
    position?: [number, number, number, number]; // [x, y, width, height]
    onSelect?: (date?: string) => void;
  }) => string;
  import: () => {
    docIds: string[];
    entryId?: string;
    isWorkspaceFile?: boolean;
  };
};

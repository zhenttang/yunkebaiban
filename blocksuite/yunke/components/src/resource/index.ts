import { ResourceStatus } from './status';

export * from './resource';
export * from './status';

export function effects() {
  customElements.define('yunke-resource-status', ResourceStatus);
}

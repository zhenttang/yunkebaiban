import { Service } from '@toeverything/infra';
import { type Observable } from 'rxjs';

import { FilterProvider } from '../../provider';
import type { FilterParams } from '../../types';

export class SystemFilterProvider extends Service implements FilterProvider {
  filter$(params: FilterParams): Observable<Set<string>> {
    const provider = this.framework.getOptional(
      FilterProvider('system:' + params.key)
    );
    if (!provider) {
      throw new Error('不支持的系统过滤器：' + params.key);
    }
    return provider.filter$(params);
  }
}

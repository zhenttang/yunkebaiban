import type { WorkspacePropertyService } from '@yunke/core/modules/workspace-property';
import { Service } from '@toeverything/infra';
import type { Observable } from 'rxjs';
import { switchMap } from 'rxjs';

import { GroupByProvider } from '../../provider';
import type { GroupByParams } from '../../types';

export class PropertyGroupByProvider
  extends Service
  implements GroupByProvider
{
  constructor(
    private readonly workspacePropertyService: WorkspacePropertyService
  ) {
    super();
  }

  groupBy$(
    items$: Observable<Set<string>>,
    params: GroupByParams
  ): Observable<Map<string, Set<string>>> {
    const property$ = this.workspacePropertyService.propertyInfo$(params.key);

    return property$.pipe(
      switchMap(property => {
        if (!property) {
          throw new Error('未知属性');
        }
        const type = property.type;
        const provider = this.framework.getOptional(
          GroupByProvider('property:' + type)
        );
        if (!provider) {
          throw new Error('不支持的属性类型');
        }
        return provider.groupBy$(items$, params);
      })
    );
  }
}

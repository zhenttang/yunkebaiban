import '@yunke/core/bootstrap/electron';
import '@yunke/core/bootstrap/cleanup';
import '@yunke/component/theme';
import './global.css';

import { apis } from '@yunke/electron-api';
import { bindNativeDBApis } from '@yunke/nbstore/sqlite';
import { bindNativeDBV1Apis } from '@yunke/nbstore/sqlite/v1';

// 🔍 调试：检查 APIs 状态
console.info('🔧 [setup.ts] APIs 检查:', {
  apisExists: !!apis,
  nbstoreExists: !!(apis?.nbstore),
  dbExists: !!(apis?.db),
  availableKeys: apis ? Object.keys(apis) : [],
});

// 检查APIs是否存在以及是否包含必要的属性
if (apis && apis.nbstore) {
  console.info('✅ [setup.ts] 绑定 nbstore API');
  bindNativeDBApis(apis.nbstore);
} else {
  console.warn('❌ [setup.ts] 当前环境中nbstore API不可用');
}

if (apis && apis.db) {
  console.info('✅ [setup.ts] 绑定 db API');
  bindNativeDBV1Apis(apis.db);
} else {
  console.warn('❌ [setup.ts] 当前环境中数据库API不可用');
}

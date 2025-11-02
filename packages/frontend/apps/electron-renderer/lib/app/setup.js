import '@yunke/core/bootstrap/electron';
import '@yunke/core/bootstrap/cleanup';
import '@yunke/component/theme';
import './global.css';
import { apis } from '@yunke/electron-api';
import { bindNativeDBApis } from '@yunke/nbstore/sqlite';
import { bindNativeDBV1Apis } from '@yunke/nbstore/sqlite/v1';
// 检查APIs是否存在以及是否包含必要的属性
if (apis && apis.nbstore) {
    bindNativeDBApis(apis.nbstore);
}
else {
    console.warn('当前环境中nbstore API不可用');
}
if (apis && apis.db) {
    bindNativeDBV1Apis(apis.db);
}
else {
    console.warn('当前环境中数据库API不可用');
}
//# sourceMappingURL=setup.js.map
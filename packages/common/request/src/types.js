/**
 * 服务器环境类型
 */
export var EnvironmentType;
(function (EnvironmentType) {
    EnvironmentType["DEV"] = "development";
    EnvironmentType["TEST"] = "test";
    EnvironmentType["PROD"] = "production";
})(EnvironmentType || (EnvironmentType = {}));
/**
 * 请求方法
 */
export var RequestMethod;
(function (RequestMethod) {
    RequestMethod["GET"] = "GET";
    RequestMethod["POST"] = "POST";
    RequestMethod["PUT"] = "PUT";
    RequestMethod["DELETE"] = "DELETE";
    RequestMethod["PATCH"] = "PATCH";
})(RequestMethod || (RequestMethod = {}));
/**
 * 请求优先级
 */
export var RequestPriority;
(function (RequestPriority) {
    RequestPriority["LOW"] = "low";
    RequestPriority["NORMAL"] = "normal";
    RequestPriority["HIGH"] = "high";
})(RequestPriority || (RequestPriority = {}));
// 导出社区相关类型
export * from './types/community';
//# sourceMappingURL=types.js.map
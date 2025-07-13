export var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["DefaultRuntimeError"] = 1] = "DefaultRuntimeError";
    ErrorCode[ErrorCode["ReactiveProxyError"] = 2] = "ReactiveProxyError";
    ErrorCode[ErrorCode["DocCollectionError"] = 3] = "DocCollectionError";
    ErrorCode[ErrorCode["ModelCRUDError"] = 4] = "ModelCRUDError";
    ErrorCode[ErrorCode["ValueNotExists"] = 5] = "ValueNotExists";
    ErrorCode[ErrorCode["ValueNotInstanceOf"] = 6] = "ValueNotInstanceOf";
    ErrorCode[ErrorCode["ValueNotEqual"] = 7] = "ValueNotEqual";
    ErrorCode[ErrorCode["MigrationError"] = 8] = "MigrationError";
    ErrorCode[ErrorCode["SchemaValidateError"] = 9] = "SchemaValidateError";
    ErrorCode[ErrorCode["TransformerError"] = 10] = "TransformerError";
    ErrorCode[ErrorCode["InlineEditorError"] = 11] = "InlineEditorError";
    ErrorCode[ErrorCode["TransformerNotImplementedError"] = 12] = "TransformerNotImplementedError";
    ErrorCode[ErrorCode["EdgelessExportError"] = 13] = "EdgelessExportError";
    ErrorCode[ErrorCode["CommandError"] = 14] = "CommandError";
    ErrorCode[ErrorCode["EventDispatcherError"] = 15] = "EventDispatcherError";
    ErrorCode[ErrorCode["SelectionError"] = 16] = "SelectionError";
    ErrorCode[ErrorCode["GfxBlockElementError"] = 17] = "GfxBlockElementError";
    ErrorCode[ErrorCode["MissingViewModelError"] = 18] = "MissingViewModelError";
    ErrorCode[ErrorCode["DatabaseBlockError"] = 19] = "DatabaseBlockError";
    ErrorCode[ErrorCode["ParsingError"] = 20] = "ParsingError";
    ErrorCode[ErrorCode["UserAbortError"] = 21] = "UserAbortError";
    ErrorCode[ErrorCode["ExecutionError"] = 22] = "ExecutionError";
    // Fatal error should be greater than 10000
    ErrorCode[ErrorCode["DefaultFatalError"] = 10000] = "DefaultFatalError";
    ErrorCode[ErrorCode["NoRootModelError"] = 10001] = "NoRootModelError";
    ErrorCode[ErrorCode["NoSurfaceModelError"] = 10002] = "NoSurfaceModelError";
    ErrorCode[ErrorCode["NoneSupportedSSRError"] = 10003] = "NoneSupportedSSRError";
})(ErrorCode || (ErrorCode = {}));
//# sourceMappingURL=code.js.map
export var DocEngineStep;
(function (DocEngineStep) {
    DocEngineStep[DocEngineStep["Stopped"] = 0] = "Stopped";
    DocEngineStep[DocEngineStep["Synced"] = 2] = "Synced";
    DocEngineStep[DocEngineStep["Syncing"] = 1] = "Syncing";
})(DocEngineStep || (DocEngineStep = {}));
export var DocPeerStep;
(function (DocPeerStep) {
    DocPeerStep[DocPeerStep["Loaded"] = 4.5] = "Loaded";
    DocPeerStep[DocPeerStep["LoadingRootDoc"] = 2] = "LoadingRootDoc";
    DocPeerStep[DocPeerStep["LoadingSubDoc"] = 3] = "LoadingSubDoc";
    DocPeerStep[DocPeerStep["Retrying"] = 1] = "Retrying";
    DocPeerStep[DocPeerStep["Stopped"] = 0] = "Stopped";
    DocPeerStep[DocPeerStep["Synced"] = 6] = "Synced";
    DocPeerStep[DocPeerStep["Syncing"] = 5] = "Syncing";
})(DocPeerStep || (DocPeerStep = {}));
//# sourceMappingURL=consts.js.map
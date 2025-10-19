var __addDisposableResource = (this && this.__addDisposableResource) || function (env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose, inner;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
            if (async) inner = dispose;
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        if (inner) dispose = function() { try { inner.call(this); } catch (e) { return Promise.reject(e); } };
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
var __disposeResources = (this && this.__disposeResources) || (function (SuppressedError) {
    return function (env) {
        function fail(e) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        var r, s = 0;
        function next() {
            while (r = env.stack.pop()) {
                try {
                    if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
                    if (r.dispose) {
                        var result = r.dispose.call(r.value);
                        if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                    }
                    else s |= 1;
                }
                catch (e) {
                    fail(e);
                }
            }
            if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
            if (env.hasError) throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
import { DesktopApiService } from '@yunke/core/modules/desktop-api';
import { WorkspaceDialogService } from '@yunke/core/modules/dialogs';
import { DocsService } from '@yunke/core/modules/doc';
import { JournalService } from '@yunke/core/modules/journal';
import { LifecycleService } from '@yunke/core/modules/lifecycle';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import { apis, events } from '@yunke/electron-api';
import { setupRecordingEvents } from './recording';
import { getCurrentWorkspace } from './utils';
export function setupEvents(frameworkProvider) {
    // 设置应用程序生命周期事件，并触发应用程序启动事件
    window.addEventListener('focus', () => {
        frameworkProvider.get(LifecycleService).applicationFocus();
    });
    frameworkProvider.get(LifecycleService).applicationStart();
    window.addEventListener('unload', () => {
        frameworkProvider
            .get(DesktopApiService)
            .api.handler.ui.pingAppLayoutReady(false)
            .catch(console.error);
    });
    events?.applicationMenu.openInSettingModal(({ activeTab, scrollAnchor }) => {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const currentWorkspace = __addDisposableResource(env_1, getCurrentWorkspace(frameworkProvider), false);
            if (!currentWorkspace) {
                return;
            }
            const { workspace } = currentWorkspace;
            const workspaceDialogService = workspace.scope.get(WorkspaceDialogService);
            // 先关闭所有其他对话框
            workspaceDialogService.closeAll();
            workspaceDialogService.open('setting', {
                activeTab: activeTab,
                scrollAnchor,
            });
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    });
    events?.applicationMenu.onNewPageAction(type => {
        apis?.ui
            .isActiveTab()
            .then(isActive => {
            const env_2 = { stack: [], error: void 0, hasError: false };
            try {
                if (!isActive) {
                    return;
                }
                const currentWorkspace = __addDisposableResource(env_2, getCurrentWorkspace(frameworkProvider), false);
                if (!currentWorkspace) {
                    return;
                }
                const { workspace } = currentWorkspace;
                const docsService = workspace.scope.get(DocsService);
                const page = docsService.createDoc({ primaryMode: type });
                workspace.scope.get(WorkbenchService).workbench.openDoc(page.id);
            }
            catch (e_2) {
                env_2.error = e_2;
                env_2.hasError = true;
            }
            finally {
                __disposeResources(env_2);
            }
        })
            .catch(err => {
            console.error(err);
        });
    });
    events?.applicationMenu.onOpenJournal(() => {
        const env_3 = { stack: [], error: void 0, hasError: false };
        try {
            const currentWorkspace = __addDisposableResource(env_3, getCurrentWorkspace(frameworkProvider), false);
            if (!currentWorkspace) {
                return;
            }
            const { workspace, dispose } = currentWorkspace;
            const workbench = workspace.scope.get(WorkbenchService).workbench;
            const journalService = workspace.scope.get(JournalService);
            const docId = journalService.ensureJournalByDate(new Date()).id;
            workbench.openDoc(docId);
            dispose();
        }
        catch (e_3) {
            env_3.error = e_3;
            env_3.hasError = true;
        }
        finally {
            __disposeResources(env_3);
        }
    });
    setupRecordingEvents(frameworkProvider);
}
//# sourceMappingURL=events.js.map
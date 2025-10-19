import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@yunke/component';
import { useAsyncCallback } from '@yunke/core/components/hooks/affine-async-hooks';
import { appIconMap } from '@yunke/core/utils';
import { createStreamEncoder, encodeRawBufferToOpus, } from '@yunke/core/utils/opus-encoding';
import { apis, events } from '@yunke/electron-api';
import { useI18n } from '@yunke/i18n';
import track from '@yunke/track';
import { useEffect, useMemo, useState } from 'react';
import * as styles from './styles.css';
export const useRecordingStatus = () => {
    const [status, setStatus] = useState(null);
    useEffect(() => {
        // Get initial status
        apis?.recording
            .getCurrentRecording()
            .then(status => setStatus(status))
            .catch(console.error);
        // Subscribe to status changes
        const unsubscribe = events?.recording.onRecordingStatusChanged(status => setStatus(status));
        return () => {
            unsubscribe?.();
        };
    }, []);
    return status;
};
const appIcon = appIconMap[BUILD_CONFIG.appBuildType];
export function Recording() {
    const status = useRecordingStatus();
    const t = useI18n();
    const textElement = useMemo(() => {
        if (!status) {
            return null;
        }
        if (status.status === 'new') {
            return t['com.affine.recording.new']();
        }
        else if (status.status === 'create-block-success') {
            return t['com.affine.recording.success.prompt']();
        }
        else if (status.status === 'create-block-failed') {
            return t['com.affine.recording.failed.prompt']();
        }
        else if (status.status === 'recording' ||
            status.status === 'ready' ||
            status.status === 'stopped') {
            if (status.appName) {
                return t['com.affine.recording.recording']({
                    appName: status.appName,
                });
            }
            else {
                return t['com.affine.recording.recording.unnamed']();
            }
        }
        return null;
    }, [status, t]);
    const handleDismiss = useAsyncCallback(async () => {
        await apis?.popup?.dismissCurrentRecording();
        track.popup.$.recordingBar.dismissRecording({
            type: '会议录制',
            appName: status?.appName || '系统音频',
        });
    }, [status]);
    const handleStopRecording = useAsyncCallback(async () => {
        if (!status) {
            return;
        }
        track.popup.$.recordingBar.finishRecording({
            type: '会议录制',
            appName: status.appName || '系统音频',
        });
        await apis?.recording?.stopRecording(status.id);
    }, [status]);
    const handleProcessStoppedRecording = useAsyncCallback(async (currentStreamEncoder) => {
        let id;
        try {
            const result = await apis?.recording?.getCurrentRecording();
            if (!result) {
                return;
            }
            id = result.id;
            const { filepath, sampleRate, numberOfChannels } = result;
            if (!filepath || !sampleRate || !numberOfChannels) {
                return;
            }
            const [buffer] = await Promise.all([
                currentStreamEncoder
                    ? currentStreamEncoder.finish()
                    : encodeRawBufferToOpus({
                        filepath,
                        sampleRate,
                        numberOfChannels,
                    }),
                new Promise(resolve => {
                    setTimeout(() => {
                        resolve();
                    }, 500); // wait at least 500ms for better user experience
                }),
            ]);
            await apis?.recording.readyRecording(result.id, buffer);
        }
        catch (error) {
            console.error('停止录音失败', error);
            await apis?.popup?.dismissCurrentRecording();
            if (id) {
                await apis?.recording.removeRecording(id);
            }
        }
    }, []);
    useEffect(() => {
        let removed = false;
        let currentStreamEncoder;
        apis?.recording
            .getCurrentRecording()
            .then(status => {
            if (status) {
                return handleRecordingStatusChanged(status);
            }
            return;
        })
            .catch(console.error);
        const handleRecordingStatusChanged = async (status) => {
            if (removed) {
                return;
            }
            if (status?.status === 'new') {
                track.popup.$.recordingBar.toggleRecordingBar({
                    type: '会议录制',
                    appName: status.appName || '系统音频',
                });
            }
            if (status?.status === 'recording' &&
                status.sampleRate &&
                status.numberOfChannels &&
                (!currentStreamEncoder || currentStreamEncoder.id !== status.id)) {
                currentStreamEncoder?.close();
                currentStreamEncoder = createStreamEncoder(status.id, {
                    sampleRate: status.sampleRate,
                    numberOfChannels: status.numberOfChannels,
                });
                currentStreamEncoder.poll().catch(console.error);
            }
            if (status?.status === 'stopped') {
                handleProcessStoppedRecording(currentStreamEncoder);
                currentStreamEncoder = undefined;
            }
        };
        // allow processing stopped event in tray menu as well:
        const unsubscribe = events?.recording.onRecordingStatusChanged(status => {
            if (status) {
                handleRecordingStatusChanged(status).catch(console.error);
            }
        });
        return () => {
            removed = true;
            unsubscribe?.();
            currentStreamEncoder?.close();
        };
    }, [handleProcessStoppedRecording]);
    const handleStartRecording = useAsyncCallback(async () => {
        if (!status) {
            return;
        }
        track.popup.$.recordingBar.startRecording({
            type: '会议录制',
            appName: status.appName || '系统音频',
        });
        await apis?.recording?.startRecording(status.appGroupId);
    }, [status]);
    const handleOpenFile = useAsyncCallback(async () => {
        if (!status) {
            return;
        }
        await apis?.recording?.showSavedRecordings(status.filepath);
    }, [status]);
    const controlsElement = useMemo(() => {
        if (!status) {
            return null;
        }
        if (status.status === 'new') {
            return (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "plain", onClick: handleDismiss, children: t['com.affine.recording.dismiss']() }), _jsx(Button, { onClick: handleStartRecording, variant: "primary", prefix: _jsx("div", { className: styles.recordingIcon }), children: t['com.affine.recording.start']() })] }));
        }
        else if (status.status === 'recording') {
            return (_jsx(Button, { variant: "error", onClick: handleStopRecording, children: t['com.affine.recording.stop']() }));
        }
        else if (status.status === 'stopped' || status.status === 'ready') {
            return (_jsx(Button, { variant: "error", onClick: handleDismiss, loading: true, disabled: true }));
        }
        else if (status.status === 'create-block-success') {
            return (_jsx(Button, { variant: "primary", onClick: handleDismiss, children: t['com.affine.recording.success.button']() }));
        }
        else if (status.status === 'create-block-failed') {
            return (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "plain", onClick: handleDismiss, children: t['com.affine.recording.dismiss']() }), _jsx(Button, { variant: "error", onClick: handleOpenFile, children: t['com.affine.recording.failed.button']() })] }));
        }
        return null;
    }, [
        handleDismiss,
        handleOpenFile,
        handleStartRecording,
        handleStopRecording,
        status,
        t,
    ]);
    if (!status) {
        return null;
    }
    return (_jsxs("div", { className: styles.root, children: [_jsx("img", { className: styles.affineIcon, src: appIcon, alt: "AFFiNE\u56FE\u6807" }), _jsx("div", { className: styles.text, children: textElement }), _jsx("div", { className: styles.controls, children: controlsElement })] }));
}
//# sourceMappingURL=index.js.map
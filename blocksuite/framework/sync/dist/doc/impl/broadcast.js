import { diffUpdate, encodeStateVectorFromUpdate, mergeUpdates } from 'yjs';
import { MANUALLY_STOP } from '../../utils/throw-if-aborted.js';
export class BroadcastChannelDocSource {
    constructor(channelName = 'blocksuite:doc') {
        this.channelName = channelName;
        this._onMessage = (event) => {
            if (event.data.type === 'init') {
                for (const [docId, data] of this.docMap) {
                    this.channel.postMessage({
                        type: 'update',
                        docId,
                        data,
                    });
                }
                return;
            }
            const { docId, data } = event.data;
            const update = this.docMap.get(docId);
            if (update) {
                this.docMap.set(docId, mergeUpdates([update, data]));
            }
            else {
                this.docMap.set(docId, data);
            }
        };
        this.channel = new BroadcastChannel(this.channelName);
        this.docMap = new Map();
        this.name = 'broadcast-channel';
        this.channel.addEventListener('message', this._onMessage);
        this.channel.postMessage({
            type: 'init',
        });
    }
    pull(docId, state) {
        const update = this.docMap.get(docId);
        if (!update)
            return null;
        const diff = state.length ? diffUpdate(update, state) : update;
        return { data: diff, state: encodeStateVectorFromUpdate(update) };
    }
    push(docId, data) {
        const update = this.docMap.get(docId);
        if (update) {
            this.docMap.set(docId, mergeUpdates([update, data]));
        }
        else {
            this.docMap.set(docId, data);
        }
        const doc = this.docMap.get(docId);
        if (!doc) {
            console.error('data is not found when syncing broadcast channel');
            return;
        }
        this.channel.postMessage({
            type: 'update',
            docId,
            data: this.docMap.get(docId),
        });
    }
    subscribe(cb) {
        const abortController = new AbortController();
        this.channel.addEventListener('message', (event) => {
            if (event.data.type !== 'update')
                return;
            const { docId, data } = event.data;
            cb(docId, data);
        }, { signal: abortController.signal });
        return () => {
            abortController.abort(MANUALLY_STOP);
        };
    }
}
//# sourceMappingURL=broadcast.js.map
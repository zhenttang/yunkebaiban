import { applyAwarenessUpdate, encodeAwarenessUpdate, } from 'y-protocols/awareness';
export class BroadcastChannelAwarenessSource {
    constructor(channelName) {
        this.channelName = channelName;
        this.awareness = null;
        this.channel = null;
        this.handleAwarenessUpdate = (changes, origin) => {
            if (origin === 'remote') {
                return;
            }
            const changedClients = Object.values(changes).reduce((res, cur) => res.concat(cur));
            const update = encodeAwarenessUpdate(this.awareness, changedClients);
            this.channel?.postMessage({
                type: 'update',
                update: update,
            });
        };
    }
    connect(awareness) {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.postMessage({
            type: 'connect',
        });
        this.awareness = awareness;
        awareness.on('update', this.handleAwarenessUpdate);
        this.channel.addEventListener('message', (event) => {
            this.handleChannelMessage(event);
        });
    }
    disconnect() {
        this.awareness?.off('update', this.handleAwarenessUpdate);
        this.channel?.close();
        this.channel = null;
    }
    handleChannelMessage(event) {
        if (event.data.type === 'update') {
            const update = event.data.update;
            applyAwarenessUpdate(this.awareness, update, 'remote');
        }
        if (event.data.type === 'connect') {
            this.channel?.postMessage({
                type: 'update',
                update: encodeAwarenessUpdate(this.awareness, [
                    this.awareness.clientID,
                ]),
            });
        }
    }
}
//# sourceMappingURL=broadcast.js.map
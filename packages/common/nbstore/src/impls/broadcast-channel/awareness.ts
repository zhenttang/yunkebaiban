import { nanoid } from 'nanoid';

import { type AwarenessRecord, AwarenessStorageBase } from '../../storage';
import { BroadcastChannelConnection } from './channel';

type ChannelMessage =
  | {
      type: 'awareness-update';
      docId: string;
      bin: Uint8Array;
      origin?: string;
    }
  | {
      type: 'awareness-collect';
      docId: string;
      collectId: string;
    }
  | {
      type: 'awareness-collect-feedback';
      docId: string;
      bin: Uint8Array;
      collectId: string;
    };

interface BroadcastChannelAwarenessStorageOptions {
  id: string;
}

export class BroadcastChannelAwarenessStorage extends AwarenessStorageBase {
  static readonly identifier = 'BroadcastChannelAwarenessStorage';

  override readonly storageType = 'awareness';
  override readonly connection = new BroadcastChannelConnection({
    id: this.options.id,
  });

  constructor(
    private readonly options: BroadcastChannelAwarenessStorageOptions
  ) {
    super();
  }

  private readonly subscriptions = new Map<
    string,
    Set<{
      onUpdate: (update: AwarenessRecord, origin?: string) => void;
      onCollect: () => Promise<AwarenessRecord | null>;
    }>
  >();

  override async update(record: AwarenessRecord, origin?: string): Promise<void> {
    const subscribers = this.subscriptions.get(record.docId);
    if (subscribers) {
      subscribers.forEach(subscriber => subscriber.onUpdate(record, origin));
    }
    this.connection.connect();
    try {
      await this.connection.waitForConnected();
      this.connection.inner.postMessage({
        type: 'awareness-update',
        docId: record.docId,
        bin: record.bin,
        origin,
      } satisfies ChannelMessage);
    } catch (error) {
      console.error('error in broadcast channel update', error);
    }
  }

  override subscribeUpdate(
    id: string,
    onUpdate: (update: AwarenessRecord, origin?: string) => void,
    onCollect: () => Promise<AwarenessRecord | null>
  ): () => void {
    const subscribers = this.subscriptions.get(id) ?? new Set();
    subscribers.forEach(subscriber => {
      subscriber
        .onCollect()
        .then(awareness => {
          if (awareness) {
            onUpdate(awareness);
          }
        })
        .catch(error => {
          console.error('error in on collect awareness', error);
        });
    });

    const collectUniqueId = nanoid();

    const onChannelMessage = (message: MessageEvent<ChannelMessage>) => {
      if (
        message.data.type === 'awareness-update' &&
        message.data.docId === id
      ) {
        onUpdate(
          {
            docId: message.data.docId,
            bin: message.data.bin,
          },
          message.data.origin
        );
      }
      if (
        message.data.type === 'awareness-collect' &&
        message.data.docId === id
      ) {
        onCollect()
          .then(awareness => {
            if (awareness) {
              if (channel) {
                channel.postMessage({
                  type: 'awareness-collect-feedback',
                  docId: message.data.docId,
                  bin: awareness.bin,
                  collectId: collectUniqueId,
                } satisfies ChannelMessage);
              }
            }
          })
          .catch(error => {
            console.error('error in on collect awareness', error);
          });
      }
      if (
        message.data.type === 'awareness-collect-feedback' &&
        message.data.docId === id &&
        message.data.collectId === collectUniqueId
      ) {
        onUpdate({
          docId: message.data.docId,
          bin: message.data.bin,
        });
      }
    };

    let channel: BroadcastChannel | null = null;
    let disposed = false;
    const setupChannel = async () => {
      this.connection.connect();
      try {
        await this.connection.waitForConnected();
      } catch (error) {
        if (!disposed) {
          console.error('error in broadcast channel connect', error);
        }
        return;
      }
      if (disposed) return;
      channel = this.connection.inner;
      channel.addEventListener('message', onChannelMessage);
      channel.postMessage({
        type: 'awareness-collect',
        docId: id,
        collectId: collectUniqueId,
      } satisfies ChannelMessage);
    };
    void setupChannel();

    const subscriber = {
      onUpdate,
      onCollect,
    };
    subscribers.add(subscriber);
    this.subscriptions.set(id, subscribers);

    return () => {
      disposed = true;
      subscribers.delete(subscriber);
      if (channel) {
        channel.removeEventListener('message', onChannelMessage);
      }
    };
  }
}

import { AIChatBlockSchema } from '@yunke/core/blocksuite/ai/blocks/ai-chat-block/model';
import { TranscriptionBlockSchema } from '@yunke/core/blocksuite/ai/blocks/transcription-block/model';
import { YunkeSchemas } from '@blocksuite/yunke/schemas';
import { Schema } from '@blocksuite/yunke/store';

let _schema: Schema | null = null;
export function getYUNKEWorkspaceSchema() {
  if (!_schema) {
    _schema = new Schema();

    _schema.register([
      ...YunkeSchemas,
      AIChatBlockSchema,
      TranscriptionBlockSchema,
    ]);
  }

  return _schema;
}

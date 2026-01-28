import { AIChatBlockSchema } from '@yunke/core/blocksuite/ai/blocks/ai-chat-block/model';
import { TranscriptionBlockSchema } from '@yunke/core/blocksuite/ai/blocks/transcription-block/model';
import { YunkeSchemas } from '@blocksuite/yunke/schemas';
import { Schema } from '@blocksuite/yunke/store';

/**
 * 🔧 Bug #13 修复：Affine -> Yunke flavour 兼容性映射
 * 
 * 旧版本数据使用 affine:* 前缀，新代码使用 yunke:* 前缀
 * 此映射确保旧数据能被正确加载
 */
const FLAVOUR_ALIAS_MAP: Record<string, string> = {
  'affine:page': 'yunke:page',
  'affine:surface': 'yunke:surface',
  'affine:note': 'yunke:note',
  'affine:paragraph': 'yunke:paragraph',
  'affine:list': 'yunke:list',
  'affine:code': 'yunke:code',
  'affine:divider': 'yunke:divider',
  'affine:image': 'yunke:image',
  'affine:bookmark': 'yunke:bookmark',
  'affine:attachment': 'yunke:attachment',
  'affine:embed-linked-doc': 'yunke:embed-linked-doc',
  'affine:embed-synced-doc': 'yunke:embed-synced-doc',
  'affine:embed-html': 'yunke:embed-html',
  'affine:embed-github': 'yunke:embed-github',
  'affine:embed-youtube': 'yunke:embed-youtube',
  'affine:embed-figma': 'yunke:embed-figma',
  'affine:embed-loom': 'yunke:embed-loom',
  'affine:database': 'yunke:database',
  'affine:data-view': 'yunke:data-view',
  'affine:frame': 'yunke:frame',
  'affine:callout': 'yunke:callout',
  'affine:latex': 'yunke:latex',
  'affine:edgeless-text': 'yunke:edgeless-text',
};

let _schema: Schema | null = null;
export function getYUNKEWorkspaceSchema() {
  if (!_schema) {
    _schema = new Schema();

    _schema.register([
      ...YunkeSchemas,
      AIChatBlockSchema,
      TranscriptionBlockSchema,
    ]);

    // 🔧 Bug #13 修复：注册 affine:* -> yunke:* 别名
    // 将旧的 affine:* flavour 映射到对应的 yunke:* schema
    for (const [affineFlavour, yunkeFlavour] of Object.entries(FLAVOUR_ALIAS_MAP)) {
      const schema = _schema.flavourSchemaMap.get(yunkeFlavour);
      if (schema) {
        _schema.flavourSchemaMap.set(affineFlavour, schema);
      }
    }

    console.debug('[Schema] 已注册 affine -> yunke flavour 别名映射');
  }

  return _schema;
}

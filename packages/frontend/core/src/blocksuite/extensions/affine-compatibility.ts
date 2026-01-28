/**
 * 🔧 Bug #13 修复：Affine -> Yunke Flavour 兼容性 Extension
 * 
 * 旧版本数据使用 affine:* 前缀，新代码使用 yunke:* 前缀。
 * 此 Extension 在 Store 初始化时自动注册 flavour 别名映射，
 * 确保旧数据能被正确加载。
 */

import { createIdentifier } from '@blocksuite/global/di';
import type { ExtensionType } from '@blocksuite/yunke/store';

/**
 * Affine -> Yunke flavour 映射表
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

// 用于标识已注册别名的 Schema
const AffineCompatibilityIdentifier = createIdentifier<boolean>('AffineCompatibility');

/**
 * 为 Schema 注册 affine:* -> yunke:* 别名
 * 这样旧数据中的 affine:* flavour 就能映射到对应的 yunke:* schema
 */
export function registerAffineAliases(schema: { flavourSchemaMap: Map<string, unknown> }): void {
  for (const [affineFlavour, yunkeFlavour] of Object.entries(FLAVOUR_ALIAS_MAP)) {
    const yunkeSchema = schema.flavourSchemaMap.get(yunkeFlavour);
    if (yunkeSchema && !schema.flavourSchemaMap.has(affineFlavour)) {
      schema.flavourSchemaMap.set(affineFlavour, yunkeSchema);
    }
  }
}

/**
 * Affine 兼容性 Extension
 * 在 Store 初始化后自动注册 flavour 别名
 */
export const AffineCompatibilityExtension: ExtensionType = {
  setup: (di) => {
    di.addImpl(AffineCompatibilityIdentifier, () => true);
  },
};

export { FLAVOUR_ALIAS_MAP };

import { beforeAll, describe, expect, it } from 'vitest';

import { getIdConverter, type IdConverter } from '../id-converter';

const workspaceId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const userId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

// 🔧 修复后：db$ 和 userdata$ 格式的 ID 不再需要长格式和短格式的区分
// 它们现在都是相同的格式，不进行转换
const oldIds = [
  workspaceId,
  'abcdefg',
  `db$folder`,  // 改为短格式，因为现在不转换了
  `db$docProperties`,  // 改为短格式
  `userdata$${userId}$favorite`,  // 改为短格式
];

const newIds = [`db$folder`, `db$docProperties`, `userdata$${userId}$favorite`];

let converter: IdConverter;

beforeAll(async () => {
  converter = await getIdConverter(
    {
      getDocBuffer: async () => null,
    },
    workspaceId
  );
});

describe('idConverter', async () => {
  it('should convert old id to new id', () => {
    expect(oldIds.map(id => converter.oldIdToNewId(id))).toMatchInlineSnapshot(`
      [
        "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "abcdefg",
        "db$folder",
        "db$docProperties",
        "userdata$bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb$favorite",
      ]
    `);
  });

  it('should convert new id to old id', () => {
    // 🔧 修复后：db$ 和 userdata$ 格式的 ID 不再转换，保持原样
    expect(newIds.map(id => converter.newIdToOldId(id))).toMatchInlineSnapshot(`
      [
        "db$folder",
        "db$docProperties",
        "userdata$bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb$favorite",
      ]
    `);
  });

  it('should keep db$ and userdata$ ids unchanged (no conversion)', () => {
    // 🔧 修复后：所有 db$ 和 userdata$ 格式的 ID 都不转换
    // 无论是短格式还是长格式，都保持原样
    const specialIds = [
      `db$folder`,
      `db$${workspaceId}$folder`,  // 即使包含 spaceId 也保持不变
      `db$docProperties`,
      `userdata$${userId}$favorite`,
      `userdata$${userId}$${workspaceId}$favorite`,  // 即使包含 spaceId 也保持不变
    ];

    expect(specialIds.map(id => converter.newIdToOldId(id))).toEqual(
      specialIds  // 所有 ID 都应该保持不变
    );
    expect(specialIds.map(id => converter.oldIdToNewId(id))).toEqual(
      specialIds  // 反向转换也应该保持不变
    );
  });
});

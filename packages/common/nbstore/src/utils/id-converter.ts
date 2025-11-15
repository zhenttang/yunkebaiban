import {
  applyUpdate,
  type Array as YArray,
  Doc as YDoc,
  type Map as YMap,
} from 'yjs';

type PromiseResult<T> = T extends Promise<infer R> ? R : never;
export type IdConverter = PromiseResult<ReturnType<typeof getIdConverter>>;

export async function getIdConverter(
  storage: {
    getDocBuffer: (id: string) => Promise<Uint8Array | null>;
  },
  spaceId: string
) {
  const oldIdToNewId = { [spaceId]: spaceId };
  const newIdToOldId = { [spaceId]: spaceId };

  const rootDocBuffer = await storage.getDocBuffer(spaceId);
  if (rootDocBuffer) {
    const ydoc = new YDoc({
      guid: spaceId,
    });
    applyUpdate(ydoc, rootDocBuffer);

    // get all ids from rootDoc.meta.pages.[*].id, trust this id as normalized id
    const normalizedDocIds = (
      (ydoc.getMap('meta') as YMap<any> | undefined)?.get('pages') as
        | YArray<YMap<any>>
        | undefined
    )
      ?.map(i => i.get('id') as string)
      .filter(i => !!i);

    const spaces = ydoc.getMap('spaces') as YMap<any> | undefined;
    for (const pageId of normalizedDocIds ?? []) {
      const subdoc = spaces?.get(pageId);
      if (subdoc && subdoc instanceof YDoc) {
        oldIdToNewId[subdoc.guid] = pageId;
        newIdToOldId[pageId] = subdoc.guid;
      }
    }
  }

  return {
    newIdToOldId(newId: string) {
      // 🔧 修复：db$ 和 userdata$ 格式的 ID 不进行转换
      // 这些是特殊的系统文档 ID，服务器期望接收原始格式
      // 例如：db$docProperties 应该保持原样，不应该变成 db$${spaceId}$docProperties
      if (newId.startsWith(`db$`) || newId.startsWith(`userdata$`)) {
        return newId;
      }
      return newIdToOldId[newId] ?? newId;
    },
    oldIdToNewId(oldId: string) {
      // 🔧 修复：db$ 和 userdata$ 格式的 ID 不进行转换
      // 保持与 newIdToOldId 一致，直接返回
      if (oldId.startsWith(`db$`) || oldId.startsWith(`userdata$`)) {
        return oldId;
      }
      return oldIdToNewId[oldId] ?? oldId;
    },
  };
}

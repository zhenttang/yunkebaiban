/**
 * 工作区数据同步服务
 * 支持将工作区数据导出为 Yjs 快照格式，实现全平台互通
 * 包含：文档数据 + Blob 数据（图片、附件等）
 */

import type { Workspace } from '@blocksuite/affine/store';
import { Doc as YDoc, encodeStateAsUpdate, applyUpdate } from 'yjs';

// ============ 辅助函数 ============

// 并发控制：限制同时执行的 Promise 数量
async function runWithConcurrency<T>(
  items: T[],
  fn: (item: T) => Promise<unknown>,
  concurrency: number
): Promise<void> {
  const executing: Promise<unknown>[] = [];
  
  for (const item of items) {
    const promise = fn(item).then(() => {
      executing.splice(executing.indexOf(promise), 1);
    });
    executing.push(promise);
    
    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }
  
  await Promise.all(executing);
}

// 并发映射：限制并发数并返回结果
async function mapWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R | null>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];
  
  for (const item of items) {
    const promise = fn(item).then(result => {
      if (result !== null) {
        results.push(result);
      }
      executing.splice(executing.indexOf(promise), 1);
    });
    executing.push(promise);
    
    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }
  
  await Promise.all(executing);
  return results;
}

// 分块处理大数据的 Base64 转换，避免栈溢出
function arrayBufferToBase64Chunk(buffer: Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.byteLength));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

// 分块处理大 Base64 字符串的解码，避免栈溢出
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  
  // 分块处理，避免大字符串导致的性能问题
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const end = Math.min(i + chunkSize, len);
    for (let j = i; j < end; j++) {
      bytes[j] = binaryString.charCodeAt(j);
    }
  }
  return bytes;
}

// ============ 类型定义 ============

export interface WorkspaceSnapshot {
  version: number;
  workspaceId: string;
  timestamp: number;
  // 根文档（工作区元数据）
  rootDoc: Uint8Array;
  // 所有页面文档
  docs: Array<{
    id: string;
    guid: string;
    data: Uint8Array;
  }>;
  // Blob 数据（图片、附件等）
  blobs: Array<{
    key: string;
    data: string; // Base64 编码
    type: string;
  }>;
  // 统计信息
  docCount: number;
  blobCount: number;
}

/**
 * 文档存储接口
 */
interface DocStorageInterface {
  getDoc(docId: string): Promise<{ bin: Uint8Array; timestamp?: Date } | null>;
}

/**
 * 导出工作区为快照
 * 包含：根文档、所有页面文档、所有 Blob 数据
 * 
 * @param workspace - BlockSuite 工作区
 * @param docStorage - 可选的文档存储，如果提供则从存储直接读取数据（更可靠）
 */
export async function exportWorkspaceSnapshot(
  workspace: Workspace, 
  docStorage?: DocStorageInterface
): Promise<WorkspaceSnapshot> {
  const rootDoc = workspace.doc;
  
  // 1. 导出根文档
  let rootDocData: Uint8Array;
  if (docStorage) {
    // 从存储读取（更可靠）
    const rootDocRecord = await docStorage.getDoc(rootDoc.guid);
    rootDocData = rootDocRecord?.bin || encodeStateAsUpdate(rootDoc);
    console.log(`[WorkspaceSync] 从存储读取根文档: ${rootDoc.guid}, 大小: ${rootDocData.byteLength} bytes`);
  } else {
    // 从内存读取
    rootDocData = encodeStateAsUpdate(rootDoc);
    console.log(`[WorkspaceSync] 从内存读取根文档: ${rootDoc.guid}, 大小: ${rootDocData.byteLength} bytes`);
  }
  
  // 2. 导出所有页面文档（并发处理，限制并发数为 10）
  const allDocs = Array.from(workspace.docs);
  const DOC_CONCURRENCY = 10;
  
  const docs = await mapWithConcurrency(
    allDocs,
    async ([docId, doc]): Promise<{ id: string; guid: string; data: Uint8Array } | null> => {
      try {
        const store = doc.getStore();
        const guid = store?.spaceDoc?.guid || docId;
        
        let docData: Uint8Array;
        if (docStorage) {
          // 从存储读取（更可靠）
          const docRecord = await docStorage.getDoc(guid);
          if (docRecord?.bin) {
            docData = docRecord.bin;
            console.log(`[WorkspaceSync] 从存储读取文档: ${docId}, guid: ${guid}, 大小: ${docData.byteLength} bytes`);
          } else {
            // 存储中没有，尝试从内存读取
            docData = store?.spaceDoc ? encodeStateAsUpdate(store.spaceDoc) : new Uint8Array(0);
            console.log(`[WorkspaceSync] 存储中无数据，从内存读取文档: ${docId}, 大小: ${docData.byteLength} bytes`);
          }
        } else {
          // 从内存读取
          docData = store?.spaceDoc ? encodeStateAsUpdate(store.spaceDoc) : new Uint8Array(0);
        }
        
        if (docData.byteLength > 2) {  // 过滤空文档（空 Yjs 更新通常是 2 bytes）
          return { id: docId, guid, data: docData };
        } else {
          console.warn(`[WorkspaceSync] 跳过空文档: ${docId}, 大小: ${docData.byteLength} bytes`);
          return null;
        }
      } catch (e) {
        console.warn(`[WorkspaceSync] 无法导出文档 ${docId}:`, e);
        return null;
      }
    },
    DOC_CONCURRENCY
  );
  
  // 3. 导出所有 Blob 数据（图片、附件等）- 并发处理，限制并发数为 5
  const BLOB_CONCURRENCY = 5;
  let blobs: Array<{ key: string; data: string; type: string }> = [];
  
  try {
    const blobKeys = await workspace.blobSync.list();
    console.log(`[WorkspaceSync] 发现 ${blobKeys.length} 个 Blob`);
    
    blobs = await mapWithConcurrency(
      blobKeys,
      async (key): Promise<{ key: string; data: string; type: string } | null> => {
        try {
          const blob = await workspace.blobSync.get(key);
          if (blob) {
            // 将 Blob 转换为 Base64
            const arrayBuffer = await blob.arrayBuffer();
            const base64 = arrayBufferToBase64Chunk(new Uint8Array(arrayBuffer));
            return {
              key,
              data: base64,
              type: blob.type || 'application/octet-stream',
            };
          }
          return null;
        } catch (e) {
          console.warn(`[WorkspaceSync] 无法导出 Blob ${key}:`, e);
          return null;
        }
      },
      BLOB_CONCURRENCY
    );
  } catch (e) {
    console.warn('[WorkspaceSync] 无法获取 Blob 列表:', e);
  }
  
  console.log(`[WorkspaceSync] 导出工作区快照: ${docs.length} 个文档, ${blobs.length} 个 Blob`);
  
  return {
    version: 3,
    workspaceId: workspace.id,
    timestamp: Date.now(),
    rootDoc: rootDocData,
    docs,
    blobs,
    docCount: docs.length,
    blobCount: blobs.length,
  };
}

/**
 * 将快照序列化为二进制
 */
export function serializeSnapshot(snapshot: WorkspaceSnapshot): ArrayBuffer {
  // 使用 JSON + Base64 编码
  const jsonData = {
    version: snapshot.version,
    workspaceId: snapshot.workspaceId,
    timestamp: snapshot.timestamp,
    rootDoc: arrayBufferToBase64Chunk(snapshot.rootDoc),
    docs: snapshot.docs.map(doc => ({
      id: doc.id,
      guid: doc.guid,
      data: arrayBufferToBase64Chunk(doc.data),
    })),
    blobs: snapshot.blobs, // 已经是 Base64 格式
    docCount: snapshot.docCount,
    blobCount: snapshot.blobCount,
  };
  
  const jsonString = JSON.stringify(jsonData);
  const encoder = new TextEncoder();
  return encoder.encode(jsonString).buffer;
}

/**
 * 从二进制反序列化快照
 */
export function deserializeSnapshot(data: ArrayBuffer): WorkspaceSnapshot {
  const decoder = new TextDecoder();
  const jsonString = decoder.decode(data);
  const jsonData = JSON.parse(jsonString);
  
  // 兼容旧版本格式
  if (jsonData.version === 1 && jsonData.subDocs) {
    return {
      version: 1,
      workspaceId: jsonData.workspaceId,
      timestamp: jsonData.timestamp,
      rootDoc: base64ToArrayBuffer(jsonData.rootDoc),
      docs: jsonData.subDocs.map((doc: { guid: string; data: string }) => ({
        id: doc.guid,
        guid: doc.guid,
        data: base64ToArrayBuffer(doc.data),
      })),
      blobs: [],
      docCount: jsonData.subDocs.length,
      blobCount: 0,
    };
  }
  
  // 版本 2 兼容（没有 blobs）
  if (jsonData.version === 2 && !jsonData.blobs) {
    return {
      version: 2,
      workspaceId: jsonData.workspaceId,
      timestamp: jsonData.timestamp,
      rootDoc: base64ToArrayBuffer(jsonData.rootDoc),
      docs: jsonData.docs.map((doc: { id: string; guid: string; data: string }) => ({
        id: doc.id,
        guid: doc.guid,
        data: base64ToArrayBuffer(doc.data),
      })),
      blobs: [],
      docCount: jsonData.docCount,
      blobCount: 0,
    };
  }
  
  return {
    version: jsonData.version,
    workspaceId: jsonData.workspaceId,
    timestamp: jsonData.timestamp,
    rootDoc: base64ToArrayBuffer(jsonData.rootDoc),
    docs: jsonData.docs.map((doc: { id: string; guid: string; data: string }) => ({
      id: doc.id,
      guid: doc.guid,
      data: base64ToArrayBuffer(doc.data),
    })),
    blobs: jsonData.blobs || [],
    docCount: jsonData.docCount,
    blobCount: jsonData.blobCount || 0,
  };
}

/**
 * 将快照导入到工作区
 * 
 * 重要：导入后必须刷新页面才能看到更新的文档
 * 数据会先被写入存储（IndexedDB/SQLite），刷新后重新加载
 */
export async function importWorkspaceSnapshot(workspace: Workspace, snapshot: WorkspaceSnapshot): Promise<void> {
  console.log(`[WorkspaceSync] 开始导入快照: workspaceId=${snapshot.workspaceId}, docCount=${snapshot.docCount}, blobCount=${snapshot.blobCount}`);
  console.log(`[WorkspaceSync] 当前工作区 ID: ${workspace.id}`);
  
  const rootDoc = workspace.doc;
  
  // 打印导入前的状态
  const metaMap = rootDoc.getMap('meta');
  const pagesBefore = metaMap?.get('pages');
  console.log(`[WorkspaceSync] 导入前文档数: ${pagesBefore ? (pagesBefore as any).length : 0}`);
  
  // 1. 应用根文档更新（工作区元数据，包含 meta.pages 文档列表）
  console.log(`[WorkspaceSync] 应用根文档更新, rootDoc 大小: ${snapshot.rootDoc.byteLength} bytes, rootDoc.guid: ${rootDoc.guid}`);
  applyUpdate(rootDoc, snapshot.rootDoc);
  
  // 打印导入后的状态
  const pagesAfter = metaMap?.get('pages');
  console.log(`[WorkspaceSync] 导入后文档数: ${pagesAfter ? (pagesAfter as any).length : 0}`);
  
  // 触发文档列表更新事件
  try {
    workspace.slots?.docListUpdated?.next();
  } catch (e) {
    console.warn('[WorkspaceSync] 触发 docListUpdated 失败:', e);
  }
  
  // 2. 应用所有页面文档更新
  let importedDocCount = 0;
  
  // 🔧 批量处理文档导入，确保数据完整性
  for (const docData of snapshot.docs) {
    try {
      console.log(`[WorkspaceSync] 处理文档: ${docData.id}, guid: ${docData.guid}, 数据大小: ${docData.data.byteLength} bytes`);
      
      // 尝试获取已存在的文档
      let doc = workspace.getDoc(docData.id);
      
      if (!doc) {
        // 文档不存在，创建它
        console.log(`[WorkspaceSync] 创建新文档: ${docData.id}`);
        try {
          doc = workspace.createDoc(docData.id);
          
          // 🔧 等待文档初始化完成
          if (doc && typeof (doc as any).load === 'function') {
            try {
              await (doc as any).load();
              console.log(`[WorkspaceSync] 文档 ${docData.id} 初始化完成`);
            } catch (loadErr) {
              console.warn(`[WorkspaceSync] 文档 ${docData.id} 初始化失败:`, loadErr);
            }
          }
        } catch (createErr) {
          console.warn(`[WorkspaceSync] 创建文档 ${docData.id} 失败:`, createErr);
          continue;
        }
      }
      
      if (doc) {
        const store = doc.getStore();
        if (store && store.spaceDoc) {
          console.log(`[WorkspaceSync] 应用文档更新: docId=${docData.id}, spaceDoc.guid=${store.spaceDoc.guid}, snapshotGuid=${docData.guid}`);
          
          // 检查更新前的状态
          const beforeBlocks = store.spaceDoc.getMap('blocks');
          console.log(`[WorkspaceSync] 更新前 blocks 数量: ${beforeBlocks?.size || 0}`);
          
          // 🔧 应用 Yjs 更新
          applyUpdate(store.spaceDoc, docData.data);
          
          // 检查更新后的状态
          const afterBlocks = store.spaceDoc.getMap('blocks');
          console.log(`[WorkspaceSync] 更新后 blocks 数量: ${afterBlocks?.size || 0}`);
          
          // 🔧 手动触发存储同步（Android 环境重要）
          try {
            if (store.spaceDoc.store && typeof (store.spaceDoc.store as any).connect === 'function') {
              (store.spaceDoc.store as any).connect();
            }
          } catch (syncErr) {
            console.warn(`[WorkspaceSync] 触发文档存储同步失败:`, syncErr);
          }
          
          importedDocCount++;
          console.log(`[WorkspaceSync] 导入文档成功: ${docData.id}`);
        } else {
          console.warn(`[WorkspaceSync] 文档 ${docData.id} 没有 spaceDoc, store:`, !!store, 'spaceDoc:', !!store?.spaceDoc);
        }
      } else {
        console.error(`[WorkspaceSync] 无法创建或获取文档: ${docData.id}`);
      }
    } catch (e) {
      console.error(`[WorkspaceSync] 无法导入文档 ${docData.id}:`, e);
    }
  }
  
  // 🔧 强制触发文档存储同步（Android 环境重要）
  console.log(`[WorkspaceSync] 强制同步文档到存储...`);
  
  try {
    // 尝试手动触发存储同步
    if (docStorage && typeof (docStorage as any).sync === 'function') {
      console.log(`[WorkspaceSync] 调用 docStorage.sync()`);
      await (docStorage as any).sync();
    }
    
    // 对于每个导入的文档，强制保存到存储
    for (const docData of snapshot.docs) {
      const doc = workspace.getDoc(docData.id);
      if (doc) {
        const store = doc.getStore();
        if (store?.spaceDoc && docStorage && typeof (docStorage as any).setDoc === 'function') {
          try {
            console.log(`[WorkspaceSync] 强制保存文档到存储: ${docData.id}`);
            await (docStorage as any).setDoc(docData.guid, {
              bin: docData.data,
              timestamp: new Date()
            });
          } catch (e) {
            console.warn(`[WorkspaceSync] 保存文档 ${docData.id} 到存储失败:`, e);
          }
        }
      }
    }
  } catch (e) {
    console.warn('[WorkspaceSync] 强制同步失败:', e);
  }
  
  // 等待额外时间让数据完全持久化
  console.log(`[WorkspaceSync] 等待数据持久化完成...`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 3. 导入所有 Blob 数据（并发处理，限制并发数为 5）
  const BLOB_IMPORT_CONCURRENCY = 5;
  let importedBlobCount = 0;
  
  await runWithConcurrency(
    snapshot.blobs,
    async (blobData) => {
      try {
        const arrayBuffer = base64ToArrayBuffer(blobData.data);
        const blob = new Blob([arrayBuffer], { type: blobData.type });
        await workspace.blobSync.set(blobData.key, blob);
        importedBlobCount++;
      } catch (e) {
        console.warn(`[WorkspaceSync] 无法导入 Blob ${blobData.key}:`, e);
      }
    },
    BLOB_IMPORT_CONCURRENCY
  );
  
  console.log(`[WorkspaceSync] 导入完成: ${importedDocCount}/${snapshot.docCount} 个文档, ${importedBlobCount}/${snapshot.blobCount} 个 Blob`);
  
  // 🔧 最终强制刷新工作区状态
  try {
    // 触发工作区重新扫描文档
    if (workspace.slots?.docListUpdated) {
      workspace.slots.docListUpdated.next();
      console.log(`[WorkspaceSync] 触发工作区文档列表更新`);
    }
    
    // 如果有 reload 方法，调用它
    if (typeof (workspace as any).reload === 'function') {
      await (workspace as any).reload();
      console.log(`[WorkspaceSync] 工作区重新加载完成`);
    }
    
  } catch (e) {
    console.warn('[WorkspaceSync] 最终刷新失败:', e);
  }
}

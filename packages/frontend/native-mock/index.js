// Mock implementation of @yunke/native that delegates to Java backend APIs

// 统一从配置模块读取基础地址
// 注意：这个文件在运行时动态加载，需要异步获取配置
let BASE_URL = '';
let BASE_URL_PROMISE = null;

function getBaseUrlSync() {
  // 如果已经初始化，直接返回
  if (BASE_URL) return BASE_URL;
  
  // 如果正在初始化，等待完成
  if (BASE_URL_PROMISE) {
    throw new Error('BASE_URL正在初始化中，请稍后重试');
  }
  
  // 首次调用，从环境变量读取（兼容性处理）
  // 优先尝试从统一配置模块获取
  if (typeof import !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    BASE_URL = import.meta.env.VITE_API_BASE_URL;
    return BASE_URL;
  }
  
  // 回退到process.env（Node.js环境）
  if (typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL) {
    BASE_URL = process.env.VITE_API_BASE_URL;
    return BASE_URL;
  }
  
  throw new Error('❌ 环境变量配置缺失：请在 .env 文件中配置 VITE_API_BASE_URL');
}

// 获取JWT token
function getAuthToken() {
  return localStorage.getItem('yunke-admin-token') || localStorage.getItem('yunke-access-token');
}

// 创建带认证的fetch请求
async function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const baseUrl = getBaseUrlSync();
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  return fetch(fullUrl, {
    ...options,
    headers,
    credentials: 'include',
  });
}

export class DocStorage {
  constructor(path) {
    this.path = path;
    this.workspaceId = null;
    console.log('[MOCK->JAVA] DocStorage created at:', path);
  }
  
  async validate() {
    console.log('[MOCK->JAVA] DocStorage.validate() - checking connection to Java backend');
    try {
      const response = await fetchWithAuth('/health');
      return response.ok;
    } catch (error) {
      console.error('[MOCK->JAVA] DocStorage validation failed:', error);
      return false;
    }
  }
  
  async setSpaceId(spaceId) {
    console.log('[MOCK->JAVA] DocStorage.setSpaceId:', spaceId);
    this.workspaceId = spaceId;
  }
}

// 将Uint8Array转换为Base64字符串（辅助函数）
function uint8ArrayToBase64(uint8array) {
  let binary = '';
  const len = uint8array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8array[i]);
  }
  return btoa(binary);
}

export class DocStoragePool {
  constructor() {
    this.connections = new Map();
    console.log('[MOCK->JAVA] DocStoragePool created');
  }
  
  async connect(universalId, path) {
    // console.log('[MOCK->JAVA] DocStoragePool.connect:', universalId, path);
    this.connections.set(universalId, { path, workspaceId: universalId });
  }
  
  async disconnect(universalId) {
    // console.log('[MOCK->JAVA] DocStoragePool.disconnect:', universalId);
    this.connections.delete(universalId);
  }
  
  async setSpaceId(universalId, spaceId) {
    // console.log('[MOCK->JAVA] DocStoragePool.setSpaceId:', universalId, spaceId);
    const connection = this.connections.get(universalId);
    if (connection) {
      connection.workspaceId = spaceId;
    }
  }
  
  async pushUpdate(universalId, docId, update) {
    // console.log('[MOCK->JAVA] DocStoragePool.pushUpdate:', universalId, docId);
    try {
      // 将Uint8Array编码为Base64（YUNKE标准）
      const base64 = uint8ArrayToBase64(update);
      // 发送到Java后端的YUNKE兼容端点
      const response = await fetchWithAuth(`/api/workspaces/${universalId}/docs/${docId}/updates`, {
        method: 'POST',
        body: JSON.stringify({
          update: base64,
          timestamp: Date.now()
        })
      });
      
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        // 后端返回 { success, timestamp }
        const ts = data && data.timestamp ? data.timestamp : Date.now();
        return ts;
      } else {
        console.error('[MOCK->JAVA] Failed to push update:', response.status);
        return null;
      }
    } catch (error) {
      console.error('[MOCK->JAVA] Error pushing update:', error);
      return null;
    }
  }
  
  async getDocSnapshot(universalId, docId) {
    // console.log('[MOCK->JAVA] DocStoragePool.getDocSnapshot:', universalId, docId);
    try {
      // 从Java后端获取文档快照（字节流）
      const response = await fetchWithAuth(`/api/workspaces/${universalId}/docs/${docId}`);
      
      if (response.ok) {
        const buf = await response.arrayBuffer();
        if (!buf || buf.byteLength === 0) return null;
        return new Uint8Array(buf);
      } else if (response.status === 404) {
        console.log('[MOCK->JAVA] Document not found, returning null');
        return null;
      } else {
        console.error('[MOCK->JAVA] Failed to get document:', response.status);
        return null;
      }
    } catch (error) {
      console.error('[MOCK->JAVA] Error getting document:', error);
      return null;
    }
  }
  
  async setDocSnapshot(universalId, snapshot) {
    // console.log('[MOCK->JAVA] DocStoragePool.setDocSnapshot:', universalId);
    try {
      // 这个方法通常用于批量设置，我们可以简单返回成功
      return true;
    } catch (error) {
      console.error('[MOCK->JAVA] Error setting document snapshot:', error);
      return false;
    }
  }
  
  async getDocUpdates(universalId, docId) {
    console.warn('[MOCK] DocStoragePool.getDocUpdates:', universalId, docId);
    return [];
  }
  
  async markUpdatesMerged(universalId, docId, updates) {
    console.warn('[MOCK] DocStoragePool.markUpdatesMerged:', universalId, docId);
    return 0;
  }
  
  async deleteDoc(universalId, docId) {
    console.warn('[MOCK] DocStoragePool.deleteDoc:', universalId, docId);
  }
  
  // 其他方法的模拟实现...
  async getDocClocks() { return []; }
  async getDocClock() { return null; }
  async getBlob() { return null; }
  async setBlob() {}
  async deleteBlob() {}
  async releaseBlobs() {}
  async listBlobs() { return []; }
  async getPeerRemoteClocks() { return []; }
  async getPeerRemoteClock() { return null; }
  async setPeerRemoteClock() {}
  async getPeerPulledRemoteClocks() { return []; }
  async getPeerPulledRemoteClock() { return null; }
  async setPeerPulledRemoteClock() {}
  async getPeerPushedClocks() { return []; }
  async getPeerPushedClock() { return null; }
  async setPeerPushedClock() {}
  async clearClocks() {}
  async setBlobUploadedAt() {}
  async getBlobUploadedAt() { return null; }
}

export class SqliteConnection {
  constructor(path) {
    this.path = path;
    this.isClose = false;
    console.warn('[MOCK] SqliteConnection created at:', path);
  }
  
  async connect() {
    console.warn('[MOCK] SqliteConnection.connect');
  }
  
  static async validate(path) {
    console.warn('[MOCK] SqliteConnection.validate:', path);
    return ValidationResult.Valid;
  }
  
  async close() {
    this.isClose = true;
    console.warn('[MOCK] SqliteConnection.close');
  }
  
  // 其他方法的模拟实现...
  async addBlob() {}
  async getBlob() { return null; }
  async deleteBlob() {}
  async getBlobKeys() { return []; }
  async getUpdates() { return []; }
  async getDocTimestamps() { return []; }
  async deleteUpdates() {}
  async getUpdatesCount() { return 0; }
  async getAllUpdates() { return []; }
  async insertUpdates() {}
  async replaceUpdates() {}
  async getServerClock() { return null; }
  async setServerClock() {}
  async getServerClockKeys() { return []; }
  async clearServerClock() {}
  async delServerClock() {}
  async getSyncMetadata() { return null; }
  async setSyncMetadata() {}
  async getSyncMetadataKeys() { return []; }
  async clearSyncMetadata() {}
  async delSyncMetadata() {}
  async initVersion() {}
  async setVersion() {}
  async getMaxVersion() { return 1; }
  async migrateAddDocId() {}
  async checkpoint() {}
}

export const ValidationResult = {
  MissingTables: 0,
  MissingDocIdColumn: 1,
  MissingVersionColumn: 2,
  GeneralError: 3,
  Valid: 4
};

export async function mintChallengeResponse(resource, bits = 20) {
  console.warn('[MOCK] mintChallengeResponse:', resource, bits);
  // 返回一个模拟的挑战响应
  return 'mock-challenge-response-' + Math.random().toString(36).substr(2, 9);
}

export async function verifyChallengeResponse(response, bits, resource) {
  console.warn('[MOCK] verifyChallengeResponse:', response, bits, resource);
  return true;
}

export async function decodeAudio(buf, destSampleRate, filename, signal) {
  console.warn('[MOCK] decodeAudio - returning empty Float32Array');
  return new Float32Array(0);
}

export function decodeAudioSync(buf, destSampleRate, filename) {
  console.warn('[MOCK] decodeAudioSync - returning empty Float32Array');
  return new Float32Array(0);
}

// 模拟其他导出的类和接口
export const ShareableContent = {
  // 模拟实现
};

export const AudioCaptureSession = class {
  // 模拟实现
};

export const TappableApplication = class {
  // 模拟实现
};

console.warn('🚧 [MOCK] @yunke/native loaded - Rust functionality disabled, using JavaScript mocks');

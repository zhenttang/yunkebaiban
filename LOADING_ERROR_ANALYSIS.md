# 文档加载错误分析 - "Integer out of Range"

## 🔴 问题描述

从截图中可以看到：
1. 界面显示"正在加载文档内容，请稍等片刻..."，卡在加载状态
2. 控制台报错：**"Error: Integer out of Range"**
3. 多个云存储相关的 Socket.IO 连接日志

## 🔍 错误定位

### 错误发生位置

**前端错误触发点**：`packages/common/nbstore/src/frontend/doc.ts:586`

```typescript
applyUpdate(docId: string, update: Uint8Array) {
  const doc = this.status.docs.get(docId);
  if (doc && !isEmptyUpdate(update)) {
    try {
      this.isApplyingUpdate = true;
      
      // ⚠️ 错误发生在这里：Y.js 尝试解析二进制数据
      applyUpdate(doc, update, NBSTORE_ORIGIN);
      
    } catch (err) {
      console.error('failed to apply update yjs doc', err);
      
      // 如果是 "Integer out of Range" 错误
      const errorMessage = err?.message || String(err);
      if (errorMessage.includes('Integer out of Range')) {
        console.error('💡 可能的原因:');
        console.error('  1. 后端返回的数据不是有效的 Y.js 二进制格式');
        console.error('  2. 数据在传输过程中被损坏');
        console.error('  3. 前后端 Y.js 版本不一致');
        console.error('  4. 数据库中存储的数据格式错误');
      }
    }
  }
}
```

### 调用链路

```
用户打开文档
  ↓
DocFrontend.connectDoc()
  ↓
mainLoop 调度 load 作业
  ↓
jobs.load()
  ↓
storage.getDoc(docId)
  ↓
【后端】Socket.IO: 'space:load-doc'
  ↓
SocketIOEventHandler.handleLoadDoc()
  ↓
storageAdapter.getDocDiff()
  ↓
DocStorageAdapter.getDoc()
  ↓
getDocSnapshot() + getDocUpdates()
  ↓
【数据库查询】snapshots表 / updates表
  ↓
【返回】Base64 编码的二进制数据
  ↓
【前端接收】
  ↓
base64ToUint8Array() 解码
  ↓
applyUpdate() 应用到 YDoc
  ↓
❌ Y.js 解析失败：Integer out of Range
```

## 🔬 根本原因分析

### 1. 数据流转过程

#### 后端处理流程

**文件**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/service/socketio/SocketIOEventHandler.java:308`

```java
// 1. 接收前端请求
socketIOServer.addEventListener("space:load-doc", SpaceLoadDocRequest.class, (client, data, ack) -> {
    // 2. 获取文档差异
    DocDiff diff = storageAdapter.getDocDiff(data.spaceId, data.docId, stateVectorBytes);
    
    if (diff == null) {
        // 文档不存在，自动创建初始文档
        var created = docWriter.createInitialDoc(data.spaceId, data.docId, null).block();
        // 再次获取
        diff = storageAdapter.getDocDiff(data.spaceId, data.docId, stateVectorBytes);
    }
    
    // 3. Base64 编码
    String missingBase64 = java.util.Base64.getEncoder().encodeToString(diff.getMissing());
    String stateBase64 = java.util.Base64.getEncoder().encodeToString(diff.getState());
    
    // 4. 返回给前端
    var payload = new SpaceLoadDocResponseData(missingBase64, stateBase64, diff.getTimestamp());
    ack.sendAckData(java.util.Map.of("data", payload));
});
```

**文件**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/storage/DocStorageAdapter.java:73`

```java
public DocDiff getDocDiff(String spaceId, String docId, byte[] stateVector) {
    // 1. 获取完整文档（快照 + 待合并更新）
    DocRecord docRecord = getDoc(spaceId, docId);
    if (docRecord == null) {
        return null;
    }
    
    // 2. 使用 YJS 微服务计算差异
    byte[] missing = stateVector != null ?
        yjsServiceClient.diffUpdate(docRecord.getBlob(), stateVector) :
        docRecord.getBlob();  // ⚠️ 直接返回完整 blob
    
    byte[] state = yjsServiceClient.encodeStateVector(docRecord.getBlob());
    
    return new DocDiff(missing, state, docRecord.getTimestamp());
}
```

#### 前端处理流程

**文件**: `packages/common/nbstore/src/impls/cloud/doc.ts:74`

```typescript
override async getDocSnapshot(docId: string) {
  // 1. Socket.IO 请求
  const res = await this.socket.emitWithAck('space:load-doc', {
    spaceType: this.spaceType,
    spaceId: this.spaceId,
    docId: this.idConverter.newIdToOldId(docId),
  });
  
  if ('error' in res) {
    if (res.error.name === 'DOC_NOT_FOUND') {
      return null;
    }
    throw new Error(res.error.message);
  }
  
  // 2. Base64 解码
  const missingBin = base64ToUint8Array(res.data.missing);
  
  // 3. 返回二进制数据
  return {
    docId,
    bin: missingBin,  // ⚠️ 这个数据会被传给 applyUpdate
    timestamp: new Date(res.data.timestamp),
  };
}
```

**文件**: `packages/common/nbstore/src/impls/cloud/socket.ts:124`

```typescript
export function uint8ArrayToBase64(array: Uint8Array): Promise<string> {
  return new Promise<string>(resolve => {
    try {
      // 方法1：使用 btoa（推荐）
      let binary = '';
      const len = array.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(array[i]);
      }
      const base64 = btoa(binary);
      resolve(base64);
    } catch (error) {
      // 方法2：回退到 FileReader
      // ...
    }
  });
}

export function base64ToUint8Array(base64: string): Uint8Array {
  try {
    // 方法1：使用 atob
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    // 方法2：回退
    // ...
  }
}
```

### 2. 可能的问题点

#### ❌ 问题1：数据库中存储的数据格式错误

**数据库表**: `workspace_snapshots` 或 `workspace_updates`

```sql
-- 检查快照数据
SELECT doc_id, LENGTH(blob) as size, 
       HEX(SUBSTRING(blob, 1, 20)) as hex_preview,
       timestamp, editor
FROM workspace_snapshots 
WHERE workspace_id = ? AND doc_id = ?;

-- 检查更新数据
SELECT doc_id, LENGTH(blob) as size,
       HEX(SUBSTRING(blob, 1, 20)) as hex_preview,
       created_at
FROM workspace_updates
WHERE workspace_id = ? AND doc_id = ?
ORDER BY created_at;
```

**有效的 Y.js 二进制数据特征**：
- 第一个字节通常是 `0x00` 或 `0x01`
- 不应该是空数据 (0 bytes)
- 不应该是纯文本或 JSON

**检查代码**：`packages/common/nbstore/src/frontend/doc.ts:556`

```typescript
const isEmpty = update.byteLength === 0 || 
  (update.byteLength === 2 && update[0] === 0 && update[1] === 0);

// Y.js 更新数据通常以 0x00 或 0x01 开始
const looksLikeYjsUpdate = update[0] === 0x00 || update[0] === 0x01;

if (!looksLikeYjsUpdate) {
  console.warn('⚠️ 数据格式可能不正确，不是标准的 Y.js 更新格式', {
    docId,
    firstByte: update[0],
    expectedFirstByte: '0x00 或 0x01'
  });
}
```

#### ❌ 问题2：Base64 编码/解码错误

**可能的原因**：
- Android WebView 环境下 Base64 编码不一致
- 特殊字符处理错误
- 编码时使用了错误的字符集

**后端编码**：
```java
// Java 标准 Base64 编码器
String missingBase64 = java.util.Base64.getEncoder().encodeToString(diff.getMissing());
```

**前端解码**：
```typescript
// JavaScript atob() 解码
const binary = atob(base64);
const bytes = new Uint8Array(len);
for (let i = 0; i < len; i++) {
  bytes[i] = binary.charCodeAt(i);
}
```

#### ❌ 问题3：YJS 微服务处理错误

**文件**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/service/YjsServiceClient.java`

YJS 微服务可能在以下环节出错：
1. `diffUpdate()` - 计算文档差异
2. `encodeStateVector()` - 编码状态向量
3. `mergeUpdates()` - 合并多个更新

#### ❌ 问题4：初始文档创建错误

当文档不存在时，后端会自动创建初始文档：

```java
if (diff == null) {
    var created = docWriter.createInitialDoc(data.spaceId, data.docId, null).block();
    diff = storageAdapter.getDocDiff(data.spaceId, data.docId, stateVectorBytes);
}
```

如果 `createInitialDoc()` 创建的数据格式不正确，就会导致前端解析失败。

#### ❌ 问题5：数据传输过程中损坏

Socket.IO 传输过程中可能的问题：
- 消息大小限制
- 超时重传
- 连接中断

## 🔧 排查步骤

### 步骤1：检查后端返回的原始数据

在 **SocketIOEventHandler.java:350** 添加详细日志：

```java
DocDiff diff = storageAdapter.getDocDiff(data.spaceId, data.docId, stateVectorBytes);

// 🔍 添加详细日志
if (diff != null) {
    byte[] missing = diff.getMissing();
    byte[] state = diff.getState();
    
    log.info("📦 [文档加载-详细] 原始二进制数据:");
    log.info("  - missing size: {} bytes", missing != null ? missing.length : 0);
    log.info("  - state size: {} bytes", state != null ? state.length : 0);
    
    if (missing != null && missing.length > 0) {
        // 打印前 20 字节的十六进制
        StringBuilder hex = new StringBuilder();
        for (int i = 0; i < Math.min(20, missing.length); i++) {
            hex.append(String.format("%02X ", missing[i]));
        }
        log.info("  - missing hex preview: {}", hex);
        log.info("  - missing first byte: 0x{}", String.format("%02X", missing[0]));
        
        // 检查是否是有效的 Y.js 数据
        boolean looksValid = missing[0] == 0x00 || missing[0] == 0x01;
        log.info("  - looks like valid Y.js data: {}", looksValid);
    }
}

String missingBase64 = java.util.Base64.getEncoder().encodeToString(diff.getMissing());
log.info("📦 [文档加载-Base64] 编码后长度: {} chars", missingBase64.length());
log.info("📦 [文档加载-Base64] 前30字符: {}", missingBase64.substring(0, Math.min(30, missingBase64.length())));
```

### 步骤2：检查前端接收的数据

在 **CloudDocStorage.ts:74** 添加日志：

```typescript
const res = await this.socket.emitWithAck('space:load-doc', {
  spaceType: this.spaceType,
  spaceId: this.spaceId,
  docId: this.idConverter.newIdToOldId(docId),
});

console.log('🔍 [CloudDocStorage] 收到响应:', {
  hasData: 'data' in res,
  hasError: 'error' in res,
  missingBase64Length: res.data?.missing?.length,
  missingBase64Preview: res.data?.missing?.substring(0, 30),
});

const missingBin = base64ToUint8Array(res.data.missing);

console.log('🔍 [CloudDocStorage] Base64解码结果:', {
  byteLength: missingBin.byteLength,
  firstByte: missingBin[0],
  firstByteHex: '0x' + missingBin[0].toString(16).padStart(2, '0'),
  looksLikeYjs: missingBin[0] === 0x00 || missingBin[0] === 0x01,
  preview: Array.from(missingBin.slice(0, 20))
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' '),
});
```

### 步骤3：检查数据库中的数据

```sql
-- 1. 检查快照表
SELECT 
    doc_id,
    LENGTH(blob) as blob_size,
    HEX(SUBSTRING(blob, 1, 1)) as first_byte_hex,
    FROM_UNIXTIME(timestamp/1000) as updated_at,
    editor
FROM workspace_snapshots
WHERE workspace_id = 'YOUR_WORKSPACE_ID'
  AND doc_id = 'YOUR_DOC_ID';

-- 2. 检查更新表
SELECT 
    doc_id,
    LENGTH(blob) as blob_size,
    HEX(SUBSTRING(blob, 1, 1)) as first_byte_hex,
    FROM_UNIXTIME(created_at/1000) as created_time
FROM workspace_updates
WHERE workspace_id = 'YOUR_WORKSPACE_ID'
  AND doc_id = 'YOUR_DOC_ID'
ORDER BY created_at DESC
LIMIT 10;

-- 3. 检查数据是否为空或异常
SELECT 
    COUNT(*) as total_docs,
    SUM(CASE WHEN blob IS NULL OR LENGTH(blob) = 0 THEN 1 ELSE 0 END) as empty_blobs,
    SUM(CASE WHEN LENGTH(blob) < 10 THEN 1 ELSE 0 END) as suspicious_small_blobs,
    AVG(LENGTH(blob)) as avg_blob_size
FROM workspace_snapshots
WHERE workspace_id = 'YOUR_WORKSPACE_ID';
```

### 步骤4：验证 Base64 编码一致性

创建测试脚本对比 Java 和 JavaScript 的编码结果：

**Java 测试**：
```java
public static void testBase64Encoding() {
    // 创建测试数据（有效的 Y.js 二进制）
    byte[] testData = new byte[]{0x00, 0x01, 0x02, 0x03, 0x04};
    
    // Java 编码
    String base64 = java.util.Base64.getEncoder().encodeToString(testData);
    System.out.println("Java Base64: " + base64);
    
    // 解码回来验证
    byte[] decoded = java.util.Base64.getDecoder().decode(base64);
    System.out.println("Decoded matches: " + java.util.Arrays.equals(testData, decoded));
}
```

**JavaScript 测试**：
```typescript
function testBase64Encoding() {
    // 相同的测试数据
    const testData = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);
    
    // JavaScript 编码
    let binary = '';
    for (let i = 0; i < testData.byteLength; i++) {
        binary += String.fromCharCode(testData[i]);
    }
    const base64 = btoa(binary);
    console.log('JavaScript Base64:', base64);
    
    // 解码回来验证
    const decodedBinary = atob(base64);
    const decoded = new Uint8Array(decodedBinary.length);
    for (let i = 0; i < decodedBinary.length; i++) {
        decoded[i] = decodedBinary.charCodeAt(i);
    }
    console.log('Decoded matches:', 
        decoded.every((byte, i) => byte === testData[i]));
}
```

### 步骤5：检查 YJS 微服务

检查 YJS 微服务是否正常工作：

```bash
# 测试微服务健康状态
curl http://localhost:3000/health

# 测试编码/解码功能
curl -X POST http://localhost:3000/encode-state-vector \
  -H "Content-Type: application/json" \
  -d '{"update": "base64_encoded_data"}'
```

## 🛠️ 解决方案

### 方案1：增强错误处理和日志

在前端 `applyUpdate` 中添加更详细的错误信息：

```typescript
applyUpdate(docId: string, update: Uint8Array) {
  const doc = this.status.docs.get(docId);
  if (doc && !isEmptyUpdate(update)) {
    // 数据验证
    const firstBytes = Array.from(update.slice(0, 10))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    
    const isEmpty = update.byteLength === 0 || 
      (update.byteLength === 2 && update[0] === 0 && update[1] === 0);
    
    const looksLikeYjsUpdate = update[0] === 0x00 || update[0] === 0x01;
    
    console.log('📋 [applyUpdate] 准备应用更新:', {
      docId,
      byteLength: update.byteLength,
      isEmpty,
      firstBytes,
      looksLikeYjsUpdate,
      firstByte: '0x' + update[0]?.toString(16).padStart(2, '0'),
    });
    
    if (!looksLikeYjsUpdate && !isEmpty) {
      console.error('⚠️ [applyUpdate] 数据格式异常，可能导致解析失败');
    }
    
    try {
      this.isApplyingUpdate = true;
      applyUpdate(doc, update, NBSTORE_ORIGIN);
      console.log('✅ [applyUpdate] 应用成功');
    } catch (err: any) {
      console.error('❌ [applyUpdate] 应用失败:', {
        docId,
        errorMessage: err?.message || String(err),
        errorName: err?.name || 'Unknown',
        updateSize: update.byteLength,
        firstBytes,
        updatePreview: Array.from(update.slice(0, 50))
      });
      
      if (err?.message?.includes('Integer out of Range')) {
        console.error('💡 诊断信息:');
        console.error('  - 数据大小:', update.byteLength, 'bytes');
        console.error('  - 第一个字节:', '0x' + update[0]?.toString(16));
        console.error('  - 是否看起来像Y.js数据:', looksLikeYjsUpdate);
        console.error('  - 前20字节:', firstBytes);
        
        // 尝试解析原因
        if (update.byteLength < 3) {
          console.error('  ❌ 数据太小，可能是空文档或损坏数据');
        } else if (!looksLikeYjsUpdate) {
          console.error('  ❌ 第一个字节不是0x00或0x01，不是标准Y.js格式');
          console.error('     建议检查：');
          console.error('     1. 后端编码是否正确');
          console.error('     2. Base64传输是否完整');
          console.error('     3. 数据库中的原始数据');
        }
      }
      
      throw err;
    } finally {
      this.isApplyingUpdate = false;
    }
  }
}
```

### 方案2：添加数据验证中间层

创建一个数据验证工具：

```typescript
// packages/common/nbstore/src/utils/yjs-data-validator.ts

export class YjsDataValidator {
  static validate(data: Uint8Array): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // 检查1：数据不能为空
    if (data.byteLength === 0) {
      issues.push('数据为空 (0 bytes)');
      return { isValid: false, issues, warnings };
    }
    
    // 检查2：最小长度
    if (data.byteLength < 2) {
      issues.push(`数据太小 (${data.byteLength} bytes)，至少需要2字节`);
      return { isValid: false, issues, warnings };
    }
    
    // 检查3：空更新标记
    if (data.byteLength === 2 && data[0] === 0 && data[1] === 0) {
      warnings.push('这是一个空更新标记');
      return { isValid: true, issues, warnings };
    }
    
    // 检查4：第一个字节应该是 0x00 或 0x01
    if (data[0] !== 0x00 && data[0] !== 0x01) {
      warnings.push(
        `第一个字节是 0x${data[0].toString(16).padStart(2, '0')}，` +
        `标准Y.js数据应该是 0x00 或 0x01`
      );
    }
    
    // 检查5：基本结构验证
    try {
      // 这里可以添加更复杂的Y.js结构验证
      // 例如检查变长整数编码是否合法
      
    } catch (e) {
      issues.push(`结构验证失败: ${e}`);
    }
    
    const isValid = issues.length === 0;
    return { isValid, issues, warnings };
  }
  
  static logValidation(
    docId: string, 
    data: Uint8Array, 
    source: string
  ): void {
    const result = this.validate(data);
    
    console.log(`🔍 [YjsValidator] ${source}:`, {
      docId,
      byteLength: data.byteLength,
      isValid: result.isValid,
      firstByte: '0x' + data[0]?.toString(16).padStart(2, '0'),
      preview: Array.from(data.slice(0, 20))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' '),
    });
    
    if (result.issues.length > 0) {
      console.error('  ❌ 问题:', result.issues);
    }
    
    if (result.warnings.length > 0) {
      console.warn('  ⚠️  警告:', result.warnings);
    }
  }
}
```

使用验证器：

```typescript
// 在 applyUpdate 之前
YjsDataValidator.logValidation(docId, update, 'applyUpdate');

// 在 CloudDocStorage.getDocSnapshot 中
const missingBin = base64ToUint8Array(res.data.missing);
YjsDataValidator.logValidation(docId, missingBin, 'CloudDocStorage.getDocSnapshot');
```

### 方案3：添加降级处理

如果文档加载失败，提供友好的错误提示和重试机制：

```typescript
async load(job: Job & { type: 'load' }, signal?: AbortSignal) {
  const doc = this.status.docs.get(job.docId);
  if (!doc) return;
  
  let retryCount = 0;
  const MAX_RETRIES = 3;
  
  while (retryCount < MAX_RETRIES) {
    try {
      const docRecord = await this.storage.getDoc(job.docId);
      
      if (docRecord && !isEmptyUpdate(docRecord.bin)) {
        // 验证数据
        const validation = YjsDataValidator.validate(docRecord.bin);
        
        if (!validation.isValid) {
          throw new Error(
            `文档数据验证失败: ${validation.issues.join(', ')}`
          );
        }
        
        if (validation.warnings.length > 0) {
          console.warn('⚠️ 数据警告:', validation.warnings);
        }
        
        this.applyUpdate(job.docId, docRecord.bin);
        this.status.readyDocs.add(job.docId);
        break; // 成功，退出重试循环
        
      } else {
        // 空文档也标记为 ready
        this.status.readyDocs.add(job.docId);
        break;
      }
      
    } catch (error) {
      retryCount++;
      console.error(`❌ [load] 加载失败 (尝试 ${retryCount}/${MAX_RETRIES}):`, {
        docId: job.docId,
        error,
      });
      
      if (retryCount >= MAX_RETRIES) {
        // 最终失败，通知用户
        this.statusUpdatedSubject$.next({
          error: true,
          errorMessage: '文档加载失败，请刷新页面重试',
        });
        throw error;
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
  
  this.status.connectedDocs.add(job.docId);
  this.statusUpdatedSubject$.next(job.docId);
}
```

### 方案4：检查和修复数据库数据

如果发现数据库中的数据损坏，需要修复：

```sql
-- 查找可疑的快照
SELECT 
    workspace_id,
    doc_id,
    LENGTH(blob) as size,
    HEX(SUBSTRING(blob, 1, 1)) as first_byte,
    FROM_UNIXTIME(timestamp/1000) as updated_at
FROM workspace_snapshots
WHERE blob IS NULL 
   OR LENGTH(blob) = 0
   OR (LENGTH(blob) < 10 AND LENGTH(blob) > 2)
   OR (LENGTH(blob) >= 1 AND HEX(SUBSTRING(blob, 1, 1)) NOT IN ('00', '01'));

-- 备份后删除损坏的快照
-- DELETE FROM workspace_snapshots WHERE doc_id IN (...);

-- 重新生成快照（如果有有效的更新）
-- 需要后端服务提供修复接口
```

## 📝 总结

"Integer out of Range" 错误表明 Y.js 在解析二进制数据时遇到了非法格式。最可能的原因是：

1. **数据库中的数据本身就是损坏的** - 可能是初始化文档时写入了错误格式
2. **Base64 编码/解码不一致** - Java 和 JavaScript 的处理方式不同
3. **YJS 微服务处理错误** - 计算差异或编码状态向量时出错
4. **数据传输过程损坏** - Socket.IO 消息截断或损坏

**建议优先排查顺序**：
1. 添加详细日志，查看后端返回的原始数据
2. 验证前端接收和解码的数据
3. 检查数据库中的原始 blob 数据
4. 测试 Base64 编码一致性
5. 验证 YJS 微服务功能

修复后应该能够正常加载文档。


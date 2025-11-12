# YJS 微服务分析与问题诊断

## 📋 服务概述

**YJS 微服务** 是一个基于 Node.js 的独立服务，为 Java 后端提供 Y.js CRDT 文档处理能力。

### 技术栈
- **Node.js** 18+
- **YJS** 13.6.10 (官方 CRDT 库)
- **lib0** 0.2.97 (YJS 编码库)
- **Express** 4.18.2 (HTTP 服务器)

### 服务端口
- 默认：`http://localhost:3001`
- 可配置：`PORT=3001`

---

## 🔧 核心功能

### 1. 合并更新 (Merge)
**端点**: `POST /api/yjs/merge`

**代码**: `src/yjs-handler.js:13-115`

```javascript
mergeUpdates(updates) {
  const doc = new Y.Doc();
  
  // 应用所有更新，跳过损坏的
  updates.forEach((updateBase64, index) => {
    try {
      const buffer = this.base64ToUint8Array(updateBase64);
      
      // ⚠️ 基本验证：只检查长度
      if (!buffer || buffer.length < 2) {
        console.warn(`跳过更新 ${index + 1}: 数据太短`);
        invalidUpdates.push(...);
        return;
      }
      
      // 尝试应用
      Y.applyUpdate(doc, buffer);
      validUpdates.push(index + 1);
      
    } catch (error) {
      // ⚠️ 捕获错误但继续处理
      console.warn(`跳过更新 ${index + 1}: ${error.message}`);
      invalidUpdates.push(...);
    }
  });
  
  // ⚠️ 只要有一个有效更新就返回成功
  if (validUpdates.length === 0) {
    throw new Error('所有更新都无效');
  }
  
  // 生成合并后的状态
  const merged = Y.encodeStateAsUpdate(doc);
  return {
    merged: this.uint8ArrayToBase64(merged),
    size: merged.length,
    validCount: validUpdates.length,
    invalidCount: invalidUpdates.length
  };
}
```

**关键行为**：
- ✅ 跳过损坏的更新，继续处理剩余更新
- ⚠️ 只要有 1 个有效更新就返回成功
- ⚠️ 不会阻止部分损坏的数据被保存

### 2. 差异计算 (Diff)
**端点**: `POST /api/yjs/diff`

**代码**: `src/yjs-handler.js:123-160`

```javascript
diffUpdate(update, stateVector) {
  const updateBuffer = this.base64ToUint8Array(update);
  
  // 如果没有状态向量，返回完整更新
  if (!stateVector) {
    return { diff: update, size: updateBuffer.length };
  }
  
  const stateBuffer = this.base64ToUint8Array(stateVector);
  
  // 计算差异
  const diff = Y.diffUpdate(updateBuffer, stateBuffer);
  return {
    diff: this.uint8ArrayToBase64(diff),
    size: diff.length
  };
}
```

### 3. 状态向量提取
**端点**: `POST /api/yjs/state-vector`

**代码**: `src/yjs-handler.js:167-189`

```javascript
encodeStateVector(update) {
  const doc = new Y.Doc();
  const buffer = this.base64ToUint8Array(update);
  Y.applyUpdate(doc, buffer);
  
  const stateVector = Y.encodeStateVector(doc);
  return {
    stateVector: this.uint8ArrayToBase64(stateVector),
    size: stateVector.length
  };
}
```

### 4. 应用更新
**端点**: `POST /api/yjs/apply`

**代码**: `src/yjs-handler.js:197-228`

```javascript
applyUpdate(currentDoc, update) {
  const doc = new Y.Doc();
  
  // 应用当前文档
  if (currentDoc) {
    const currentBuffer = this.base64ToUint8Array(currentDoc);
    Y.applyUpdate(doc, currentBuffer);
  }
  
  // 应用新更新
  const updateBuffer = this.base64ToUint8Array(update);
  Y.applyUpdate(doc, updateBuffer);
  
  // 生成结果
  const result = Y.encodeStateAsUpdate(doc);
  return {
    result: this.uint8ArrayToBase64(result),
    size: result.length
  };
}
```

---

## 🔍 Base64 编码/解码

### Node.js 实现 (微服务)

**编码**: `src/yjs-handler.js:303`
```javascript
uint8ArrayToBase64(uint8Array) {
  return Buffer.from(uint8Array).toString('base64');
}
```

**解码**: `src/yjs-handler.js:292`
```javascript
base64ToUint8Array(base64) {
  if (base64 instanceof Uint8Array) {
    return base64;
  }
  const binary = Buffer.from(base64, 'base64');
  return new Uint8Array(binary);
}
```

### Java 实现 (后端)

**编码**: `YjsServiceClient.java:59`
```java
String base64 = Base64.getEncoder().encodeToString(update);
```

**解码**: `YjsServiceClient.java:83`
```java
byte[] merged = Base64.getDecoder().decode(mergedBase64);
```

### JavaScript 实现 (前端)

**编码**: `packages/common/nbstore/src/impls/cloud/socket.ts:124`
```typescript
export function uint8ArrayToBase64(array: Uint8Array): Promise<string> {
  return new Promise<string>(resolve => {
    try {
      // 方法1：使用 btoa
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
```

**解码**: `packages/common/nbstore/src/impls/cloud/socket.ts`
```typescript
export function base64ToUint8Array(base64: string): Uint8Array {
  try {
    // 使用 atob
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    // 回退处理
  }
}
```

**兼容性分析**：
- ✅ Node.js Buffer 和 Java Base64 是标准实现
- ⚠️ JavaScript btoa/atob 在处理非 ASCII 字符时可能有问题
- ⚠️ Android WebView 环境下可能有差异

---

## 🐛 问题根源分析

### 问题 1：宽松的数据验证 ⭐️⭐️⭐️⭐️⭐️

**位置**: `src/yjs-handler.js:36-79`

```javascript
// ⚠️ 只检查长度，不验证格式
if (!buffer || buffer.length < 2) {
  console.warn(`跳过更新: 数据太短`);
  return;
}

// ⚠️ 捕获异常但继续处理
try {
  Y.applyUpdate(doc, buffer);
} catch (error) {
  console.warn(`跳过更新: ${error.message}`);
  // 继续处理下一个更新，不中断
}
```

**后果**：
1. 无效的数据可能被部分合并
2. 合并后的结果可能包含损坏的数据
3. 前端尝试加载时会出现 "Integer out of Range" 错误

**示例场景**：
```
更新列表: [有效数据1, 损坏数据, 有效数据2]
         ↓
YJS 微服务合并
         ↓
结果: { 
  success: true,
  validCount: 2,     // ⚠️ 看起来成功了
  invalidCount: 1,   // 但有 1 个被跳过
  merged: "..."      // 只包含有效数据1+2
}
         ↓
保存到数据库 ✅ (看起来成功)
         ↓
前端加载时:
- 如果损坏数据是第一个: ❌ 失败
- 如果损坏数据在中间: ⚠️ 数据不完整
- 如果损坏数据在最后: ⚠️ 数据不完整
```

### 问题 2：后端的宽松模式

**位置**: `WorkspaceDocStorageAdapter.java:81-106`

```java
// Y.js 数据格式验证（宽松模式）
for (int i = 0; i < updates.size(); i++) {
    byte[] update = updates.get(i);
    if (!isValidYjsUpdate(update)) {
        logger.warn("⚠️ [数据格式警告] 第{}个更新可能不是标准Y.js格式，但仍允许保存", i + 1);
        // 🔧 不再抛出异常，允许数据通过
    }
}
```

**后果**：
- 非标准格式的数据被写入数据库
- 后端不会阻止错误数据的保存

### 问题 3：初始文档创建

**位置**: `SocketIOEventHandler.java:324-337`

```java
if (diff == null) {
    log.warn("文档不存在，尝试自动创建初始文档");
    try {
        var created = docWriter.createInitialDoc(data.spaceId, data.docId, null).block();
        if (created != null) {
            log.info("初始文档已创建: size={}B", created.getBlob().length);
        }
    } catch (Exception ce) {
        log.error("初始文档创建失败: {}", ce.getMessage(), ce);
    }
    
    // 再次获取diff
    diff = storageAdapter.getDocDiff(data.spaceId, data.docId, stateVectorBytes);
}
```

**潜在问题**：
- 如果 `createInitialDoc()` 创建的数据格式不正确
- 或者创建失败但没有抛出异常
- 会导致前端接收到无效数据

---

## 📊 数据流完整追踪

### 保存流程

```
前端编辑
  ↓
YDoc 生成 update (Uint8Array)
  ↓
前端: uint8ArrayToBase64() → Base64 字符串
  ↓
Socket.IO: 'space:push-doc-update'
  ↓
后端: Java Base64.getDecoder().decode() → byte[]
  ↓
后端: 验证 (宽松模式，允许部分错误)
  ↓
保存到数据库 workspace_updates 表
  ↓
触发异步合并任务 (5秒延迟)
  ↓
读取 snapshot + updates
  ↓
YJS 微服务: POST /api/yjs/merge
  - Base64 编码所有 updates
  - 调用 Y.applyUpdate() 逐个应用
  - 跳过损坏的数据 ⚠️
  - 返回合并后的结果
  ↓
后端: Base64.getDecoder().decode() → byte[]
  ↓
保存到 workspace_snapshots 表
```

### 加载流程

```
前端打开文档
  ↓
Socket.IO: 'space:load-doc'
  ↓
后端: storageAdapter.getDocDiff()
  ↓
读取 workspace_snapshots 表
  ↓
如果有 updates: 实时合并 (调用 YJS 微服务)
  ↓
YJS 微服务: diffUpdate() 计算差异
  ↓
后端: Java Base64.getEncoder().encodeToString() → Base64
  ↓
Socket.IO 返回: { missing: "Base64", state: "Base64" }
  ↓
前端: base64ToUint8Array() → Uint8Array
  ↓
前端: applyUpdate(doc, update)
  ↓
Y.js 解析二进制数据
  ↓
如果数据格式错误: ❌ Integer out of Range
```

---

## 🔬 问题诊断步骤

### 步骤 1：检查 YJS 微服务日志

YJS 微服务会输出详细的十六进制预览：

```javascript
// src/yjs-handler.js:49-52
const hexPreview = Array.from(buffer.slice(0, Math.min(16, buffer.length)))
  .map(b => b.toString(16).padStart(2, '0'))
  .join(' ');
console.log(`🔍 更新 ${index + 1} 前16字节: ${hexPreview}`);
```

**查看日志**：
```bash
# Docker 环境
docker logs -f yjs-service

# 本地开发
npm run dev
```

**期望输出**（有效的 Y.js 数据）：
```
🔍 更新 1 前16字节: 00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f
✅ 应用更新 1/3 (1024字节)
```

**错误输出**（损坏的数据）：
```
🔍 更新 2 前16字节: 7b 22 64 61 74 61 22 3a 22 68 65 6c 6c 6f 22 7d
⚠️ 跳过更新 2: Integer out of Range
```
(这是 JSON 格式 `{"data":"hello"}` 而不是 Y.js 二进制)

### 步骤 2：验证数据库中的数据

```sql
-- 检查快照表
SELECT 
    doc_id,
    LENGTH(blob) as blob_size,
    HEX(SUBSTRING(blob, 1, 16)) as first_16_bytes,
    SUBSTRING(blob, 1, 1) as first_byte,
    FROM_UNIXTIME(timestamp/1000) as updated_at
FROM workspace_snapshots
WHERE workspace_id = 'YOUR_WORKSPACE_ID'
  AND doc_id = 'YOUR_DOC_ID';

-- 有效的 Y.js 数据应该：
-- 1. first_byte 是 0x00 (00) 或 0x01 (01)
-- 2. blob_size > 2 字节
-- 3. first_16_bytes 不应该是 ASCII 文本（如 7B 22 = {"）

-- 检查更新表
SELECT 
    doc_id,
    LENGTH(blob) as blob_size,
    HEX(SUBSTRING(blob, 1, 16)) as first_16_bytes,
    FROM_UNIXTIME(created_at/1000) as created_time
FROM workspace_updates
WHERE workspace_id = 'YOUR_WORKSPACE_ID'
  AND doc_id = 'YOUR_DOC_ID'
ORDER BY created_at DESC
LIMIT 10;
```

### 步骤 3：测试 YJS 微服务

使用测试脚本验证微服务功能：

```bash
cd yjs-service
npm test
```

或者手动测试：

```bash
# 测试健康检查
curl http://localhost:3001/health

# 测试合并功能
curl -X POST http://localhost:3001/api/yjs/merge \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      "AAEB",
      "AQIC"
    ]
  }'

# 测试验证功能
curl -X POST http://localhost:3001/api/yjs/validate \
  -H "Content-Type: application/json" \
  -d '{
    "doc": "YOUR_BASE64_DATA"
  }'
```

### 步骤 4：添加详细日志

在关键位置添加调试日志：

**Java 后端** (`DocStorageAdapter.java`):
```java
public DocDiff getDocDiff(String spaceId, String docId, byte[] stateVector) {
    DocRecord docRecord = getDoc(spaceId, docId);
    if (docRecord == null) {
        return null;
    }
    
    // 🔍 添加详细日志
    logger.info("📦 [getDocDiff] 文档数据:", {
        docId: docId,
        blobSize: docRecord.getBlob().length,
        firstByte: String.format("0x%02X", docRecord.getBlob()[0]),
        first16Bytes: getHexPreview(docRecord.getBlob(), 16)
    });
    
    byte[] missing = stateVector != null ?
        yjsServiceClient.diffUpdate(docRecord.getBlob(), stateVector) :
        docRecord.getBlob();
    
    logger.info("📦 [getDocDiff] 差异计算结果:", {
        missingSize: missing.length,
        firstByte: String.format("0x%02X", missing[0])
    });
    
    // ...
}
```

**YJS 微服务** (`yjs-handler.js`):
```javascript
// 已经有详细日志，确保它们被启用
// 在 index.js:21-33 中
```

**前端** (`CloudDocStorage.ts`):
```typescript
override async getDocSnapshot(docId: string) {
  const res = await this.socket.emitWithAck('space:load-doc', {
    spaceType: this.spaceType,
    spaceId: this.spaceId,
    docId: this.idConverter.newIdToOldId(docId),
  });
  
  // 🔍 添加详细日志
  console.log('📦 [CloudDocStorage] 收到数据:', {
    docId,
    missingBase64Length: res.data.missing?.length,
    missingPreview: res.data.missing?.substring(0, 30),
  });
  
  const missingBin = base64ToUint8Array(res.data.missing);
  
  console.log('📦 [CloudDocStorage] Base64解码:', {
    docId,
    byteLength: missingBin.byteLength,
    firstByte: '0x' + missingBin[0]?.toString(16).padStart(2, '0'),
    first16Bytes: Array.from(missingBin.slice(0, 16))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' '),
    looksLikeYjs: missingBin[0] === 0x00 || missingBin[0] === 0x01,
  });
  
  return {
    docId,
    bin: missingBin,
    timestamp: new Date(res.data.timestamp),
  };
}
```

---

## 🛠️ 解决方案

### 方案 1：增强 YJS 微服务的数据验证 ⭐️⭐️⭐️⭐️⭐️

修改 `src/yjs-handler.js`，增加严格验证：

```javascript
mergeUpdates(updates) {
  console.log(`🔄 [YjsHandler] 开始合并 ${updates.length} 个更新`);
  
  // 🔧 可选：严格模式 - 一个失败就全部失败
  const strictMode = process.env.YJS_STRICT_MODE === 'true';
  
  const doc = new Y.Doc();
  const validUpdates = [];
  const invalidUpdates = [];
  
  updates.forEach((updateBase64, index) => {
    try {
      const buffer = this.base64ToUint8Array(updateBase64);
      
      // 增强验证
      if (!this.validateYjsUpdate(buffer)) {
        const error = 'Invalid Y.js update format';
        console.warn(`⚠️ 更新 ${index + 1} 验证失败: ${error}`);
        invalidUpdates.push({ index: index + 1, reason: error });
        
        if (strictMode) {
          throw new Error(error);
        }
        return;
      }
      
      Y.applyUpdate(doc, buffer);
      validUpdates.push(index + 1);
      
    } catch (error) {
      console.warn(`⚠️ 更新 ${index + 1} 应用失败: ${error.message}`);
      invalidUpdates.push({ index: index + 1, reason: error.message });
      
      if (strictMode) {
        throw error;
      }
    }
  });
  
  // 🔧 严格检查：必须全部有效
  if (strictMode && invalidUpdates.length > 0) {
    throw new Error(`严格模式: ${invalidUpdates.length} 个更新无效`);
  }
  
  if (validUpdates.length === 0) {
    throw new Error('所有更新都无效');
  }
  
  const merged = Y.encodeStateAsUpdate(doc);
  return {
    merged: this.uint8ArrayToBase64(merged),
    size: merged.length,
    originalCount: updates.length,
    validCount: validUpdates.length,
    invalidCount: invalidUpdates.length,
    skippedUpdates: invalidUpdates.length > 0 ? invalidUpdates : undefined
  };
}

// 新增：Y.js 更新格式验证
validateYjsUpdate(buffer) {
  if (!buffer || buffer.length < 2) {
    return false;
  }
  
  // Y.js 更新通常以 0x00 或 0x01 开始
  const firstByte = buffer[0];
  if (firstByte !== 0x00 && firstByte !== 0x01) {
    return false;
  }
  
  // 尝试创建临时文档并应用更新
  try {
    const tempDoc = new Y.Doc();
    Y.applyUpdate(tempDoc, buffer);
    return true;
  } catch (error) {
    return false;
  }
}
```

**启用严格模式**：
```bash
# 在 docker-compose.yml 或启动命令中
YJS_STRICT_MODE=true npm start
```

### 方案 2：后端拒绝无效数据

修改 `WorkspaceDocStorageAdapter.java`：

```java
public long pushDocUpdates(String spaceId, String docId, List<byte[]> updates, String editorId) {
    // 🔧 改为严格验证模式
    for (int i = 0; i < updates.size(); i++) {
        byte[] update = updates.get(i);
        if (!isValidYjsUpdate(update)) {
            logger.error("❌ [数据验证失败] 第{}个更新不是有效的Y.js格式", i + 1);
            
            // 显示数据预览
            StringBuilder hex = new StringBuilder();
            for (int j = 0; j < Math.min(20, update.length); j++) {
                hex.append(String.format("%02x ", update[j] & 0xFF));
            }
            logger.error("  前20字节: {}", hex.toString().trim());
            
            // 🔧 抛出异常，拒绝保存
            throw new IllegalArgumentException(
                "更新数据格式无效，不是标准的Y.js二进制格式。" +
                "第一个字节应该是0x00或0x01，实际是0x" + 
                String.format("%02X", update[0] & 0xFF)
            );
        }
    }
    
    // 继续保存...
}
```

### 方案 3：前端增加重试和降级机制

修改 `DocFrontend.load()`：

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
        // 🔧 数据验证
        const firstByte = docRecord.bin[0];
        const looksLikeYjs = firstByte === 0x00 || firstByte === 0x01;
        
        if (!looksLikeYjs) {
          console.error('❌ 数据格式错误:', {
            docId: job.docId,
            firstByte: '0x' + firstByte.toString(16).padStart(2, '0'),
            expected: '0x00 or 0x01',
          });
          
          // 尝试从云端重新获取
          if (retryCount < MAX_RETRIES - 1) {
            console.log('🔄 尝试从云端重新加载...');
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            continue;
          } else {
            throw new Error('文档数据格式错误，无法加载');
          }
        }
        
        this.applyUpdate(job.docId, docRecord.bin);
        this.status.readyDocs.add(job.docId);
        break;
        
      } else {
        // 空文档
        this.status.readyDocs.add(job.docId);
        break;
      }
      
    } catch (error) {
      retryCount++;
      console.error(`❌ 加载失败 (尝试 ${retryCount}/${MAX_RETRIES}):`, error);
      
      if (retryCount >= MAX_RETRIES) {
        // 通知用户
        this.emit('loadError', {
          docId: job.docId,
          error: '文档加载失败，数据可能已损坏',
        });
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
  
  this.status.connectedDocs.add(job.docId);
  this.statusUpdatedSubject$.next(job.docId);
}
```

### 方案 4：数据修复工具

创建数据库修复脚本：

```sql
-- 1. 查找损坏的快照
SELECT 
    workspace_id,
    doc_id,
    LENGTH(blob) as size,
    HEX(SUBSTRING(blob, 1, 1)) as first_byte,
    FROM_UNIXTIME(timestamp/1000) as updated_at
FROM workspace_snapshots
WHERE blob IS NOT NULL
  AND LENGTH(blob) > 0
  AND HEX(SUBSTRING(blob, 1, 1)) NOT IN ('00', '01')
ORDER BY timestamp DESC;

-- 2. 查找可疑的小文件
SELECT 
    workspace_id,
    doc_id,
    LENGTH(blob) as size,
    HEX(blob) as full_content,
    FROM_UNIXTIME(timestamp/1000) as updated_at
FROM workspace_snapshots
WHERE blob IS NOT NULL
  AND LENGTH(blob) < 10
  AND LENGTH(blob) > 2
ORDER BY timestamp DESC;

-- 3. 备份损坏的数据
CREATE TABLE workspace_snapshots_backup AS
SELECT * FROM workspace_snapshots
WHERE doc_id IN (
    SELECT doc_id FROM workspace_snapshots
    WHERE HEX(SUBSTRING(blob, 1, 1)) NOT IN ('00', '01')
);

-- 4. 删除损坏的快照（让它们重新生成）
-- DELETE FROM workspace_snapshots WHERE doc_id IN (...);

-- 5. 检查更新表中的数据
SELECT 
    workspace_id,
    doc_id,
    COUNT(*) as update_count,
    SUM(LENGTH(blob)) as total_size,
    AVG(LENGTH(blob)) as avg_size,
    MIN(LENGTH(blob)) as min_size,
    MAX(LENGTH(blob)) as max_size
FROM workspace_updates
GROUP BY workspace_id, doc_id
HAVING min_size < 10;
```

---

## 📈 监控和告警

### 添加 Prometheus 指标

在 `src/index.js` 中添加：

```javascript
// 指标收集
let mergeTotal = 0;
let mergeErrors = 0;
let mergeDurations = [];

app.post('/api/yjs/merge', (req, res) => {
  const startTime = Date.now();
  mergeTotal++;
  
  try {
    const result = yjsHandler.mergeUpdates(updates);
    
    const duration = Date.now() - startTime;
    mergeDurations.push(duration);
    
    // 保持最近 100 次记录
    if (mergeDurations.length > 100) {
      mergeDurations.shift();
    }
    
    res.json({ success: true, ...result });
    
  } catch (error) {
    mergeErrors++;
    res.status(500).json({ success: false, error: error.message });
  }
});

// Prometheus 指标端点
app.get('/metrics', (req, res) => {
  const avgDuration = mergeDurations.length > 0
    ? mergeDurations.reduce((a, b) => a + b, 0) / mergeDurations.length
    : 0;
  
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP yjs_merge_total Total number of merge operations
# TYPE yjs_merge_total counter
yjs_merge_total ${mergeTotal}

# HELP yjs_merge_errors_total Total number of merge errors
# TYPE yjs_merge_errors_total counter
yjs_merge_errors_total ${mergeErrors}

# HELP yjs_merge_duration_seconds Average merge duration
# TYPE yjs_merge_duration_seconds gauge
yjs_merge_duration_seconds ${avgDuration / 1000}

# HELP yjs_merge_success_rate Merge success rate
# TYPE yjs_merge_success_rate gauge
yjs_merge_success_rate ${mergeTotal > 0 ? (mergeTotal - mergeErrors) / mergeTotal : 0}
  `.trim());
});
```

### Grafana 仪表板

创建监控面板：
- 合并操作总数
- 错误率
- 平均响应时间
- 跳过的无效更新数量

---

## 🎯 总结

### 问题根源

"Integer out of Range" 错误的根本原因是：

1. **YJS 微服务的宽松验证** - 允许跳过损坏的数据，但可能导致不完整的合并
2. **后端的宽松保存模式** - 允许非标准格式的数据写入数据库
3. **初始文档创建可能有问题** - 创建的空文档格式可能不正确
4. **前端缺少数据验证** - 直接尝试应用可能损坏的数据

### 建议优先级

1. **⭐️⭐️⭐️⭐️⭐️ 立即执行**
   - 检查数据库中的现有数据
   - 启用 YJS 微服务的详细日志
   - 添加前端数据验证

2. **⭐️⭐️⭐️⭐️ 高优先级**
   - 启用 YJS 微服务的严格模式
   - 修改后端验证逻辑，拒绝无效数据
   - 添加数据修复脚本

3. **⭐️⭐️⭐️ 中优先级**
   - 前端添加重试机制
   - 完善错误提示
   - 添加监控指标

4. **⭐️⭐️ 低优先级**
   - 优化 Base64 编码一致性
   - 添加端到端测试
   - 完善文档

### 快速修复步骤

1. 检查数据库：运行 SQL 查询找出损坏的数据
2. 启用日志：查看 YJS 微服务和后端的详细日志
3. 临时修复：删除损坏的快照，让系统重新生成
4. 长期修复：启用严格验证模式，防止新的损坏数据写入


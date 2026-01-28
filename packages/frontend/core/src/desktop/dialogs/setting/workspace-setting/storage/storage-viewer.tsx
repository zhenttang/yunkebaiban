import { notify } from '@yunke/component';
import { Button } from '@yunke/component/ui/button';
import {
  SettingHeader,
  SettingRow,
  SettingWrapper,
} from '@yunke/component/setting-components';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { useLiveData, useService } from '@toeverything/infra';
import { DatabaseTableViewIcon, FolderIcon, FileIcon } from '@blocksuite/icons/rc';
import bytes from 'bytes';
import { useCallback, useEffect, useState } from 'react';

interface StorageStats {
  dbName: string;
  tables: TableInfo[];
  totalSize: number;
}

interface TableInfo {
  name: string;
  count: number;
  records: RecordInfo[];
  estimatedSize: number;
}

interface RecordInfo {
  key: string;
  preview: string;
  size: number;
  type: string;
}

// 获取 IndexedDB 数据库列表
async function listIndexedDBDatabases(): Promise<string[]> {
  if (typeof indexedDB === 'undefined') return [];
  
  try {
    // 使用 indexedDB.databases() API（如果可用）
    if ('databases' in indexedDB) {
      const dbs = await (indexedDB as any).databases();
      return dbs.map((db: any) => db.name).filter(Boolean);
    }
  } catch (e) {
    console.warn('无法列出数据库:', e);
  }
  
  return [];
}

// 打开并分析 IndexedDB 数据库
async function analyzeDatabase(dbName: string): Promise<StorageStats | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(dbName);
    
    request.onerror = () => {
      console.error('打开数据库失败:', dbName);
      resolve(null);
    };
    
    request.onsuccess = async () => {
      const db = request.result;
      const tables: TableInfo[] = [];
      let totalSize = 0;
      
      const storeNames = Array.from(db.objectStoreNames);
      
      for (const storeName of storeNames) {
        try {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          
          // 获取记录数
          const countRequest = store.count();
          const count = await new Promise<number>((res) => {
            countRequest.onsuccess = () => res(countRequest.result);
            countRequest.onerror = () => res(0);
          });
          
          // 获取前 10 条记录作为预览
          const records: RecordInfo[] = [];
          let tableSize = 0;
          
          const cursorRequest = store.openCursor();
          let recordCount = 0;
          
          await new Promise<void>((res) => {
            cursorRequest.onsuccess = () => {
              const cursor = cursorRequest.result;
              if (cursor && recordCount < 10) {
                const value = cursor.value;
                const key = formatKey(cursor.key);
                const { preview, size, type } = formatValue(value);
                
                records.push({ key, preview, size, type });
                tableSize += size;
                recordCount++;
                cursor.continue();
              } else {
                res();
              }
            };
            cursorRequest.onerror = () => res();
          });
          
          // 估算总大小
          const estimatedSize = count > 0 ? (tableSize / recordCount) * count : 0;
          totalSize += estimatedSize;
          
          tables.push({
            name: storeName,
            count,
            records,
            estimatedSize,
          });
        } catch (e) {
          console.warn(`分析表 ${storeName} 失败:`, e);
        }
      }
      
      db.close();
      resolve({ dbName, tables, totalSize });
    };
  });
}

function formatKey(key: any): string {
  if (Array.isArray(key)) {
    return `[${key.map(k => formatKey(k)).join(', ')}]`;
  }
  if (key instanceof Date) {
    return key.toISOString();
  }
  if (typeof key === 'object') {
    return JSON.stringify(key);
  }
  return String(key);
}

function formatValue(value: any): { preview: string; size: number; type: string } {
  if (value === null || value === undefined) {
    return { preview: 'null', size: 0, type: 'null' };
  }
  
  if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
    const arr = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
    const hex = Array.from(arr.slice(0, 32))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    return {
      preview: `Binary(${arr.length} bytes): ${hex}${arr.length > 32 ? '...' : ''}`,
      size: arr.length,
      type: 'binary',
    };
  }
  
  if (typeof value === 'object') {
    // 处理包含二进制数据的对象
    const processed: any = {};
    let totalSize = 0;
    
    for (const [k, v] of Object.entries(value)) {
      if (v instanceof Uint8Array || v instanceof ArrayBuffer) {
        const arr = v instanceof ArrayBuffer ? new Uint8Array(v) : v;
        processed[k] = `[Binary: ${arr.length} bytes]`;
        totalSize += arr.length;
      } else if (v instanceof Date) {
        processed[k] = v.toISOString();
        totalSize += 24;
      } else {
        processed[k] = v;
        totalSize += JSON.stringify(v)?.length || 0;
      }
    }
    
    const json = JSON.stringify(processed, null, 2);
    return {
      preview: json.length > 500 ? json.slice(0, 500) + '...' : json,
      size: totalSize || json.length,
      type: 'object',
    };
  }
  
  const str = String(value);
  return {
    preview: str.length > 200 ? str.slice(0, 200) + '...' : str,
    size: str.length,
    type: typeof value,
  };
}

// LocalStorage 分析
function analyzeLocalStorage(): { key: string; value: string; size: number }[] {
  const items: { key: string; value: string; size: number }[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        items.push({
          key,
          value: value.length > 200 ? value.slice(0, 200) + '...' : value,
          size: key.length + value.length,
        });
      }
    }
  } catch (e) {
    console.warn('读取 LocalStorage 失败:', e);
  }
  
  return items.sort((a, b) => b.size - a.size);
}

// SessionStorage 分析
function analyzeSessionStorage(): { key: string; value: string; size: number }[] {
  const items: { key: string; value: string; size: number }[] = [];
  
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const value = sessionStorage.getItem(key) || '';
        items.push({
          key,
          value: value.length > 200 ? value.slice(0, 200) + '...' : value,
          size: key.length + value.length,
        });
      }
    }
  } catch (e) {
    console.warn('读取 SessionStorage 失败:', e);
  }
  
  return items.sort((a, b) => b.size - a.size);
}

export const StorageViewer = () => {
  const workspace = useService(WorkspaceService).workspace;
  const workspaceId = workspace.id;
  const workspaceName = useLiveData(workspace.name$) ?? 'workspace';
  
  const [loading, setLoading] = useState(false);
  const [databases, setDatabases] = useState<string[]>([]);
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<StorageStats | null>(null);
  const [localStorageItems, setLocalStorageItems] = useState<{ key: string; value: string; size: number }[]>([]);
  const [sessionStorageItems, setSessionStorageItems] = useState<{ key: string; value: string; size: number }[]>([]);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [storageEstimate, setStorageEstimate] = useState<{ usage: number; quota: number } | null>(null);
  
  // 加载数据库列表
  const loadDatabases = useCallback(async () => {
    setLoading(true);
    try {
      const dbs = await listIndexedDBDatabases();
      setDatabases(dbs);
      
      // 优先选择当前工作区的数据库
      const currentDb = `local:workspace:${workspaceId}`;
      if (dbs.includes(currentDb)) {
        setSelectedDb(currentDb);
      } else if (dbs.length > 0) {
        setSelectedDb(dbs[0]);
      }
      
      // 加载 LocalStorage
      setLocalStorageItems(analyzeLocalStorage());
      
      // 加载 SessionStorage
      setSessionStorageItems(analyzeSessionStorage());
      
      // 获取存储估算
      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        setStorageEstimate({
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
        });
      }
    } catch (e) {
      console.error('加载数据库列表失败:', e);
      notify.error({ title: '加载失败' });
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);
  
  // 分析选中的数据库
  useEffect(() => {
    if (!selectedDb) {
      setDbStats(null);
      return;
    }
    
    setLoading(true);
    analyzeDatabase(selectedDb)
      .then(stats => {
        setDbStats(stats);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedDb]);
  
  // 初始加载
  useEffect(() => {
    loadDatabases();
  }, [loadDatabases]);
  
  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify.success({ title: '已复制到剪贴板' });
    } catch (e) {
      notify.error({ title: '复制失败' });
    }
  };
  
  return (
    <>
      <SettingHeader
        title="存储结构查看器"
        subtitle={`查看 ${workspaceName} 工作区的详细存储数据`}
      />
      
      {/* 总览 */}
      <SettingWrapper title="存储总览">
        <SettingRow
          name="浏览器存储估算"
          desc={storageEstimate 
            ? `已用: ${bytes.format(storageEstimate.usage)} / 配额: ${bytes.format(storageEstimate.quota)} (${((storageEstimate.usage / storageEstimate.quota) * 100).toFixed(2)}%)`
            : '加载中...'
          }
        >
          <Button size="small" variant="secondary" onClick={loadDatabases} loading={loading}>
            刷新
          </Button>
        </SettingRow>
        
        <SettingRow
          name="当前工作区"
          desc={`ID: ${workspaceId}`}
        />
        
        <SettingRow
          name="IndexedDB 数据库数量"
          desc={`${databases.length} 个数据库`}
        />
      </SettingWrapper>
      
      {/* IndexedDB 数据库选择 */}
      <SettingWrapper title="IndexedDB 数据库">
        <div style={{ padding: '12px 16px' }}>
          <select
            value={selectedDb || ''}
            onChange={(e) => setSelectedDb(e.target.value || null)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--yunke-border-color)',
              backgroundColor: 'var(--yunke-background-primary-color)',
              color: 'var(--yunke-text-primary-color)',
              fontSize: '14px',
            }}
          >
            <option value="">选择数据库...</option>
            {databases.map(db => (
              <option key={db} value={db}>
                {db} {db === `local:workspace:${workspaceId}` ? '(当前工作区)' : ''}
              </option>
            ))}
          </select>
        </div>
        
        {dbStats && (
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ 
              padding: '12px', 
              backgroundColor: 'var(--yunke-background-secondary-color)',
              borderRadius: '8px',
              marginBottom: '12px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                📊 数据库: {dbStats.dbName}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--yunke-text-secondary-color)' }}>
                估算大小: {bytes.format(dbStats.totalSize)} | 
                表数量: {dbStats.tables.length}
              </div>
            </div>
            
            {dbStats.tables.map(table => (
              <div 
                key={table.name}
                style={{ 
                  border: '1px solid var(--yunke-border-color)',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => toggleTable(table.name)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: 'var(--yunke-background-secondary-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DatabaseTableViewIcon />
                    <span style={{ fontWeight: 500 }}>{table.name}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--yunke-text-secondary-color)' }}>
                    {table.count} 条记录 | ~{bytes.format(table.estimatedSize)}
                    <span style={{ marginLeft: '8px' }}>
                      {expandedTables.has(table.name) ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
                
                {expandedTables.has(table.name) && (
                  <div style={{ padding: '12px 16px' }}>
                    {table.records.length === 0 ? (
                      <div style={{ color: 'var(--yunke-text-secondary-color)', fontStyle: 'italic' }}>
                        (空表)
                      </div>
                    ) : (
                      table.records.map((record, idx) => (
                        <div 
                          key={idx}
                          style={{
                            padding: '8px',
                            backgroundColor: idx % 2 === 0 ? 'var(--yunke-background-primary-color)' : 'transparent',
                            borderRadius: '4px',
                            marginBottom: '4px',
                          }}
                        >
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '4px',
                          }}>
                            <div style={{ 
                              fontFamily: 'monospace', 
                              fontSize: '12px',
                              color: 'var(--yunke-brand-color)',
                              wordBreak: 'break-all',
                            }}>
                              🔑 {record.key}
                            </div>
                            <div style={{ 
                              fontSize: '11px', 
                              color: 'var(--yunke-text-secondary-color)',
                              whiteSpace: 'nowrap',
                              marginLeft: '8px',
                            }}>
                              {bytes.format(record.size)} | {record.type}
                            </div>
                          </div>
                          <pre 
                            onClick={() => copyToClipboard(record.preview)}
                            style={{
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                              backgroundColor: 'var(--yunke-background-tertiary-color)',
                              padding: '8px',
                              borderRadius: '4px',
                              margin: 0,
                              maxHeight: '200px',
                              overflow: 'auto',
                              cursor: 'pointer',
                            }}
                            title="点击复制"
                          >
                            {record.preview}
                          </pre>
                        </div>
                      ))
                    )}
                    {table.count > 10 && (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '8px',
                        color: 'var(--yunke-text-secondary-color)',
                        fontSize: '12px',
                      }}>
                        ... 还有 {table.count - 10} 条记录未显示
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SettingWrapper>
      
      {/* LocalStorage */}
      <SettingWrapper title={`LocalStorage (${localStorageItems.length} 项)`}>
        <div style={{ padding: '12px 16px', maxHeight: '400px', overflow: 'auto' }}>
          {localStorageItems.length === 0 ? (
            <div style={{ color: 'var(--yunke-text-secondary-color)' }}>暂无数据</div>
          ) : (
            localStorageItems.map((item, idx) => (
              <div 
                key={item.key}
                style={{
                  padding: '8px',
                  backgroundColor: idx % 2 === 0 ? 'var(--yunke-background-secondary-color)' : 'transparent',
                  borderRadius: '4px',
                  marginBottom: '4px',
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}>
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '12px',
                    color: 'var(--yunke-brand-color)',
                    wordBreak: 'break-all',
                  }}>
                    <FolderIcon style={{ marginRight: '4px' }} />
                    {item.key}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--yunke-text-secondary-color)' }}>
                    {bytes.format(item.size)}
                  </div>
                </div>
                <pre 
                  onClick={() => copyToClipboard(item.value)}
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    backgroundColor: 'var(--yunke-background-tertiary-color)',
                    padding: '6px',
                    borderRadius: '4px',
                    margin: 0,
                    cursor: 'pointer',
                  }}
                  title="点击复制"
                >
                  {item.value}
                </pre>
              </div>
            ))
          )}
        </div>
      </SettingWrapper>
      
      {/* SessionStorage */}
      <SettingWrapper title={`SessionStorage (${sessionStorageItems.length} 项)`}>
        <div style={{ padding: '12px 16px', maxHeight: '300px', overflow: 'auto' }}>
          {sessionStorageItems.length === 0 ? (
            <div style={{ color: 'var(--yunke-text-secondary-color)' }}>暂无数据</div>
          ) : (
            sessionStorageItems.map((item, idx) => (
              <div 
                key={item.key}
                style={{
                  padding: '8px',
                  backgroundColor: idx % 2 === 0 ? 'var(--yunke-background-secondary-color)' : 'transparent',
                  borderRadius: '4px',
                  marginBottom: '4px',
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}>
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '12px',
                    color: 'var(--yunke-brand-color)',
                  }}>
                    <FileIcon style={{ marginRight: '4px' }} />
                    {item.key}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--yunke-text-secondary-color)' }}>
                    {bytes.format(item.size)}
                  </div>
                </div>
                <pre 
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    backgroundColor: 'var(--yunke-background-tertiary-color)',
                    padding: '6px',
                    borderRadius: '4px',
                    margin: 0,
                  }}
                >
                  {item.value}
                </pre>
              </div>
            ))
          )}
        </div>
      </SettingWrapper>
      
      {/* 存储路径说明 */}
      <SettingWrapper title="存储位置说明">
        <div style={{ padding: '16px', fontSize: '13px', lineHeight: '1.8' }}>
          <div style={{ marginBottom: '16px' }}>
            <strong>📦 IndexedDB 数据库</strong>
            <div style={{ color: 'var(--yunke-text-secondary-color)', marginTop: '4px' }}>
              位置: 浏览器内部存储<br/>
              路径格式: <code style={{ backgroundColor: 'var(--yunke-background-tertiary-color)', padding: '2px 6px', borderRadius: '4px' }}>
                {'{flavour}:{type}:{id}'}
              </code><br/>
              示例: <code style={{ backgroundColor: 'var(--yunke-background-tertiary-color)', padding: '2px 6px', borderRadius: '4px' }}>
                local:workspace:{workspaceId}
              </code>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <strong>💾 LocalStorage</strong>
            <div style={{ color: 'var(--yunke-text-secondary-color)', marginTop: '4px' }}>
              位置: 浏览器 LocalStorage<br/>
              常用键:
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                <li><code>yunke-local-workspace</code> - 本地工作区 ID 列表</li>
                <li><code>global-cache:*</code> - 全局缓存</li>
                <li><code>global-state:*</code> - 全局状态</li>
                <li><code>yunke:cloud-sync:enabled</code> - 云同步开关</li>
              </ul>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <strong>🔑 数据表说明</strong>
            <div style={{ color: 'var(--yunke-text-secondary-color)', marginTop: '4px' }}>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                <li><code>snapshots</code> - 文档完整快照 (Yjs 状态)</li>
                <li><code>updates</code> - 增量更新记录</li>
                <li><code>clocks</code> - 文档修改时间戳</li>
                <li><code>blobs</code> - 附件/图片元数据</li>
                <li><code>blobData</code> - 附件/图片二进制数据</li>
                <li><code>peerClocks</code> - 多端同步时钟</li>
                <li><code>indexerRecords</code> - 搜索索引</li>
              </ul>
            </div>
          </div>
          
          <div style={{ 
            padding: '12px', 
            backgroundColor: 'var(--yunke-background-warning-color)', 
            borderRadius: '8px',
            marginTop: '16px',
          }}>
            ⚠️ <strong>注意:</strong> 清除浏览器数据会删除所有本地工作区内容！建议定期导出备份。
          </div>
        </div>
      </SettingWrapper>
    </>
  );
};

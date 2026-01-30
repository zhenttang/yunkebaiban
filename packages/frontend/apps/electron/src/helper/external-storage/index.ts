/**
 * 外部存储模块
 * 支持 S3、阿里云 OSS、WebDAV 等外部存储服务
 */

import fs from 'fs-extra';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import crypto from 'node:crypto';

import { logger } from '../logger';
import { mainRPC } from '../main-rpc';

// 存储配置类型
export interface ExternalStorageConfig {
  type: 'local' | 's3' | 'oss' | 'webdav';
  config: Record<string, string>;
}

// S3 配置
interface S3Config {
  endpoint: string;
  bucket: string;
  region?: string;
  accessKey: string;
  secretKey: string;
}

// OSS 配置
interface OSSConfig {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
}

// WebDAV 配置
interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
}

/**
 * 获取外部存储配置
 */
export async function getExternalStorageConfig(): Promise<ExternalStorageConfig | null> {
  try {
    const userDataPath = await mainRPC.getPath('userData');
    const configPath = path.join(userDataPath, 'config.json');
    
    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath);
      if (config.externalStorage?.type && config.externalStorage.type !== 'local') {
        return config.externalStorage;
      }
    }
  } catch (error) {
    logger.error('[ExternalStorage] 读取配置失败:', error);
  }
  return null;
}

/**
 * 测试 S3 连接
 * 支持 AWS S3 和 S3 兼容服务（MinIO、hi168 等）
 */
export async function testS3Connection(config: S3Config): Promise<{ success: boolean; message: string }> {
  try {
    const { endpoint, bucket, accessKey, secretKey } = config;
    
    if (!endpoint || !bucket || !accessKey || !secretKey) {
      return { success: false, message: '请填写所有必填字段' };
    }
    
    logger.info('[S3] 开始测试连接:', { endpoint, bucket, accessKey: accessKey.substring(0, 8) + '...' });
    
    // 解析 endpoint
    let host = endpoint;
    let protocol: typeof https | typeof http = https;
    let baseUrl = '';
    
    if (endpoint.includes('://')) {
      const url = new URL(endpoint);
      host = url.host;
      protocol = url.protocol === 'https:' ? https : http;
      baseUrl = `${url.protocol}//${url.host}`;
    } else {
      host = endpoint;
      baseUrl = `https://${endpoint}`;
    }
    
    // S3 兼容服务通常使用 path-style: endpoint/bucket
    const resourcePath = `/${bucket}/`;
    const fullUrl = `${baseUrl}${resourcePath}`;
    
    // 构建签名
    const date = new Date().toUTCString();
    const stringToSign = `GET\n\n\n${date}\n${resourcePath}`;
    
    logger.info('[S3] 签名字符串:', stringToSign.replace(/\n/g, '\\n'));
    
    const signature = crypto
      .createHmac('sha1', secretKey)
      .update(stringToSign)
      .digest('base64');
    
    const authorization = `AWS ${accessKey}:${signature}`;
    
    logger.info('[S3] 请求 URL:', fullUrl);
    
    return new Promise((resolve) => {
      const req = protocol.request(fullUrl, {
        method: 'GET',
        headers: {
          'Host': host,
          'Date': date,
          'Authorization': authorization,
        },
        timeout: 15000,
      }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          logger.info('[S3] 响应状态:', res.statusCode, '响应体:', body.substring(0, 200));
          
          // 200: 成功列出 bucket 内容
          // 403: 认证成功但无权限（说明连接是通的）
          // 404: bucket 不存在（说明连接是通的）
          // 301/307: 重定向（可能需要换 endpoint）
          if (res.statusCode === 200) {
            resolve({ success: true, message: '连接成功，Bucket 可访问' });
          } else if (res.statusCode === 403) {
            // 检查是否是签名错误
            if (body.includes('SignatureDoesNotMatch')) {
              resolve({ success: false, message: '签名验证失败，请检查 Secret Key' });
            } else if (body.includes('InvalidAccessKeyId')) {
              resolve({ success: false, message: 'Access Key 无效' });
            } else {
              resolve({ success: true, message: '连接成功（无列举权限，但 Bucket 存在）' });
            }
          } else if (res.statusCode === 404) {
            if (body.includes('NoSuchBucket')) {
              resolve({ success: false, message: 'Bucket 不存在，请检查 Bucket 名称' });
            } else {
              resolve({ success: true, message: '连接成功' });
            }
          } else if (res.statusCode === 301 || res.statusCode === 307) {
            const location = res.headers.location;
            resolve({ success: false, message: `需要重定向到: ${location}` });
          } else {
            resolve({ success: false, message: `HTTP ${res.statusCode}: ${body.substring(0, 100)}` });
          }
        });
      });
      
      req.on('error', (error) => {
        logger.error('[S3] 请求错误:', error);
        resolve({ success: false, message: `连接错误: ${error.message}` });
      });
      
      req.on('timeout', () => {
        logger.error('[S3] 请求超时');
        req.destroy();
        resolve({ success: false, message: '连接超时（15秒）' });
      });
      
      req.end();
    });
  } catch (error) {
    logger.error('[S3] 异常:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * 测试 OSS 连接
 */
export async function testOSSConnection(config: OSSConfig): Promise<{ success: boolean; message: string }> {
  try {
    const { endpoint, bucket, accessKeyId, accessKeySecret } = config;
    
    if (!endpoint || !bucket || !accessKeyId || !accessKeySecret) {
      return { success: false, message: '请填写所有必填字段' };
    }
    
    // OSS 使用类似 S3 的签名方式
    const date = new Date().toUTCString();
    const host = `${bucket}.${endpoint}`;
    const path = '/';
    
    const stringToSign = `HEAD\n\n\n${date}\n/${bucket}${path}`;
    const signature = crypto
      .createHmac('sha1', accessKeySecret)
      .update(stringToSign)
      .digest('base64');
    
    const authorization = `OSS ${accessKeyId}:${signature}`;
    
    return new Promise((resolve) => {
      const url = `https://${host}${path}`;
      
      const req = https.request(url, {
        method: 'HEAD',
        headers: {
          'Host': host,
          'Date': date,
          'Authorization': authorization,
        },
        timeout: 10000,
      }, (res) => {
        if (res.statusCode === 200 || res.statusCode === 403 || res.statusCode === 404) {
          resolve({ success: true, message: '连接成功' });
        } else {
          resolve({ success: false, message: `HTTP ${res.statusCode}` });
        }
      });
      
      req.on('error', (error) => {
        resolve({ success: false, message: error.message });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, message: '连接超时' });
      });
      
      req.end();
    });
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

/**
 * 测试 WebDAV 连接
 */
export async function testWebDAVConnection(config: WebDAVConfig): Promise<{ success: boolean; message: string }> {
  try {
    const { url, username, password } = config;
    
    if (!url || !username || !password) {
      return { success: false, message: '请填写所有必填字段' };
    }
    
    const parsedUrl = new URL(url);
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    
    return new Promise((resolve) => {
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = protocol.request(url, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Depth': '0',
          'Content-Type': 'application/xml',
        },
        timeout: 10000,
      }, (res) => {
        if (res.statusCode === 207 || res.statusCode === 200 || res.statusCode === 401) {
          // 207 Multi-Status 是 WebDAV 正常响应
          // 401 说明服务器响应了但认证失败
          if (res.statusCode === 401) {
            resolve({ success: false, message: '认证失败，请检查用户名密码' });
          } else {
            resolve({ success: true, message: '连接成功' });
          }
        } else {
          resolve({ success: false, message: `HTTP ${res.statusCode}` });
        }
      });
      
      req.on('error', (error) => {
        resolve({ success: false, message: error.message });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, message: '连接超时' });
      });
      
      // PROPFIND 请求体
      req.write('<?xml version="1.0" encoding="utf-8"?><D:propfind xmlns:D="DAV:"><D:prop><D:resourcetype/></D:prop></D:propfind>');
      req.end();
    });
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

/**
 * 统一的测试连接接口
 */
export async function testExternalStorageConnection(
  type: string,
  config: Record<string, string>
): Promise<{ success: boolean; message: string }> {
  logger.info('[ExternalStorage] 测试连接:', { type });
  
  switch (type) {
    case 's3':
      return testS3Connection(config as unknown as S3Config);
    case 'oss':
      return testOSSConnection(config as unknown as OSSConfig);
    case 'webdav':
      return testWebDAVConnection(config as unknown as WebDAVConfig);
    case 'local':
      return { success: true, message: '本地存储无需测试' };
    default:
      return { success: false, message: '不支持的存储类型' };
  }
}

/**
 * S3 上传文件
 */
export async function uploadToS3(
  config: S3Config,
  localPath: string,
  remotePath: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { endpoint, bucket, accessKey, secretKey } = config;
    
    if (!await fs.pathExists(localPath)) {
      return { success: false, message: '本地文件不存在' };
    }
    
    const fileContent = await fs.readFile(localPath);
    const fileSize = fileContent.length;
    
    logger.info('[S3] 开始上传:', { localPath, remotePath, size: fileSize });
    
    // 解析 endpoint
    let host = endpoint;
    let protocol: typeof https | typeof http = https;
    let baseUrl = '';
    
    if (endpoint.includes('://')) {
      const url = new URL(endpoint);
      host = url.host;
      protocol = url.protocol === 'https:' ? https : http;
      baseUrl = `${url.protocol}//${url.host}`;
    } else {
      host = endpoint;
      baseUrl = `https://${endpoint}`;
    }
    
    const resourcePath = `/${bucket}/${remotePath}`;
    const fullUrl = `${baseUrl}${resourcePath}`;
    const date = new Date().toUTCString();
    const contentType = 'application/octet-stream';
    
    const stringToSign = `PUT\n\n${contentType}\n${date}\n${resourcePath}`;
    const signature = crypto
      .createHmac('sha1', secretKey)
      .update(stringToSign)
      .digest('base64');
    const authorization = `AWS ${accessKey}:${signature}`;
    
    return new Promise((resolve) => {
      const req = protocol.request(fullUrl, {
        method: 'PUT',
        headers: {
          'Host': host,
          'Date': date,
          'Authorization': authorization,
          'Content-Type': contentType,
          'Content-Length': fileSize,
        },
        timeout: 60000,
      }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          logger.info('[S3] 上传响应:', res.statusCode);
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve({ success: true, message: '上传成功' });
          } else {
            resolve({ success: false, message: `上传失败: HTTP ${res.statusCode} - ${body}` });
          }
        });
      });
      
      req.on('error', (error) => {
        logger.error('[S3] 上传错误:', error);
        resolve({ success: false, message: `上传错误: ${error.message}` });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, message: '上传超时' });
      });
      
      req.write(fileContent);
      req.end();
    });
  } catch (error) {
    logger.error('[S3] 上传异常:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * S3 下载文件
 */
export async function downloadFromS3(
  config: S3Config,
  remotePath: string,
  localPath: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { endpoint, bucket, accessKey, secretKey } = config;
    
    logger.info('[S3] 开始下载:', { remotePath, localPath });
    
    // 解析 endpoint
    let host = endpoint;
    let protocol: typeof https | typeof http = https;
    let baseUrl = '';
    
    if (endpoint.includes('://')) {
      const url = new URL(endpoint);
      host = url.host;
      protocol = url.protocol === 'https:' ? https : http;
      baseUrl = `${url.protocol}//${url.host}`;
    } else {
      host = endpoint;
      baseUrl = `https://${endpoint}`;
    }
    
    const resourcePath = `/${bucket}/${remotePath}`;
    const fullUrl = `${baseUrl}${resourcePath}`;
    const date = new Date().toUTCString();
    
    const stringToSign = `GET\n\n\n${date}\n${resourcePath}`;
    const signature = crypto
      .createHmac('sha1', secretKey)
      .update(stringToSign)
      .digest('base64');
    const authorization = `AWS ${accessKey}:${signature}`;
    
    return new Promise((resolve) => {
      const req = protocol.request(fullUrl, {
        method: 'GET',
        headers: {
          'Host': host,
          'Date': date,
          'Authorization': authorization,
        },
        timeout: 60000,
      }, (res) => {
        if (res.statusCode === 200) {
          const chunks: Buffer[] = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', async () => {
            try {
              const data = Buffer.concat(chunks);
              await fs.ensureDir(path.dirname(localPath));
              await fs.writeFile(localPath, data);
              logger.info('[S3] 下载成功:', { size: data.length });
              resolve({ success: true, message: '下载成功' });
            } catch (err) {
              resolve({ success: false, message: `保存文件失败: ${err}` });
            }
          });
        } else if (res.statusCode === 404) {
          resolve({ success: false, message: '云端文件不存在' });
        } else {
          let body = '';
          res.on('data', chunk => { body += chunk; });
          res.on('end', () => {
            resolve({ success: false, message: `下载失败: HTTP ${res.statusCode}` });
          });
        }
      });
      
      req.on('error', (error) => {
        logger.error('[S3] 下载错误:', error);
        resolve({ success: false, message: `下载错误: ${error.message}` });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, message: '下载超时' });
      });
      
      req.end();
    });
  } catch (error) {
    logger.error('[S3] 下载异常:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * 列出 S3 中的文件
 */
export async function listS3Files(
  config: S3Config,
  prefix: string = ''
): Promise<{ success: boolean; files?: Array<{ key: string; size: number; lastModified: string }>; message?: string }> {
  try {
    const { endpoint, bucket, accessKey, secretKey } = config;
    
    logger.info('[S3] 列出文件:', { bucket, prefix });
    
    // 解析 endpoint
    let host = endpoint;
    let protocol: typeof https | typeof http = https;
    let baseUrl = '';
    
    if (endpoint.includes('://')) {
      const url = new URL(endpoint);
      host = url.host;
      protocol = url.protocol === 'https:' ? https : http;
      baseUrl = `${url.protocol}//${url.host}`;
    } else {
      host = endpoint;
      baseUrl = `https://${endpoint}`;
    }
    
    const resourcePath = `/${bucket}/`;
    const queryString = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
    const fullUrl = `${baseUrl}${resourcePath}${queryString}`;
    const date = new Date().toUTCString();
    
    const stringToSign = `GET\n\n\n${date}\n${resourcePath}`;
    const signature = crypto
      .createHmac('sha1', secretKey)
      .update(stringToSign)
      .digest('base64');
    const authorization = `AWS ${accessKey}:${signature}`;
    
    return new Promise((resolve) => {
      const req = protocol.request(fullUrl, {
        method: 'GET',
        headers: {
          'Host': host,
          'Date': date,
          'Authorization': authorization,
        },
        timeout: 30000,
      }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            // 解析 XML 响应
            const files: Array<{ key: string; size: number; lastModified: string }> = [];
            const keyMatches = body.matchAll(/<Key>([^<]+)<\/Key>/g);
            const sizeMatches = body.matchAll(/<Size>([^<]+)<\/Size>/g);
            const dateMatches = body.matchAll(/<LastModified>([^<]+)<\/LastModified>/g);
            
            const keys = Array.from(keyMatches).map(m => m[1]);
            const sizes = Array.from(sizeMatches).map(m => parseInt(m[1]));
            const dates = Array.from(dateMatches).map(m => m[1]);
            
            for (let i = 0; i < keys.length; i++) {
              files.push({
                key: keys[i],
                size: sizes[i] || 0,
                lastModified: dates[i] || '',
              });
            }
            
            resolve({ success: true, files });
          } else {
            resolve({ success: false, message: `HTTP ${res.statusCode}` });
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({ success: false, message: error.message });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, message: '超时' });
      });
      
      req.end();
    });
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

/**
 * 获取本地工作区列表
 */
export async function getLocalWorkspaces(): Promise<Array<{ id: string; name: string; path: string; size: number; lastModified: string }>> {
  try {
    const userDataPath = await mainRPC.getPath('userData');
    const configPath = path.join(userDataPath, 'config.json');
    let workspacesBasePath = path.join(userDataPath, 'workspaces');
    
    // 读取配置中的自定义路径
    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath);
      if (config.offline?.dataPath) {
        workspacesBasePath = path.join(config.offline.dataPath, 'workspaces');
      }
    }
    
    const localPath = path.join(workspacesBasePath, 'local');
    
    if (!await fs.pathExists(localPath)) {
      return [];
    }
    
    const workspaces: Array<{ id: string; name: string; path: string; size: number; lastModified: string }> = [];
    const dirs = await fs.readdir(localPath);
    
    for (const dir of dirs) {
      const dbPath = path.join(localPath, dir, 'storage.db');
      if (await fs.pathExists(dbPath)) {
        const stat = await fs.stat(dbPath);
        workspaces.push({
          id: dir,
          name: dir,
          path: dbPath,
          size: stat.size,
          lastModified: stat.mtime.toISOString(),
        });
      }
    }
    
    return workspaces;
  } catch (error) {
    logger.error('[ExternalStorage] 获取本地工作区失败:', error);
    return [];
  }
}

/**
 * 同步工作区到云端
 */
export async function syncWorkspaceToCloud(workspaceId: string): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getExternalStorageConfig();
    if (!config || config.type === 'local') {
      return { success: false, message: '未配置外部存储' };
    }
    
    const workspaces = await getLocalWorkspaces();
    const workspace = workspaces.find(w => w.id === workspaceId);
    
    if (!workspace) {
      return { success: false, message: '工作区不存在' };
    }
    
    const remotePath = `yunke-workspaces/local/${workspaceId}/storage.db`;
    
    if (config.type === 's3') {
      return uploadToS3(config.config as unknown as S3Config, workspace.path, remotePath);
    }
    
    return { success: false, message: '不支持的存储类型' };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

/**
 * 从云端下载工作区
 */
export async function syncWorkspaceFromCloud(workspaceId: string): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getExternalStorageConfig();
    if (!config || config.type === 'local') {
      return { success: false, message: '未配置外部存储' };
    }
    
    const userDataPath = await mainRPC.getPath('userData');
    const configPath = path.join(userDataPath, 'config.json');
    let workspacesBasePath = path.join(userDataPath, 'workspaces');
    
    if (await fs.pathExists(configPath)) {
      const appConfig = await fs.readJson(configPath);
      if (appConfig.offline?.dataPath) {
        workspacesBasePath = path.join(appConfig.offline.dataPath, 'workspaces');
      }
    }
    
    const localPath = path.join(workspacesBasePath, 'local', workspaceId, 'storage.db');
    const remotePath = `yunke-workspaces/local/${workspaceId}/storage.db`;
    
    if (config.type === 's3') {
      return downloadFromS3(config.config as unknown as S3Config, remotePath, localPath);
    }
    
    return { success: false, message: '不支持的存储类型' };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

/**
 * 获取云端工作区列表
 */
export async function getCloudWorkspaces(): Promise<{ success: boolean; workspaces?: Array<{ id: string; size: number; lastModified: string }>; message?: string }> {
  try {
    const config = await getExternalStorageConfig();
    if (!config || config.type === 'local') {
      return { success: false, message: '未配置外部存储' };
    }
    
    if (config.type === 's3') {
      const result = await listS3Files(config.config as unknown as S3Config, 'yunke-workspaces/local/');
      if (result.success && result.files) {
        // 提取工作区 ID
        const workspaceMap = new Map<string, { id: string; size: number; lastModified: string }>();
        
        for (const file of result.files) {
          const match = file.key.match(/yunke-workspaces\/local\/([^/]+)\/storage\.db/);
          if (match) {
            workspaceMap.set(match[1], {
              id: match[1],
              size: file.size,
              lastModified: file.lastModified,
            });
          }
        }
        
        return { success: true, workspaces: Array.from(workspaceMap.values()) };
      }
      return { success: true, workspaces: [] };
    }
    
    return { success: false, message: '不支持的存储类型' };
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

// 导出 handlers
export const externalStorageHandlers = {
  testConnection: testExternalStorageConnection,
  getConfig: getExternalStorageConfig,
  getLocalWorkspaces,
  getCloudWorkspaces,
  syncToCloud: syncWorkspaceToCloud,
  syncFromCloud: syncWorkspaceFromCloud,
  uploadFile: async (localPath: string, remotePath: string) => {
    const config = await getExternalStorageConfig();
    if (!config || config.type !== 's3') {
      return { success: false, message: '未配置 S3 存储' };
    }
    return uploadToS3(config.config as unknown as S3Config, localPath, remotePath);
  },
  downloadFile: async (remotePath: string, localPath: string) => {
    const config = await getExternalStorageConfig();
    if (!config || config.type !== 's3') {
      return { success: false, message: '未配置 S3 存储' };
    }
    return downloadFromS3(config.config as unknown as S3Config, remotePath, localPath);
  },
  listFiles: async (prefix: string = '') => {
    const config = await getExternalStorageConfig();
    if (!config || config.type !== 's3') {
      return { success: false, message: '未配置 S3 存储' };
    }
    return listS3Files(config.config as unknown as S3Config, prefix);
  },
};

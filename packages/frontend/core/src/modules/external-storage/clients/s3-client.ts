/**
 * Web 兼容的 S3 客户端
 * 使用 Fetch API 和 Web Crypto API 实现
 * 支持开发环境代理（解决 CORS 问题）
 */

import type { S3Config, ListFilesResult, TestConnectionResult } from '../types';

// 是否使用开发代理（在开发环境下启用）
const USE_DEV_PROXY = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

/**
 * 将 URL 转换为代理 URL（开发环境）
 * 原理：将目标 URL 编码为 Base64，通过本地代理转发
 */
function getProxyUrl(originalUrl: string): string {
  if (!USE_DEV_PROXY) {
    return originalUrl;
  }
  
  // 将完整目标 URL 编码为 Base64
  const encodedUrl = btoa(originalUrl);
  
  // 返回代理 URL（代理服务器会从 Base64 解码完整 URL）
  return `/external-storage-proxy/${encodedUrl}`;
}

// HMAC-SHA256 签名（使用 Web Crypto API）
async function hmacSha256(key: ArrayBuffer | string, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyData = typeof key === 'string' ? encoder.encode(key) : key;
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
}

// SHA-256 哈希（字符串）
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToHex(hashBuffer);
}

// SHA-256 哈希（ArrayBuffer）
async function sha256ArrayBuffer(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToHex(hashBuffer);
}

// ArrayBuffer 转 Hex 字符串
function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// 获取签名密钥
async function getSignatureKey(
  secretKey: string,
  dateStamp: string,
  regionName: string,
  serviceName: string
): Promise<ArrayBuffer> {
  const kDate = await hmacSha256('AWS4' + secretKey, dateStamp);
  const kRegion = await hmacSha256(kDate, regionName);
  const kService = await hmacSha256(kRegion, serviceName);
  const kSigning = await hmacSha256(kService, 'aws4_request');
  return kSigning;
}

// 生成 AWS Signature V4
async function signRequest(
  method: string,
  url: URL,
  headers: Record<string, string>,
  payload: string | ArrayBuffer | 'UNSIGNED-PAYLOAD',
  config: S3Config
): Promise<Record<string, string>> {
  const { accessKey, secretKey, region = 'us-east-1' } = config;
  
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);
  
  // 规范化请求
  const canonicalUri = url.pathname;
  const canonicalQuerystring = url.search.substring(1);
  
  // 计算 payload hash
  let payloadHash: string;
  if (payload === 'UNSIGNED-PAYLOAD') {
    payloadHash = 'UNSIGNED-PAYLOAD';
  } else if (payload instanceof ArrayBuffer) {
    payloadHash = await sha256ArrayBuffer(payload);
  } else {
    payloadHash = await sha256(payload);
  }
  
  const signedHeaders = Object.keys(headers)
    .map(k => k.toLowerCase())
    .sort()
    .join(';');
  
  const canonicalHeaders = Object.entries(headers)
    .map(([k, v]) => `${k.toLowerCase()}:${v.trim()}\n`)
    .sort()
    .join('');
  
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  
  // 创建字符串签名
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    await sha256(canonicalRequest),
  ].join('\n');
  
  // 计算签名
  const signingKey = await getSignatureKey(secretKey, dateStamp, region, 's3');
  const signatureBuffer = await hmacSha256(signingKey, stringToSign);
  const signature = arrayBufferToHex(signatureBuffer);
  
  // 创建授权头
  const authorization = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    ...headers,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    'Authorization': authorization,
  };
}

// 解析 S3 端点
function parseEndpoint(endpoint: string): { host: string; protocol: string } {
  if (endpoint.includes('://')) {
    const url = new URL(endpoint);
    return { host: url.host, protocol: url.protocol };
  }
  return { host: endpoint, protocol: 'https:' };
}

/**
 * 测试 S3 连接
 */
export async function testS3Connection(config: S3Config): Promise<TestConnectionResult> {
  try {
    const { endpoint, bucket } = config;
    const { host, protocol } = parseEndpoint(endpoint);
    
    // 使用 path-style 访问
    const url = new URL(`${protocol}//${host}/${bucket}/`);
    
    const headers: Record<string, string> = {
      'Host': host,
    };
    
    const signedHeaders = await signRequest('GET', url, headers, '', config);
    
    // 使用代理 URL（开发环境）
    const fetchUrl = getProxyUrl(url.toString());
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: signedHeaders,
    });
    
    if (response.status === 200) {
      return { success: true, message: 'Bucket 连接成功' + (USE_DEV_PROXY ? '（通过代理）' : '') };
    } else if (response.status === 403) {
      return { success: false, message: '访问被拒绝，请检查 Access Key 和 Secret Key' };
    } else if (response.status === 404) {
      return { success: false, message: 'Bucket 不存在，请检查 Bucket 名称' };
    } else {
      const text = await response.text();
      return { success: false, message: `HTTP ${response.status}: ${text.substring(0, 200)}` };
    }
  } catch (error) {
    // 可能是 CORS 问题
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { 
        success: false, 
        message: USE_DEV_PROXY 
          ? '代理请求失败，请检查开发服务器是否正常运行。'
          : '网络请求失败，可能是 CORS 配置问题。请在 S3 存储桶中配置 CORS 规则允许当前域名访问。'
      };
    }
    return { success: false, message: String(error) };
  }
}

/**
 * 列出 S3 文件
 */
export async function listS3Files(config: S3Config, prefix: string = ''): Promise<ListFilesResult> {
  try {
    const { endpoint, bucket } = config;
    const { host, protocol } = parseEndpoint(endpoint);
    
    const url = new URL(`${protocol}//${host}/${bucket}/`);
    if (prefix) {
      url.searchParams.set('prefix', prefix);
    }
    
    const headers: Record<string, string> = {
      'Host': host,
    };
    
    const signedHeaders = await signRequest('GET', url, headers, '', config);
    
    // 使用代理 URL（开发环境）
    const fetchUrl = getProxyUrl(url.toString());
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: signedHeaders,
    });
    
    if (response.status === 200) {
      const text = await response.text();
      
      // 解析 XML 响应
      const files: Array<{ key: string; size: number; lastModified: string }> = [];
      const keyMatches = text.matchAll(/<Key>([^<]+)<\/Key>/g);
      const sizeMatches = text.matchAll(/<Size>([^<]+)<\/Size>/g);
      const dateMatches = text.matchAll(/<LastModified>([^<]+)<\/LastModified>/g);
      
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
      
      return { success: true, files };
    } else {
      return { success: false, message: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { success: false, message: String(error) };
  }
}

/**
 * 上传文件到 S3
 * 支持大文件上传（最大 5GB 单次上传）
 */
export async function uploadToS3(
  config: S3Config,
  remotePath: string,
  data: ArrayBuffer | Blob | string
): Promise<TestConnectionResult> {
  try {
    const { endpoint, bucket } = config;
    const { host, protocol } = parseEndpoint(endpoint);
    
    const url = new URL(`${protocol}//${host}/${bucket}/${remotePath}`);
    
    // 转换数据为 ArrayBuffer
    let bodyData: ArrayBuffer;
    
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      bodyData = encoder.encode(data).buffer;
    } else if (data instanceof Blob) {
      bodyData = await data.arrayBuffer();
    } else {
      bodyData = data;
    }
    
    const fileSizeMB = (bodyData.byteLength / 1024 / 1024).toFixed(2);
    console.log(`[S3] 开始上传: ${remotePath}, 大小: ${fileSizeMB} MB`);
    
    // 根据文件大小设置超时时间（最少 60 秒，每 MB 增加 5 秒）
    const timeoutMs = Math.max(60000, bodyData.byteLength / 1024 / 1024 * 5000);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const headers: Record<string, string> = {
      'Host': host,
      'Content-Type': 'application/octet-stream',
      'Content-Length': bodyData.byteLength.toString(),
    };
    
    // 使用实际的 payload 计算签名
    const signedHeaders = await signRequest('PUT', url, headers, bodyData, config);
    
    // 使用代理 URL（开发环境）
    const fetchUrl = getProxyUrl(url.toString());
    
    const startTime = Date.now();
    const response = await fetch(fetchUrl, {
      method: 'PUT',
      headers: signedHeaders,
      body: bodyData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[S3] 上传完成: ${response.status}, 耗时: ${duration}s`);
    
    if (response.status === 200 || response.status === 201) {
      return { success: true, message: `上传成功 (${fileSizeMB} MB, ${duration}s)` + (USE_DEV_PROXY ? ' [代理]' : '') };
    } else {
      const text = await response.text();
      return { success: false, message: `上传失败: HTTP ${response.status} - ${text.substring(0, 200)}` };
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, message: '上传超时，文件可能太大。建议：1) 检查网络 2) 减少附件数量' };
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { 
        success: false, 
        message: USE_DEV_PROXY 
          ? '代理请求失败，请检查开发服务器。'
          : '网络请求失败，可能是 CORS 配置问题。'
      };
    }
    return { success: false, message: String(error) };
  }
}

/**
 * 从 S3 下载文件
 * 支持大文件下载
 */
export async function downloadFromS3(
  config: S3Config,
  remotePath: string
): Promise<{ success: boolean; data?: ArrayBuffer; message?: string }> {
  try {
    const { endpoint, bucket } = config;
    const { host, protocol } = parseEndpoint(endpoint);
    
    const url = new URL(`${protocol}//${host}/${bucket}/${remotePath}`);
    
    console.log(`[S3] 开始下载: ${remotePath}`);
    
    // 设置下载超时（5 分钟）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);
    
    const headers: Record<string, string> = {
      'Host': host,
    };
    
    const signedHeaders = await signRequest('GET', url, headers, '', config);
    
    // 使用代理 URL（开发环境）
    const fetchUrl = getProxyUrl(url.toString());
    
    const startTime = Date.now();
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: signedHeaders,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (response.status === 200) {
      const data = await response.arrayBuffer();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      const sizeMB = (data.byteLength / 1024 / 1024).toFixed(2);
      console.log(`[S3] 下载完成: ${sizeMB} MB, 耗时: ${duration}s`);
      return { success: true, data };
    } else if (response.status === 404) {
      return { success: false, message: '文件不存在' };
    } else {
      return { success: false, message: `HTTP ${response.status}` };
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, message: '下载超时，文件可能太大或网络较慢' };
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { 
        success: false, 
        message: USE_DEV_PROXY 
          ? '代理请求失败，请检查开发服务器。'
          : '网络请求失败，可能是 CORS 配置问题。'
      };
    }
    return { success: false, message: String(error) };
  }
}

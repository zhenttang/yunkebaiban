import { join } from 'node:path';

import { app, net, protocol, session } from 'electron';
import cookieParser from 'set-cookie-parser';

import { resourcesPath } from '../shared/utils';
import { anotherHost, mainHost } from './constants';
import { logger } from './logger';

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'assets',
    privileges: {
      secure: false,
      corsEnabled: true,
      supportFetchAPI: true,
      standard: true,
      bypassCSP: true,
    },
  },
]);

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'file',
    privileges: {
      secure: false,
      corsEnabled: true,
      supportFetchAPI: true,
      standard: true,
      bypassCSP: true,
      stream: true,
    },
  },
]);

const webStaticDir = join(resourcesPath, 'web-static');

async function handleFileRequest(request: Request) {
  const urlObject = new URL(request.url);

  logger.info(`[Protocol] Handling request: ${request.url}`);
  logger.info(`[Protocol] URL pathname: ${urlObject.pathname}`);
  logger.info(`[Protocol] DEV_SERVER_URL: ${process.env.DEV_SERVER_URL}`);

  if (urlObject.host === anotherHost) {
    urlObject.host = mainHost;
  }

  const isAbsolutePath = urlObject.host !== '.';
  logger.info(`[Protocol] isAbsolutePath: ${isAbsolutePath}`);

  // Redirect to webpack dev server if defined
  if (process.env.DEV_SERVER_URL && !isAbsolutePath) {
    // 检查是否是API请求，如果是则转发到Java后端
    if (urlObject.pathname.startsWith('/api') || 
        urlObject.pathname.startsWith('/socket.io')) {
      const backendUrl = new URL(
        urlObject.pathname + urlObject.search,
        'http://localhost:8080'
      );
      logger.info(`[Protocol] Forwarding API request to backend: ${backendUrl.toString()}`);
      try {
        const response = await net.fetch(backendUrl.toString(), request);
        logger.info(`[Protocol] Backend response status: ${response.status}`);
        return response;
      } catch (error) {
        logger.error(`[Protocol] Backend request failed:`, error);
        throw error;
      }
    }
    
    const devServerUrl = new URL(
      urlObject.pathname,
      process.env.DEV_SERVER_URL
    );
    logger.info(`[Protocol] Forwarding to dev server: ${devServerUrl.toString()}`);
    try {
      const response = await net.fetch(devServerUrl.toString(), request);
      logger.info(`[Protocol] Dev server response status: ${response.status}`);
      return response;
    } catch (error) {
      logger.error(`[Protocol] Dev server request failed:`, error);
      throw error;
    }
  }
  const clonedRequest = Object.assign(request.clone(), {
    bypassCustomProtocolHandlers: true,
  });
  // this will be file types (in the web-static folder)
  let filepath = '';

  // for relative path, load the file in resources
  if (!isAbsolutePath) {
    if (urlObject.pathname.split('/').at(-1)?.includes('.')) {
      // Sanitize pathname to prevent path traversal attacks
      const decodedPath = decodeURIComponent(urlObject.pathname);
      const normalizedPath = join(webStaticDir, decodedPath).normalize();
      if (!normalizedPath.startsWith(webStaticDir)) {
        // Attempted path traversal - reject by using empty path
        filepath = join(webStaticDir, '');
      } else {
        filepath = normalizedPath;
      }
    } else {
      // else, fallback to load the index.html instead
      filepath = join(webStaticDir, 'index.html');
    }
  } else {
    filepath = decodeURIComponent(urlObject.pathname);
    // security check if the filepath is within app.getPath('sessionData')
    const sessionDataPath = app.getPath('sessionData');
    const tempPath = app.getPath('temp');
    if (
      !filepath.startsWith(sessionDataPath) &&
      !filepath.startsWith(tempPath)
    ) {
      throw new Error('无效文件路径');
    }
  }
  return net.fetch('file://' + filepath, clonedRequest);
}

export function registerProtocol() {
  protocol.handle('file', request => {
    return handleFileRequest(request);
  });

  protocol.handle('assets', request => {
    return handleFileRequest(request);
  });

  session.defaultSession.webRequest.onHeadersReceived(
    (responseDetails, callback) => {
      const { responseHeaders } = responseDetails;
      
      logger.info(`[WebRequest] Headers received for: ${responseDetails.url}`);
      logger.info(`[WebRequest] Response status: ${responseDetails.statusCode}`);
      
      // 记录响应头
      if (responseHeaders) {
        logger.info(`[WebRequest] Response headers:`, JSON.stringify(responseHeaders, null, 2));
      }
      
      (async () => {
        if (responseHeaders) {
          const originalCookie =
            responseHeaders['set-cookie'] || responseHeaders['Set-Cookie'];

          if (originalCookie) {
            logger.info(`[WebRequest] Processing cookies from response`);
            // save the cookies, to support third party cookies
            for (const cookies of originalCookie) {
              const parsedCookies = cookieParser.parse(cookies);
              for (const parsedCookie of parsedCookies) {
                if (!parsedCookie.value) {
                  await session.defaultSession.cookies.remove(
                    responseDetails.url,
                    parsedCookie.name
                  );
                } else {
                  await session.defaultSession.cookies.set({
                    url: responseDetails.url,
                    domain: parsedCookie.domain,
                    expirationDate: parsedCookie.expires?.getTime(),
                    httpOnly: parsedCookie.httpOnly,
                    secure: parsedCookie.secure,
                    value: parsedCookie.value,
                    name: parsedCookie.name,
                    path: parsedCookie.path,
                    sameSite: parsedCookie.sameSite?.toLowerCase() as
                      | 'unspecified'
                      | 'no_restriction'
                      | 'lax'
                      | 'strict'
                      | undefined,
                  });
                }
              }
            }
          }

          // 处理来自后端的响应CORS头
          // 允许列表：8080 (主后端), 9092 (Socket.IO)
          const isBackendRequest = responseDetails.url.includes('localhost:8080') || 
                                   responseDetails.url.includes('localhost:9092');
          
          if (isBackendRequest) {
            // 检查后端是否已经设置了CORS头
            const hasOriginHeader = responseHeaders['access-control-allow-origin'] || 
                                  responseHeaders['Access-Control-Allow-Origin'];
            
            if (!hasOriginHeader) {
              // 只有在后端没有设置CORS头时才添加
              responseHeaders['access-control-allow-origin'] = ['http://localhost:8081'];
              responseHeaders['access-control-allow-credentials'] = ['true'];
              responseHeaders['access-control-allow-methods'] = ['GET, POST, PUT, DELETE, OPTIONS'];
              responseHeaders['access-control-allow-headers'] = ['Content-Type, Authorization, X-Requested-With'];
              logger.info(`[WebRequest] Added CORS headers for backend response`);
            } else {
              logger.info(`[WebRequest] Backend already has CORS headers, skipping`);
            }
          } else {
            // 非后端请求，移除CORS头（安全考虑）
            delete responseHeaders['access-control-allow-origin'];
            delete responseHeaders['access-control-allow-headers'];
            delete responseHeaders['Access-Control-Allow-Origin'];
            delete responseHeaders['Access-Control-Allow-Headers'];
            logger.info(`[WebRequest] Removed CORS headers for non-backend request`);
          }
        }
      })()
        .catch(err => {
          logger.error('error handling headers received', err);
        })
        .finally(() => {
          callback({ responseHeaders });
        });
    }
  );

  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = new URL(details.url);
    
    logger.info(`[WebRequest] Before request: ${details.url}`);
    logger.info(`[WebRequest] Method: ${details.method}`);
    logger.info(`[WebRequest] Protocol: ${url.protocol}`);
    logger.info(`[WebRequest] Hostname: ${url.hostname}`);
    logger.info(`[WebRequest] Port: ${url.port}`);
    
    // 在开发环境下，只对来自8081端口的API请求重定向到Java后端
    // 避免重定向循环
    if (process.env.DEV_SERVER_URL && 
        url.hostname === 'localhost' && 
        url.port === '8081' &&
        (url.pathname.startsWith('/api') || 
         url.pathname.startsWith('/socket.io'))) {
      
      const backendUrl = `http://localhost:8080${url.pathname}${url.search}`;
      logger.info(`[WebRequest] Redirecting API request from 8081 to 8080: ${backendUrl}`);
      
      callback({
        cancel: false,
        redirectURL: backendUrl
      });
      return;
    }
    
    callback({ cancel: false });
  });

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const url = new URL(details.url);
    
    logger.info(`[WebRequest] Before send headers for: ${details.url}`);
    logger.info(`[WebRequest] Request method: ${details.method}`);

    (async () => {
      // session cookies are set to file:// on production
      // if sending request to the cloud, attach the session cookie (to yunke cloud server)
      if (
        url.protocol === 'http:' ||
        url.protocol === 'https:' ||
        url.protocol === 'ws:' ||
        url.protocol === 'wss:'
      ) {
        logger.info(`[WebRequest] Handling HTTP/WebSocket request to: ${url.hostname}:${url.port}`);
        const cookies = await session.defaultSession.cookies.get({
          url: details.url,
        });

        const cookieString = cookies
          .map(c => `${c.name}=${c.value}`)
          .join('; ');
        delete details.requestHeaders['cookie'];
        details.requestHeaders['Cookie'] = cookieString;
        logger.info(`[WebRequest] Added cookies: ${cookieString}`);
      }
    })()
      .catch(err => {
        logger.error('error handling before send headers', err);
      })
      .finally(() => {
        callback({
          cancel: false,
          requestHeaders: details.requestHeaders,
        });
      });
  });
}

# 🎉 部署配置完成总结

## ✅ 已完成的修改

### 1. 代码修改（支持环境变量留空）

已修改以下 3 个文件，支持环境变量为空时自动检测：

#### 📄 `packages/frontend/core/src/modules/cloud/constant.ts`
```typescript
// 修改前：
if (envApiUrl) {
  return envApiUrl;
}

// 修改后：
if (envApiUrl && envApiUrl.trim() !== '') {
  console.log('🔧 [API BaseURL] 使用环境变量:', envApiUrl);
  return envApiUrl;
}
```

#### 📄 `packages/common/request/src/config.ts`
```typescript
// 修改前：
if (envApiUrl) {
  return envApiUrl;
}

// 修改后：
if (envApiUrl && envApiUrl.trim() !== '') {
  console.log('🔧 [API BaseURL] 使用环境变量:', envApiUrl);
  return envApiUrl;
}
```

#### 📄 `packages/frontend/apps/web/src/cloud-storage-manager.tsx`
```typescript
// 修改前：
if (envSocketUrl) {
  return envSocketUrl;
}

// 修改后：
if (envSocketUrl && envSocketUrl.trim() !== '') {
  console.log('🔧 [Socket.IO URL] 使用环境变量:', envSocketUrl);
  return envSocketUrl;
}

// 生产环境从 9092 端口改为使用当前域名：
if (window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1') {
  const socketUrl = window.location.origin;
  console.log('🔧 [Socket.IO URL] 生产环境自动检测:', socketUrl);
  return socketUrl;
}
```

---

## 📋 配置文件说明

### 方案1：留空（✅ 推荐）

修改你的 `.env` 文件为：

```bash
# 开发环境
VITE_DRAWIO_URL=http://localhost:8001
VITE_API_BASE_URL=http://localhost:8080
VITE_SOCKETIO_URL=http://localhost:9092
```

创建 `.env.production` 文件（或修改现有的）：

```bash
# 生产环境 - 留空表示自动检测
VITE_API_BASE_URL=
VITE_SOCKETIO_URL=
```

### 方案2：明确指定域名

```bash
# 生产环境 - 明确指定域名（不带端口）
VITE_API_BASE_URL=https://your-domain.com
VITE_SOCKETIO_URL=https://your-domain.com
```

---

## 🌐 Nginx 配置（必须）

配置文件已生成：`nginx.conf.example`

**关键配置**：

```nginx
# 后端 API（转发到 8080）
location /api/ {
    proxy_pass http://127.0.0.1:8080;
}

# Socket.IO（转发到 9092）
location /socket.io/ {
    proxy_pass http://127.0.0.1:9092;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

---

## 🚀 部署流程

### 1. 本地打包

```bash
cd /mnt/d/Documents/yunkebaiban/baibanfront
yarn build
```

### 2. 上传到服务器

```bash
scp -r packages/frontend/apps/web/dist/* user@server:/var/www/frontend/dist/
```

### 3. 配置 Nginx

```bash
# 复制配置文件
sudo cp nginx.conf.example /etc/nginx/sites-available/your-domain

# 编辑配置（修改域名、路径等）
sudo nano /etc/nginx/sites-available/your-domain

# 创建软链接
sudo ln -s /etc/nginx/sites-available/your-domain /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 4. 启动后端服务

确保以下服务运行：
- Java API：`127.0.0.1:8080`
- Socket.IO：`127.0.0.1:9092`

---

## 🎯 工作原理

### 开发环境

```
浏览器 → http://localhost:8081
  ↓
前端代码读取 .env.development
  ↓
API: http://localhost:8080
Socket.IO: http://localhost:9092
```

### 生产环境

```
浏览器 → https://your-domain.com
  ↓
前端检测到非 localhost
  ↓
环境变量为空 → 自动使用 window.location.origin
  ↓
API: https://your-domain.com/api/*
Socket.IO: https://your-domain.com/socket.io/*
  ↓
Nginx 反向代理
  ├─ /api/* → http://127.0.0.1:8080
  └─ /socket.io/* → http://127.0.0.1:9092
```

---

## 🔍 验证部署

### 1. 访问网站
打开：`https://your-domain.com`

### 2. 查看控制台（F12）
应该看到：
```
🔧 [API BaseURL] 生产环境自动检测: https://your-domain.com
🔧 [Socket.IO URL] 生产环境自动检测: https://your-domain.com
```

### 3. 检查网络请求
- API 请求：`https://your-domain.com/api/...`
- Socket.IO：`https://your-domain.com/socket.io/...`

---

## 🎁 优势总结

使用这个方案后：

✅ **安全性**
- 只开放 80/443 端口
- 内部端口（8080/9092）不对外暴露
- 统一 SSL 证书管理

✅ **易用性**
- 用户只访问一个域名
- 不需要记住端口号
- 避免 CORS 跨域问题

✅ **灵活性**
- 环境变量留空 = 自动检测
- 也可以明确指定域名
- 支持多环境配置

✅ **可维护性**
- 前端代码无需修改
- 所有配置在环境变量中
- Nginx 统一管理转发规则

---

## 📚 参考文档

- 详细配置指南：`ENV_CONFIG_GUIDE.md`
- 快速部署指南：`PRODUCTION_DEPLOY.md`
- Nginx 配置模板：`nginx.conf.example`

---

## 🐛 常见问题

### Q: API 请求 404？
**A**: 检查 Nginx `/api/` 配置，确认后端服务运行在 8080

### Q: Socket.IO 连接超时？
**A**: 检查 Nginx WebSocket 配置（`Upgrade` 和 `Connection` 头）

### Q: 前端显示错误的 URL？
**A**: 打开浏览器控制台，查看 `🔧` 开头的日志，确认检测逻辑

### Q: 开发环境连接生产服务器？
**A**: 检查是否使用了 `.env.development`，确认 `VITE_API_BASE_URL`

---

## 🎊 完成！

现在你可以：

1. ✅ 开发环境：使用 `localhost:8080` 和 `localhost:9092`
2. ✅ 生产环境：自动检测域名，通过 Nginx 转发
3. ✅ 零配置部署：环境变量留空即可

祝部署顺利！🚀


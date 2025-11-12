# 🚀 生产环境部署配置

## 📝 快速配置

### 步骤1：修改你的 `.env` 文件

找到 `/mnt/d/Documents/yunkebaiban/baibanfront/.env` 文件，修改为：

```bash
# Draw.io 本地开发配置
VITE_DRAWIO_URL=http://localhost:8001

# 后端API基础URL配置 - 留空表示自动检测
VITE_API_BASE_URL=

# Socket.IO服务器URL配置 - 留空表示自动检测
VITE_SOCKETIO_URL=

# 生产环境配置（注释掉，因为上面留空会自动检测）
# VITE_API_BASE_URL=http://ykadmin.yckeji0316.cn:8080
# VITE_SOCKETIO_URL=https://b.yckeji0316.cn:9092
```

**或者明确指定域名（不带端口）：**

```bash
VITE_API_BASE_URL=https://your-domain.com
VITE_SOCKETIO_URL=https://your-domain.com
```

---

## 🔧 代码修改完成

已修改以下文件，支持环境变量留空时自动检测：

1. ✅ `packages/frontend/core/src/modules/cloud/constant.ts`
2. ✅ `packages/common/request/src/config.ts`
3. ✅ `packages/frontend/apps/web/src/cloud-storage-manager.tsx`

**修改内容**：
- 环境变量为空或空字符串时，使用自动检测逻辑
- 生产环境自动使用 `window.location.origin`
- 添加了详细的 console.log 便于调试

---

## 🌐 Nginx 配置（重要！）

在你的服务器上配置 Nginx（假设域名是 `your-domain.com`）：

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL证书
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 前端静态文件
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API（转发到8080）
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO（转发到9092）
    location /socket.io/ {
        proxy_pass http://127.0.0.1:9092;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📦 打包部署

### 1. 本地打包

```bash
cd /mnt/d/Documents/yunkebaiban/baibanfront
yarn build
```

### 2. 上传到服务器

```bash
# 打包后的文件在 packages/frontend/apps/web/dist/
scp -r packages/frontend/apps/web/dist/* user@your-server:/var/www/frontend/dist/
```

### 3. 启动后端服务

确保后端服务运行在：
- Java API：`127.0.0.1:8080`
- Socket.IO：`127.0.0.1:9092`

### 4. 重启 Nginx

```bash
sudo systemctl restart nginx
```

---

## ✅ 验证部署

### 1. 访问网站

打开浏览器访问：`https://your-domain.com`

### 2. 查看控制台日志

按 F12 打开浏览器控制台，应该看到：

```
🔧 [API BaseURL] 生产环境自动检测: https://your-domain.com
🔧 [Socket.IO URL] 生产环境自动检测: https://your-domain.com
```

### 3. 测试功能

- [ ] API 请求是否正常
- [ ] Socket.IO 实时协作是否连接成功
- [ ] 网络面板查看请求路径是否正确

---

## 🎯 工作原理

### 开发环境（localhost）

```
浏览器访问: http://localhost:8081
  ↓
API请求: http://localhost:8080/api/*
Socket.IO: http://localhost:9092/socket.io/*
```

### 生产环境（自动检测）

```
浏览器访问: https://your-domain.com
  ↓
前端检测到非localhost，自动使用 window.location.origin
  ↓
API请求: https://your-domain.com/api/*
Socket.IO: https://your-domain.com/socket.io/*
  ↓
Nginx反向代理
  ├─ /api/* → http://127.0.0.1:8080
  └─ /socket.io/* → http://127.0.0.1:9092
```

---

## 🔐 安全优势

使用这种方案后：

✅ 用户只访问一个域名（https://your-domain.com）
✅ 只开放 80/443 端口
✅ 内部端口 8080 和 9092 不对外暴露
✅ 统一 SSL 证书管理
✅ 避免 CORS 跨域问题

---

## 📞 遇到问题？

1. **API 请求失败**：检查 Nginx `/api/` 配置和后端 8080 端口
2. **Socket.IO 连接超时**：检查 Nginx WebSocket 配置和 9092 端口
3. **查看日志**：
   - 浏览器控制台
   - Nginx: `sudo tail -f /var/log/nginx/error.log`
   - 后端服务日志

详细文档请查看：`ENV_CONFIG_GUIDE.md`


# 环境配置指南

## 📝 配置说明

前端代码已修改为支持环境变量留空，当环境变量为空时会自动检测当前环境并使用合适的配置。

---

## 🔧 开发环境配置

创建或修改 `.env.development` 文件：

```bash
# ====================================
# 🔧 开发环境配置
# ====================================

# Draw.io 本地开发配置
VITE_DRAWIO_URL=http://localhost:8001

# 后端API基础URL配置
VITE_API_BASE_URL=http://localhost:8080

# Socket.IO服务器URL配置
VITE_SOCKETIO_URL=http://localhost:9092
```

---

## 🚀 生产环境配置

### 方案1：留空（✅ 推荐）

创建或修改 `.env.production` 文件：

```bash
# ====================================
# 🚀 生产环境配置 - 自动检测方案
# ====================================

# 留空表示自动检测（推荐）
VITE_API_BASE_URL=
VITE_SOCKETIO_URL=
```

**说明**：
- 留空时，前端会自动使用 `window.location.origin`
- API请求：`https://your-domain.com/api/*`
- Socket.IO：`https://your-domain.com/socket.io/*`
- **必须配合 Nginx 反向代理使用**

---

### 方案2：明确指定域名

```bash
# ====================================
# 🚀 生产环境配置 - 明确指定域名
# ====================================

# 明确指定域名（不带端口号）
VITE_API_BASE_URL=https://your-domain.com
VITE_SOCKETIO_URL=https://your-domain.com
```

**说明**：
- 适用于：想明确控制域名
- 依然需要 Nginx 转发
- 与方案1效果相同，但更明确

---

### 方案3：不同端口（❌ 不推荐）

```bash
# 仅在无法使用 Nginx 时使用
VITE_API_BASE_URL=https://your-domain.com:8080
VITE_SOCKETIO_URL=https://your-domain.com:9092
```

**缺点**：
- 需要开放多个端口
- 需要配置 CORS
- 需要为每个端口配置 SSL
- 用户体验差（URL带端口号）

---

## 🌐 Nginx 配置示例

使用方案1或方案2时，需要配置 Nginx 反向代理：

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL证书配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 前端静态文件
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # 缓存策略
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端API代理（转发到8080端口）
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Socket.IO代理（转发到9092端口）
    location /socket.io/ {
        proxy_pass http://127.0.0.1:9092;
        proxy_http_version 1.1;
        
        # WebSocket支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket长连接超时
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
```

---

## 📦 打包部署流程

### 1. 开发环境运行

```bash
# 使用 .env.development 配置
yarn dev
```

### 2. 生产环境打包

```bash
# 使用 .env.production 配置
yarn build
```

打包后的文件在 `packages/frontend/apps/web/dist/` 目录。

### 3. 部署到服务器

```bash
# 上传 dist 目录到服务器
scp -r packages/frontend/apps/web/dist/* user@server:/var/www/frontend/dist/

# 配置 Nginx
sudo nano /etc/nginx/sites-available/your-domain.com

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 🔍 验证配置

### 开发环境验证

打开浏览器控制台，查看日志：

```
🔧 [API BaseURL] 开发环境默认: http://localhost:8080
🔧 [Socket.IO URL] 开发环境默认: http://localhost:9092
```

### 生产环境验证

打开浏览器控制台，查看日志：

```
🔧 [API BaseURL] 生产环境自动检测: https://your-domain.com
🔧 [Socket.IO URL] 生产环境自动检测: https://your-domain.com
```

或者（如果配置了环境变量）：

```
🔧 [API BaseURL] 使用环境变量: https://your-domain.com
🔧 [Socket.IO URL] 使用环境变量: https://your-domain.com
```

---

## 🎯 推荐配置方案

### ✅ 最佳实践

1. **开发环境**：使用 `.env.development` 明确指定 localhost 端口
2. **生产环境**：使用 `.env.production` 留空，让代码自动检测
3. **服务器**：使用 Nginx 反向代理，统一管理所有服务

### 架构图

```
用户浏览器
    ↓
https://your-domain.com (443端口)
    ↓
Nginx 反向代理
    ├─ /api/*         → Java后端 (127.0.0.1:8080)
    ├─ /socket.io/*   → Socket.IO (127.0.0.1:9092)
    └─ /*             → 前端静态文件 (/var/www/frontend/dist)
```

**优势**：
- ✅ 用户只访问一个域名
- ✅ 只开放 80/443 端口
- ✅ 内部服务（8080/9092）不对外暴露
- ✅ 统一 SSL 证书管理
- ✅ 可添加负载均衡、限流等功能

---

## 🐛 常见问题

### Q1: 生产环境连接失败？

检查：
1. Nginx 配置是否正确
2. 后端服务是否运行在 8080 和 9092 端口
3. 防火墙是否允许 Nginx 访问内部端口
4. 浏览器控制台查看实际请求的 URL

### Q2: Socket.IO 连接超时？

检查：
1. Nginx 是否配置了 WebSocket 支持（`proxy_set_header Upgrade`）
2. 后端 Socket.IO 服务是否正常运行
3. 查看 Nginx 错误日志：`sudo tail -f /var/log/nginx/error.log`

### Q3: CORS 错误？

如果使用了方案1或方案2（推荐），不应该有 CORS 问题。如果出现：
1. 检查 Nginx 配置是否正确
2. 检查前端请求的域名是否与浏览器地址栏一致

---

## 📞 技术支持

如有问题，请检查：
1. 浏览器控制台日志
2. Nginx 错误日志：`/var/log/nginx/error.log`
3. 后端服务日志


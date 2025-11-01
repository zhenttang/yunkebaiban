@echo off
chcp 65001 >nul
echo.
echo ============================================
echo 🔍 验证 CloudStorageProvider 配置
echo ============================================
echo.

set "error_found=0"

echo 检查 Electron Renderer 入口点...
echo.

echo [1/4] 检查 workspace/index.tsx（关键）...
findstr /C:"CloudStorageProvider" "packages\frontend\core\src\desktop\pages\workspace\index.tsx" >nul
if errorlevel 1 (
    echo ❌ workspace/index.tsx 缺少 CloudStorageProvider
    set "error_found=1"
) else (
    echo ✅ workspace/index.tsx 正常
)

echo [2/4] 检查 app/app.tsx...
findstr /C:"CloudStorageProvider" "packages\frontend\apps\electron-renderer\src\app\app.tsx" >nul
if errorlevel 1 (
    echo ❌ app/app.tsx 缺少 CloudStorageProvider
    set "error_found=1"
) else (
    echo ✅ app/app.tsx 正常
)

echo [3/4] 检查 shell/app.tsx...
findstr /C:"CloudStorageProvider" "packages\frontend\apps\electron-renderer\src\shell\app.tsx" >nul
if errorlevel 1 (
    echo ❌ shell/app.tsx 缺少 CloudStorageProvider
    set "error_found=1"
) else (
    echo ✅ shell/app.tsx 正常
)

echo [4/4] 检查 popup/app.tsx...
findstr /C:"CloudStorageProvider" "packages\frontend\apps\electron-renderer\src\popup\app.tsx" >nul
if errorlevel 1 (
    echo ❌ popup/app.tsx 缺少 CloudStorageProvider
    set "error_found=1"
) else (
    echo ✅ popup/app.tsx 正常
)

echo.
echo ============================================

if "%error_found%"=="0" (
    echo ✅ 所有入口点配置正确！
    echo.
    echo 💡 可以运行构建：
    echo    quick-rebuild.bat
) else (
    echo ❌ 发现配置错误！
    echo.
    echo 请检查上面标记为 ❌ 的文件，确保：
    echo 1. 导入了 CloudStorageProvider
    echo 2. 在组件树中正确包裹
    echo.
    echo 参考文档：CLOUD_STORAGE_PROVIDER_FIX.md
)

echo ============================================
echo.
pause


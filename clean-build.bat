@echo off
chcp 65001 >nul
echo.
echo ============================================
echo 🧹 清理所有构建产物
echo ============================================
echo.

echo 正在清理 electron-renderer/dist...
rmdir /s /q packages\frontend\apps\electron-renderer\dist 2>nul
if exist packages\frontend\apps\electron-renderer\dist (
    echo ✗ 清理失败
) else (
    echo ✓ 已清理 electron-renderer/dist
)

echo 正在清理 electron-renderer/lib...
rmdir /s /q packages\frontend\apps\electron-renderer\lib 2>nul
if exist packages\frontend\apps\electron-renderer\lib (
    echo ✗ 清理失败
) else (
    echo ✓ 已清理 electron-renderer/lib
)

echo 正在清理 electron/dist...
rmdir /s /q packages\frontend\apps\electron\dist 2>nul
if exist packages\frontend\apps\electron\dist (
    echo ✗ 清理失败
) else (
    echo ✓ 已清理 electron/dist
)

echo 正在清理 electron/out...
rmdir /s /q packages\frontend\apps\electron\out 2>nul
if exist packages\frontend\apps\electron\out (
    echo ✗ 清理失败
) else (
    echo ✓ 已清理 electron/out
)

echo 正在清理 core/lib...
rmdir /s /q packages\frontend\core\lib 2>nul
if exist packages\frontend\core\lib (
    echo ✗ 清理失败
) else (
    echo ✓ 已清理 core/lib
)

echo 正在清理 core/dist...
rmdir /s /q packages\frontend\core\dist 2>nul
if exist packages\frontend\core\dist (
    echo ✗ 清理失败
) else (
    echo ✓ 已清理 core/dist
)

echo.
echo ============================================
echo ✅ 清理完成！
echo ============================================
echo.
echo 💡 下一步：运行 rebuild-desktop.bat 重新构建
echo.
pause


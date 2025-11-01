@echo off
chcp 65001 >nul
echo.
echo ============================================
echo 🔧 桌面应用重新构建脚本
echo ============================================
echo.
echo 🧹 清理构建产物...
echo ============================================

rmdir /s /q packages\frontend\apps\electron-renderer\dist 2>nul
rmdir /s /q packages\frontend\apps\electron\dist 2>nul
rmdir /s /q packages\frontend\apps\electron\out 2>nul

echo ✓ 清理完成
echo.
echo 🎨 生成应用资源...
echo ============================================

call yarn workspace @yunke/electron generate-assets
if errorlevel 1 (
    echo.
    echo [ERROR] 资源生成失败！
    echo 请检查错误信息
    pause
    exit /b 1
)

echo.
echo ✓ 资源生成完成
echo.
echo 📦 打包 Electron 应用...
echo ============================================

call yarn workspace @yunke/electron package
if errorlevel 1 (
    echo.
    echo [ERROR] 打包失败！
    echo 请检查错误信息
    pause
    exit /b 1
)

echo.
echo ============================================
echo ✅ 构建完成！
echo ============================================
echo.
echo 📂 打包文件位置：
echo   packages\frontend\apps\electron\out\canary\
echo.
echo 🚀 运行应用：
echo   方法1：cd packages\frontend\apps\electron ^&^& yarn dev
echo   方法2：.\packages\frontend\apps\electron\out\canary\YUNKE-canary-win32-x64\YUNKE.exe
echo.
pause

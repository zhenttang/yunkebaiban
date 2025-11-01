@echo off
chcp 65001 >nul
cls
echo.
echo 🚀 快速重建 - 仅2个命令
echo ============================================
echo.

echo [1/2] 生成资源...
call yarn workspace @yunke/electron generate-assets

echo.
echo [2/2] 打包应用...
call yarn workspace @yunke/electron package

echo.
echo ============================================
echo ✅ 完成！运行: .\packages\frontend\apps\electron\out\canary\YUNKE-canary-win32-x64\YUNKE.exe
echo ============================================
pause


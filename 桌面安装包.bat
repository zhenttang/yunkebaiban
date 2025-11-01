@echo off
chcp 65001 >nul
echo.
echo ============================================
echo 桌面应用安装包制作脚本
echo ============================================
echo.
echo 说明：此脚本会生成带安装向导的 .exe 安装程序
echo    用户下载后可以一步步点击"下一步"安装
echo.
echo ============================================
echo 清理旧的构建产物...
echo ============================================

rmdir /s /q packages\frontend\apps\electron\dist 2>nul
rmdir /s /q packages\frontend\apps\electron\out 2>nul

echo 清理完成
echo.
echo ============================================
echo 步骤 1/4: 生成应用资源（图标等）
echo ============================================

call yarn workspace @yunke/electron generate-assets
if errorlevel 1 (
    echo.
    echo [错误] 资源生成失败！
    echo 请检查上方错误信息
    pause
    exit /b 1
)

echo 资源生成完成
echo.
echo ============================================
echo 步骤 2/4: 构建应用
echo ============================================

call yarn workspace @yunke/electron build
if errorlevel 1 (
    echo.
    echo [错误] 应用构建失败！
    echo 请检查上方错误信息
    pause
    exit /b 1
)

echo 应用构建完成
echo.
echo ============================================
echo 步骤 3/4: 打包应用
echo ============================================

call yarn workspace @yunke/electron package
if errorlevel 1 (
    echo.
    echo [错误] 应用打包失败！
    echo 请检查上方错误信息
    pause
    exit /b 1
)

echo 应用打包完成
echo.
echo ============================================
echo 步骤 4/4: 制作安装包（Squirrel）
echo ============================================
echo 正在生成 Windows 安装程序...
echo 已禁用代码签名（适用于开发/测试环境）
echo.

REM 禁用代码签名（开发/测试环境）
set CSC_IDENTITY_AUTO_DISCOVERY=false

call yarn workspace @yunke/electron make
if errorlevel 1 (
    echo.
    echo [错误] 安装包制作失败！
    echo 请检查上方错误信息
    pause
    exit /b 1
)

echo.
echo ============================================
echo 安装包制作成功！
echo ============================================
echo.
echo 安装包位置：
echo   packages\frontend\apps\electron\out\make\squirrel.windows\x64\
echo.
echo 生成的文件：
echo   - YUNKE-canary Setup.exe
echo   - YUNKE-canary-xxx.nupkg
echo   - RELEASES
echo.
echo 使用方法：
echo   1. 找到 "YUNKE-canary Setup.exe"
echo   2. 双击运行安装程序
echo   3. 自动安装完成
echo.
echo 提示：
echo   - 自动创建桌面快捷方式
echo   - 自动添加到开始菜单
echo   - 支持自动更新功能
echo.
pause

@echo off
chcp 65001 >nul
echo.
echo ============================================
echo 桌面应用安装包制作脚本（NSIS 版）
echo ============================================
echo.
echo 说明：此脚本生成传统的 Windows NSIS 安装程序
echo    - 更详细的安装向导界面
echo    - 可以选择安装位置
echo    - 可以选择是否创建快捷方式
echo    - 可以选择是否开机启动
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
    pause
    exit /b 1
)

echo 应用打包完成
echo.
echo ============================================
echo 步骤 4/4: 制作安装包（NSIS）
echo ============================================
echo 正在生成 NSIS 安装程序（传统 Windows 安装向导）...
echo 已禁用代码签名（适用于开发/测试环境）
echo.

REM 禁用代码签名（开发/测试环境）
set CSC_IDENTITY_AUTO_DISCOVERY=false

call yarn workspace @yunke/electron make-nsis
if errorlevel 1 (
    echo.
    echo [错误] NSIS 安装包制作失败！
    echo 常见问题：
    echo    - 缺少 LICENSE 文件
    echo    - 缺少图标文件
    echo    - Electron 版本配置错误
    pause
    exit /b 1
)

echo.
echo ============================================
echo NSIS 安装包制作成功！
echo ============================================
echo.
echo 安装包位置：
echo   packages\frontend\apps\electron\out\canary\make\nsis.windows\x64\
echo.
echo 生成的文件：
echo   - YUNKE-canary-xxx-Setup.exe
echo.
echo 安装程序特点：
echo   - 传统的 Windows 安装向导界面
echo   - 可以自定义安装位置
echo   - 可以选择安装组件
echo   - 可以选择快捷方式位置
echo   - 自动添加卸载程序
echo   - 显示安装进度
echo.
echo 用户安装步骤：
echo   1. 双击 Setup.exe
echo   2. 按照向导完成安装
echo.
pause

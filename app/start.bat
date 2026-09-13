@echo off
chcp 65001 >nul
title ChatScience Desktop
cd /d %~dp0

set NODE_EXE=C:\Users\%USERNAME%\.trae-cn\binaries\node\versions\v24.14.0\node.exe
if not exist "%NODE_EXE%" set NODE_EXE=node

if not exist node_modules\electron\dist\electron.exe (
  echo [ChatScience] 首次运行：安装依赖（Electron 约 100MB，请耐心等待）...
  call "C:\Users\%USERNAME%\.trae-cn\binaries\node\versions\v24.14.0\npm.cmd" install --no-audit --no-fund
  if errorlevel 1 call npm install --no-audit --no-fund
)

echo [ChatScience] 编译 TypeScript (tsc)...
"%NODE_EXE%" node_modules\typescript\bin\tsc
if errorlevel 1 (
  echo [ChatScience] TypeScript 编译失败（类型错误会阻止产出），请检查上方报错。
  pause
  exit /b 1
)

echo [ChatScience] 编译前端 TypeScript (tsc -p tsconfig.webapp.json)...
"%NODE_EXE%" node_modules\typescript\bin\tsc -p tsconfig.webapp.json
if errorlevel 1 (
  echo [ChatScience] 前端编译失败，请检查上方报错。
  pause
  exit /b 1
)

echo [ChatScience] 构建渲染层...
"%NODE_EXE%" build.js

echo [ChatScience] 启动桌面应用...
start "" node_modules\electron\dist\electron.exe .

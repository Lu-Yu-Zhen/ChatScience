/* ==================================================================
   pack.ts · 便携试验版打包（纯本地，零下载）
   不用 electron-packager：它会重新下载 Electron zip（本网络不可达）。
   本机 node_modules/electron/dist 里已有完整运行时，直接复用：

   产物 dist/ChatScience-win32-x64/
     ChatScience.exe            ← electron.exe 改名（双击即用）
     *.dll / locales/ ...       ← Electron 运行时
     resources/app/             ← 编译后的应用代码（asar 关闭，明文可改）
     webapp/                    ← 前端源文件（主页面.html + work/）
     重新构建.bat / 使用说明.txt

   源码工程：TypeScript 源在 app/src/，打包前先 tsc 编译回原路径
   （main.js / preload.js / server/*.js / build.js 等），再复制进产物。
   修改流程：改 src/ 或 webapp/ → node pack.js（或重新构建.bat）→ 重启 exe。
   ================================================================== */
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync, spawn } from 'child_process';

const APP = __dirname;
const OUT = path.join(APP, 'dist');
const STAGE = path.join(OUT, 'ChatScience-win32-x64');
const APPDIR = path.join(STAGE, 'resources', 'app');

function log(m: string): void { console.log('[pack] ' + m); }
function rmrf(p: string): void { fs.rmSync(p, { recursive: true, force: true }); }

/* 递归拷贝（跳过排除项），带简单进度 */
function copyTree(src: string, dst: string, excludes?: RegExp[], rel?: string): void {
  excludes = excludes || [];
  rel = rel || '';
  const entries = fs.readdirSync(src, { withFileTypes: true });
  fs.mkdirSync(dst, { recursive: true });
  entries.forEach(function (e) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    const rp = rel ? rel + '/' + e.name : e.name;
    if (excludes!.some(function (re) { return re.test(rp); })) return;
    if (e.isDirectory()) copyTree(s, d, excludes, rp);
    else fs.copyFileSync(s, d);
  });
}

async function main(): Promise<void> {
  const t0 = Date.now();
  const electronDist = path.join(APP, 'node_modules', 'electron', 'dist');
  if (!fs.existsSync(path.join(electronDist, 'electron.exe'))) {
    console.error('[pack] 未找到本地 Electron 运行时: ' + electronDist + '（先 npm install）');
    process.exit(1);
  }

  /* 0. TypeScript 编译：核心（main/server/shared/build/pack）+ 前端（webapp 层）
        产物落回原路径（noEmitOnError，类型/语法不过不出产物） */
  log('编译 TypeScript (tsc: core + webapp) ...');
  const tscBin = path.join(APP, 'node_modules', 'typescript', 'bin', 'tsc');
  if (!fs.existsSync(tscBin)) {
    console.error('[pack] 未找到 typescript（先 npm install）');
    process.exit(1);
  }
  const t = spawnSync(process.execPath, [tscBin], { cwd: APP, stdio: 'inherit' });
  if (t.status !== 0) { console.error('[pack] tsc 编译失败'); process.exit(1); }
  const tw = spawnSync(process.execPath, [tscBin, '-p', 'tsconfig.webapp.json'], { cwd: APP, stdio: 'inherit' });
  if (tw.status !== 0) { console.error('[pack] webapp tsc 编译失败'); process.exit(1); }

  /* 1. renderer 预构建 */
  log('构建 renderer ...');
  const b = spawnSync(process.execPath, ['build.js'], { cwd: APP, stdio: 'inherit' });
  if (b.status !== 0) { console.error('[pack] build.js 失败'); process.exit(1); }

  /* 2. 复制产物。PACK_SKIP_HEAVY=1：跳过 Electron 运行时与 node_modules 的大体积复制
     （依赖未变时用），但应用源码/前端源文件/脚本说明 总是重新复制——保证修复进产物。
     用户的 resources/app/data（会话与 Work 配置）在全量重打包时保留。 */
  const skipHeavy = !!process.env.PACK_SKIP_HEAVY && fs.existsSync(path.join(STAGE, 'ChatScience.exe'));
  if (skipHeavy) {
    log('PACK_SKIP_HEAVY=1：复用 Electron 运行时与 node_modules');
  } else {
    log('清理旧产物 ...');
    /* 保留用户数据 */
    let keepData: string | null = null;
    const oldData = path.join(APPDIR, 'data');
    if (fs.existsSync(oldData)) {
      keepData = path.join(OUT, '.data-keep-' + Date.now());
      fs.renameSync(oldData, keepData);
    }
    rmrf(STAGE);
    fs.mkdirSync(path.dirname(APPDIR), { recursive: true });
    log('复制 Electron 运行时（约 250MB，大文件较快）...');
    copyTree(electronDist, STAGE);
    fs.renameSync(path.join(STAGE, 'electron.exe'), path.join(STAGE, 'ChatScience.exe'));
    rmrf(path.join(STAGE, 'resources', 'default_app.asar'));   /* 让运行时加载 resources/app */
    fs.mkdirSync(APPDIR, { recursive: true });
    if (keepData) { fs.renameSync(keepData, oldData); log('已保留用户数据 data/'); }
  }

  /* 2.5 exe 图标：rcedit 写入 PE 资源（exe 被占用时先结束实例） */
  const icoSrc = path.join(APP, 'icons', 'app.ico');
  if (fs.existsSync(icoSrc)) {
    log('写入 exe 图标（rcedit）...');
    spawnSync('taskkill', ['/IM', 'ChatScience.exe', '/T', '/F'], { stdio: 'ignore' });
    spawnSync(process.execPath, ['-e', 'setTimeout(function(){},1200)']);  /* 等待进程树退出与文件锁释放，避免 rcedit 部分写入静默失败 */
    const rcedit = require('rcedit') as (exe: string, opts: { icon: string; 'version-string'?: Record<string, string> }) => Promise<void>;
    /* version-string：Windows 通知/任务栏/资源管理器显示的应用身份。
       FileDescription 决定系统通知横幅顶部名称（配合 main.ts 的 AUMID=exe 路径）。 */
    try {
      await rcedit(path.join(STAGE, 'ChatScience.exe'), {
        icon: icoSrc,
        'version-string': {
          FileDescription: 'ChatScience',
          ProductName: 'ChatScience',
          OriginalFilename: 'ChatScience.exe'
        }
      });
    }
    catch (e) { console.error('[pack] rcedit 失败: ' + (e as Error).message); process.exit(1); }
  } else {
    log('警告: 未找到 icons/app.ico，exe 保持默认图标（先跑 make-icons.js）');
  }

  /* 3. 应用源码 → resources/app（明文，总是重新复制） */
  log('复制应用源码 ...');
  fs.mkdirSync(APPDIR, { recursive: true });
  ['main.js', 'preload.js', 'package.json', 'build.js', 'tray.png', 'tray@2x.png'].forEach(function (f) {
    fs.copyFileSync(path.join(APP, f), path.join(APPDIR, f));
  });
  if (fs.existsSync(icoSrc)) fs.copyFileSync(icoSrc, path.join(APPDIR, 'app.ico'));
  copyTree(path.join(APP, 'server'), path.join(APPDIR, 'server'));
  copyTree(path.join(APP, 'shared'), path.join(APPDIR, 'shared'));
  copyTree(path.join(APP, 'renderer'), path.join(APPDIR, 'renderer'));
  if (!skipHeavy) {
    log('复制 node_modules（排除 electron 运行时本体与 TS 工具链）...');
    /* typescript/@types 仅构建期依赖，产物里不需要；@types 也一并排除以减体积 */
    copyTree(path.join(APP, 'node_modules'), path.join(APPDIR, 'node_modules'),
      [/^electron(\/|$)/, /^electron-packager(\/|$)/, /^typescript(\/|$)/, /^@types(\/|$)/]);
  }

  /* 4. 前端源文件 + 辅助脚本 + 说明 */
  const srcWebapp = path.join(APP, '..', 'webapp');
  fs.mkdirSync(path.join(STAGE, 'webapp'), { recursive: true });
  fs.copyFileSync(path.join(srcWebapp, '主页面.html'), path.join(STAGE, 'webapp', '主页面.html'));
  fs.copyFileSync(path.join(srcWebapp, 'webapp.js'), path.join(STAGE, 'webapp', 'webapp.js'));
  fs.cpSync(path.join(srcWebapp, 'work'), path.join(STAGE, 'webapp', 'work'), { recursive: true });

  fs.writeFileSync(path.join(STAGE, '重新构建.bat'), [
    '@echo off',
    'chcp 65001 >nul',
    'title ChatScience 重新构建',
    'cd /d %~dp0resources\\app',
    'echo [ChatScience] 重建 renderer（修改 webapp/ 或 server/ 源码后执行）...',
    'node build.js',
    'if errorlevel 1 (',
    '  echo 构建失败，请检查上方错误。',
    '  pause',
    '  exit /b 1',
    ')',
    'echo 构建完成。双击 ChatScience.exe 启动。',
    'pause'
  ].join('\r\n'));

  fs.writeFileSync(path.join(STAGE, '使用说明.txt'), [
    'ChatScience 便携试验版',
    '======================',
    '',
    '【运行】双击 ChatScience.exe（绿色版，整个文件夹可拷贝到其他 Windows 机器）。',
    '      用户数据写在 resources\\app\\data\\，删除该文件夹即重置应用。',
    '',
    '【修改源码】本目录即完整可运行代码（明文，无 asar，已编译）：',
    '  - 前端界面:  webapp\\主页面.html + webapp\\webapp.js + webapp\\work\\*.js',
    '  - 后端服务:  resources\\app\\server\\*.js',
    '  - Electron:  resources\\app\\main.js / preload.js',
    '  改完后双击「重新构建.bat」（需电脑装有 Node.js），再启动 ChatScience.exe。',
    '  注意：全部源码为 TypeScript（源码工程 app\\src\\，前端含 src\\webapp），本包内是 tsc 编译',
    '  产物；正式改动请回源码工程改 src\\ 后重新 node pack.js，本包内直改仅作临时试验。',
    '',
    '【认证】resources\\app\\server\\qoder.json 内含 Qoder 访问令牌，等同账户身份，',
    '      分享文件夹前请先清理该文件（或替换为自己的令牌）。',
    '',
    '【端口】默认 8642，被占用时自动换备选端口（见 resources\\app\\data\\runtime.json）。',
    '',
    '【图标】exe/窗口/托盘图标由源码工程的 logo.jpeg 生成（app\\make-icons.js → icons\\app.ico），',
    '      换 logo 后重跑 make-icons.js 再打包即可；若资源管理器仍显示旧图标为系统缓存，',
    '      重命名或移动文件夹后刷新即恢复。',
  ].join('\r\n'), 'utf8');

  /* 5. 产物自检 */
  const must = [
    path.join(STAGE, 'ChatScience.exe'),
    path.join(APPDIR, 'main.js'),
    path.join(APPDIR, 'app.ico'),
    path.join(APPDIR, 'tray.png'),
    path.join(APPDIR, 'renderer', 'index.html'),
    path.join(APPDIR, 'server', 'qoder.js'),
    path.join(APPDIR, 'shared', 'qoder-sdk.js'),
    path.join(APPDIR, 'shared', 'domain.js'),
    path.join(APPDIR, 'server', 'skills-plugin', 'skills', 'mindspore-repro', 'SKILL.md'),
    path.join(APPDIR, 'node_modules', '@qodercn-ai', 'qodercn-agent-sdk'),
    path.join(APPDIR, 'node_modules', 'express'),
    path.join(APPDIR, 'node_modules', 'zod'),
    path.join(STAGE, 'webapp', 'webapp.js'),
    path.join(STAGE, 'webapp', 'work', '90-boot.js'),
    path.join(STAGE, '重新构建.bat')
  ];
  const missing = must.filter(function (p) { return !fs.existsSync(p); });
  if (missing.length) {
    console.error('[pack] 产物自检失败，缺少:\n  ' + missing.join('\n  '));
    process.exit(1);
  }
  const probe = spawnSync(process.execPath, ['-e', "require('@qodercn-ai/qodercn-agent-sdk');require('express');console.log('deps ok')"],
    { cwd: APPDIR, encoding: 'utf8' });
  if (probe.status !== 0) {
    console.error('[pack] 依赖自检失败: ' + (probe.stderr || probe.status));
    process.exit(1);
  }
  log((probe.stdout || '').trim());

  /* 6. 启动冒烟：exe 起来后应写出 runtime.json，随后结束进程 */
  log('启动冒烟（约 8 秒）...');
  const rt = path.join(APPDIR, 'data', 'runtime.json');
  const rtBefore = fs.existsSync(rt) ? fs.statSync(rt).mtimeMs : 0;
  /* 注意：spawnSync 会等子进程退出（detached 对它无效），便携 exe 是常驻应用，
     必须用 spawn + unref 异步拉起。
     关键：若宿主环境泄漏 ELECTRON_RUN_AS_NODE=1（Electron 宿主如 WorkBuddy 的
     沙箱常见），electron.exe 会退化为纯 Node 运行、应用无法启动——必须剥掉。 */
  const smokeEnv = Object.assign({}, process.env);
  delete smokeEnv.ELECTRON_RUN_AS_NODE;
  const child = spawn(path.join(STAGE, 'ChatScience.exe'), [], {
    cwd: STAGE, detached: true, stdio: 'ignore', env: smokeEnv
  });
  child.unref();
  let smokeOk = false;
  for (let i = 0; i < 40; i++) {   /* 首启可能被杀软扫描拖慢，等 20 秒 */
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
    try {
      if (fs.existsSync(rt) && fs.statSync(rt).mtimeMs > rtBefore) { smokeOk = true; break; }
    } catch (e) { /* 重试 */ }
  }
  spawnSync('taskkill', ['/IM', 'ChatScience.exe', '/T', '/F'], { stdio: 'ignore' });
  if (!smokeOk && !process.env.CS_PACK_SKIP_SMOKE) {
    console.error('[pack] 启动冒烟未通过：exe 未在 8 秒内写出 runtime.json（可能被杀软拦截，见 使用说明）');
    process.exit(1);
  }
  log(smokeOk ? '启动冒烟通过' : 'CS_PACK_SKIP_SMOKE=1：启动冒烟未判定（跳过）');

  const sizeMb = Math.round(getDirSize(STAGE) / 1048576);
  log('完成: ' + STAGE);
  log('体积约 ' + sizeMb + ' MB，总耗时 ' + Math.round((Date.now() - t0) / 1000) + 's');
}

function getDirSize(dir: string): number {
  let total = 0;
  const stack: string[] = [dir];
  while (stack.length) {
    const d = stack.pop()!;
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { continue; }
    entries.forEach(function (e2) {
      const p = path.join(d, e2.name);
      try {
        if (e2.isDirectory()) stack.push(p);
        else total += fs.statSync(p).size;
      } catch (err) { /* 忽略 */ }
    });
  }
  return total;
}

main();

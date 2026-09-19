/* ==================================================================
   ChatScience 桌面版 · Electron 主进程
   - 窗口管理（尺寸调整 / 最小化 / 最大化 / 置顶）
   - 托盘图标（显示 / 退出）
   - 全局快捷键（Ctrl+Alt+C 显示隐藏、Ctrl+Alt+T 置顶）
   - 系统通知（AI 回复完成、后台提示）
   - 本地数据持久化（data/state.json，原子写入）
   - 安全：contextIsolation + IPC 白名单 + 本地服务随机 token
   ================================================================== */
import { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, Notification, nativeImage, shell, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import type { ServerHandle } from './server/index';

const PORT_CANDIDATES = [8642, 17462, 27511, 38123, 2917, 3218];
const TOKEN = crypto.randomBytes(24).toString('hex');
let PORT = PORT_CANDIDATES[0];
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

/* 启动诊断标记（定位打包版静默退出用；常驻保留，成本一行日志）
   注：CDP 远程调试由启动参数 --remote-debugging-port=<port> 控制（appendSwitch
   对此类早期开关不生效），验证脚本 exe-verify.ts 以命令行参数传入。 */
try {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
  fs.appendFileSync(path.join(__dirname, 'data', 'boot-marker.log'),
    new Date().toISOString() + ' main.js loaded pid=' + process.pid + '\n');
} catch (e) { /* 忽略 */ }

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let alwaysOnTop = false;
let quitting = false;
let serverHandle: ServerHandle | null = null;

/* ---------------- 数据持久化（原子写 + 防抖） ---------------- */
function readState(): string | null {
  try { return fs.readFileSync(STATE_FILE, 'utf8'); } catch (e) { return null; }
}
let writeTimer: NodeJS.Timeout | null = null;
let pendingState: string | null = null;
function writeState(json: string): void {
  pendingState = json;
  if (writeTimer) clearTimeout(writeTimer);
  /* 180ms 防抖：既保证变更即时落盘（<200ms 级），又避免高频写 */
  writeTimer = setTimeout(flushState, 180);
}
function flushState(): void {
  if (pendingState == null) return;
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = STATE_FILE + '.tmp';
    fs.writeFileSync(tmp, pendingState, 'utf8');
    fs.renameSync(tmp, STATE_FILE);
    pendingState = null;
  } catch (e) { console.error('[store] write failed', (e as Error).message); }
}

/* ---------------- IPC 白名单 ---------------- */
/* 通知抑制决策：仅在用户「不在看应用」时提醒。
   - 置顶窗口：用户明确保持可见，任务完成不打扰 → 不通知
   - 任一窗口前台聚焦：用户正在交互（会话中）→ 不通知
   - 其余（后台失焦 / 最小化 / 隐藏到托盘）→ 通知提醒任务完成 */
function shouldNotify(): boolean {
  if (alwaysOnTop) return false;
  const wins: BrowserWindow[] = ([] as (BrowserWindow | null)[])
    .concat(win, childWins)
    .filter((w): w is BrowserWindow => !!w && !w.isDestroyed());
  if (!wins.length) return true;
  return !wins.some((w) => w.isVisible() && w.isFocused());
}
ipcMain.on('state:get', (event) => { event.returnValue = readState(); });
ipcMain.on('state:save', (event, json) => { writeState(String(json || '')); event.returnValue = true; });
ipcMain.on('notify', (event, payload) => {
  try {
    const p = payload || {};
    const desc = String(p.title || '') + ' / ' + String(p.body || '').slice(0, 40);
    if (!shouldNotify()) { appendLog('notify suppressed: ' + desc); return; }
    if (Notification.isSupported()) {
      new Notification({ title: String(p.title || 'ChatScience'), body: String(p.body || ''), silent: false }).show();
      appendLog('notify shown: ' + desc);
    }
  } catch (e) { /* 忽略 */ }
});
ipcMain.on('log', (event, line) => { appendLog(String(line || '')); });

/* 选择本地文件夹（Work 模式工作区）。invoke 句柄式，纯浏览器模式无此通道 */
ipcMain.handle('cs:select-directory', async () => {
  try {
    if (!win) return null;
    const r = await dialog.showOpenDialog(win, {
      title: '选择工作区文件夹',
      properties: ['openDirectory', 'createDirectory']
    });
    if (r.canceled || !r.filePaths.length) return null;
    return r.filePaths[0];
  } catch (e) {
    /* 不吞错：失败原因回传渲染端 toast，同时落日志 */
    appendLog('select-directory failed: ' + (e as Error).message);
    return { error: (e as Error).message };
  }
});

/* 打开本地文件夹（设置页「记忆」的打开按钮）。shell.openPath，失败原因回传渲染端 */
ipcMain.handle('cs:open-path', async (_e, p: unknown) => {
  const target = String(p || '');
  try {
    if (!target || !path.isAbsolute(target)) return { error: '非法路径' };
    const st = fs.statSync(target);
    if (!st.isDirectory()) return { error: '不是目录' };
    const r = await shell.openPath(target);
    return r ? { error: r } : { ok: true };
  } catch (e) {
    appendLog('open-path failed: ' + (e as Error).message);
    return { error: (e as Error).message };
  }
});

/* 自绘标题栏窗口控制：按 sender 定位窗口（多窗口各自生效） */
ipcMain.on('win:minimize', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (w) w.minimize();
});
ipcMain.on('win:maximize-toggle', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w) return;
  if (w.isMaximized()) w.unmaximize(); else w.maximize();
});
ipcMain.on('win:close', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (w) w.close();
});
function forwardMaxState(w: BrowserWindow): void {
  const send = () => { if (!w.isDestroyed()) w.webContents.send('win:max-changed', w.isMaximized()); };
  w.on('maximize', send);
  w.on('unmaximize', send);
}

/* ---------------- 日志 ---------------- */
const LOG_FILE = path.join(DATA_DIR, 'app.log');
function appendLog(line: string): void {
  try { fs.appendFileSync(LOG_FILE, new Date().toISOString() + ' ' + line + '\n'); } catch (e) { /* 忽略 */ }
}

/* ---------------- 主窗口 ---------------- */
function createWindow(): void {
  win = new BrowserWindow({
    width: 1320, height: 880, minWidth: 980, minHeight: 620,
    show: false, backgroundColor: '#F6F7F9',
    title: 'ChatScience',
    icon: path.join(__dirname, 'app.ico'),
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });
  forwardMaxState(win);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'), { search: 'token=' + TOKEN + '&port=' + PORT });
  win.once('ready-to-show', () => { if (win) win.show(); });
  /* 兜底：页面命中缓存加载极快时，ready-to-show 可能先于监听注册触发，窗口会永远 show:false */
  setTimeout(() => {
    if (win && !win.isDestroyed() && !win.isVisible() && !quitting) { win.show(); win.focus(); }
  }, 3000);
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  /* 关窗 = 隐藏到托盘；退出走托盘菜单 */
  win.on('close', (e) => {
    if (!quitting && win) { e.preventDefault(); win.hide(); }
  });
}

function toggleWindow(): void {
  if (!win) return;
  if (win.isVisible() && win.isFocused()) win.hide();
  else { win.show(); win.focus(); }
}

function toggleTopmost(): void {
  alwaysOnTop = !alwaysOnTop;
  if (win) win.setAlwaysOnTop(alwaysOnTop);
  if (tray) tray.setToolTip('ChatScience' + (alwaysOnTop ? '（置顶）' : ''));
  if (win) win.webContents.send('topmost-changed', alwaysOnTop);
}

/* ---------------- 托盘 ---------------- */
function createTray(): void {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'tray.png'));
  tray = new Tray(icon);
  const menu = Menu.buildFromTemplate([
    { label: '显示主界面', click: () => { if (win) { win.show(); win.focus(); } } },
    { label: '新建窗口（多窗口）', click: createChildWindow },
    { type: 'separator' },
    { label: '置顶窗口 Ctrl+Alt+T', click: toggleTopmost },
    { type: 'separator' },
    { label: '退出', click: () => { quitting = true; app.exit(0); } }
  ]);
  tray.setContextMenu(menu);
  tray.setToolTip('ChatScience');
  tray.on('double-click', () => { if (win) { win.show(); win.focus(); } });
}

/* 多窗口：子窗口共享同一后端与状态 */
const childWins: BrowserWindow[] = [];
function createChildWindow(): void {
  const w = new BrowserWindow({
    width: 1080, height: 760, minWidth: 980, minHeight: 620,
    title: 'ChatScience · 窗口 ' + (childWins.length + 2),
    icon: path.join(__dirname, 'app.ico'),
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true
    }
  });
  forwardMaxState(w);
  w.loadFile(path.join(__dirname, 'renderer', 'index.html'), { search: 'token=' + TOKEN + '&port=' + PORT });
  childWins.push(w);
  w.on('closed', () => { const i = childWins.indexOf(w); if (i > -1) childWins.splice(i, 1); });
}

/* ---------------- 启动 ---------------- */
/* Windows 通知身份：AUMID 指向自身 exe（便携应用官方做法），
   配合 rcedit 写入的 FileDescription/ProductName（见 pack.ts），
   系统通知横幅即显示「ChatScience」名称与应用图标，而非 "Electron" 默认身份。 */
app.setAppUserModelId(process.execPath);

/* 单实例：重复双击 exe 时唤起已有窗口（配合关窗到托盘的常驻设计） */
const gotLock = app.requestSingleInstanceLock();
try {
  fs.appendFileSync(path.join(__dirname, 'data', 'boot-marker.log'),
    new Date().toISOString() + ' lock=' + gotLock + '\n');
} catch (e) { /* 忽略 */ }
if (!gotLock) { app.quit(); } else {
  app.on('second-instance', () => {
    if (win && !win.isDestroyed()) {
      if (win.isMinimized()) win.restore();
      win.show(); win.focus();
    }
  });
}
app.whenReady().then(() => {
  /* 去掉默认 File/Edit/View 菜单栏（配合自绘标题栏）；功能入口都在界面与托盘里 */
  Menu.setApplicationMenu(null);
  try {
    serverHandle = require('./server/index').startServer(PORT_CANDIDATES, TOKEN, __dirname, function (actualPort: number) {
      PORT = actualPort;
      /* 运行时信息落盘，供验证脚本复用 */
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(path.join(DATA_DIR, 'runtime.json'), JSON.stringify({ port: PORT, token: TOKEN, pid: process.pid }), 'utf8');
      } catch (e) { /* 忽略 */ }
      if (win) win.loadFile(path.join(__dirname, 'renderer', 'index.html'), { search: 'token=' + TOKEN + '&port=' + PORT });
    });
    appendLog('server module starting, candidates=' + PORT_CANDIDATES.join(','));
  } catch (e) {
    appendLog('SERVER FAILED: ' + (e as Error).message + ' stack=' + ((e as Error).stack || '').slice(0, 500));
    console.error('[server] failed', e);
  }
  createWindow();
  createTray();
  globalShortcut.register('CommandOrControl+Alt+C', toggleWindow);
  globalShortcut.register('CommandOrControl+Alt+T', toggleTopmost);
  /* 左侧栏展开/收起（仅此快捷键与左栏顶部按钮触发侧栏滑动动画） */
  globalShortcut.register('CommandOrControl+Alt+L', () => {
    if (win && !win.isDestroyed()) win.webContents.send('left-panel-toggle');
  });
});

app.on('before-quit', () => {
  quitting = true;
  flushState();
  /* 关 HTTP + 终止仍在运行的沙箱进程树，防止解释器进程变孤儿 */
  if (serverHandle) { try { serverHandle.stop(); } catch (e) { /* 忽略 */ } }
});
app.on('will-quit', () => { globalShortcut.unregisterAll(); });
app.on('window-all-closed', () => { /* 保留托盘常驻；由托盘退出 */ });

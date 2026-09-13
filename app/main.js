"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/* ==================================================================
   ChatScience 桌面版 · Electron 主进程
   - 窗口管理（尺寸调整 / 最小化 / 最大化 / 置顶）
   - 托盘图标（显示 / 退出）
   - 全局快捷键（Ctrl+Alt+C 显示隐藏、Ctrl+Alt+T 置顶）
   - 系统通知（AI 回复完成、后台提示）
   - 本地数据持久化（data/state.json，原子写入）
   - 安全：contextIsolation + IPC 白名单 + 本地服务随机 token
   ================================================================== */
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
const PORT_CANDIDATES = [8642, 17462, 27511, 38123, 2917, 3218];
const TOKEN = crypto.randomBytes(24).toString('hex');
let PORT = PORT_CANDIDATES[0];
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
/* 验证通道：设置 CS_REMOTE_DEBUGGING_PORT 环境变量时启用 CDP 远程调试，
   供打包版自动化 UI 验证连接（普通用户不受影响） */
if (process.env.CS_REMOTE_DEBUGGING_PORT) {
    electron_1.app.commandLine.appendSwitch('remote-debugging-port', process.env.CS_REMOTE_DEBUGGING_PORT);
}
let win = null;
let tray = null;
let alwaysOnTop = false;
let quitting = false;
let serverHandle = null;
/* ---------------- 数据持久化（原子写 + 防抖） ---------------- */
function readState() {
    try {
        return fs.readFileSync(STATE_FILE, 'utf8');
    }
    catch (e) {
        return null;
    }
}
let writeTimer = null;
let pendingState = null;
function writeState(json) {
    pendingState = json;
    if (writeTimer)
        clearTimeout(writeTimer);
    /* 180ms 防抖：既保证变更即时落盘（<200ms 级），又避免高频写 */
    writeTimer = setTimeout(flushState, 180);
}
function flushState() {
    if (pendingState == null)
        return;
    try {
        if (!fs.existsSync(DATA_DIR))
            fs.mkdirSync(DATA_DIR, { recursive: true });
        const tmp = STATE_FILE + '.tmp';
        fs.writeFileSync(tmp, pendingState, 'utf8');
        fs.renameSync(tmp, STATE_FILE);
        pendingState = null;
    }
    catch (e) {
        console.error('[store] write failed', e.message);
    }
}
/* ---------------- IPC 白名单 ---------------- */
electron_1.ipcMain.on('state:get', (event) => { event.returnValue = readState(); });
electron_1.ipcMain.on('state:save', (event, json) => { writeState(String(json || '')); event.returnValue = true; });
electron_1.ipcMain.on('notify', (event, payload) => {
    try {
        const p = payload || {};
        if (electron_1.Notification.isSupported())
            new electron_1.Notification({ title: String(p.title || 'ChatScience'), body: String(p.body || ''), silent: false }).show();
    }
    catch (e) { /* 忽略 */ }
});
electron_1.ipcMain.on('log', (event, line) => { appendLog(String(line || '')); });
/* 选择本地文件夹（Work 模式工作区）。invoke 句柄式，纯浏览器模式无此通道 */
electron_1.ipcMain.handle('cs:select-directory', async () => {
    try {
        if (!win)
            return null;
        const r = await electron_1.dialog.showOpenDialog(win, {
            title: '选择工作区文件夹',
            properties: ['openDirectory', 'createDirectory']
        });
        if (r.canceled || !r.filePaths.length)
            return null;
        return r.filePaths[0];
    }
    catch (e) {
        /* 不吞错：失败原因回传渲染端 toast，同时落日志 */
        appendLog('select-directory failed: ' + e.message);
        return { error: e.message };
    }
});
/* 自绘标题栏窗口控制：按 sender 定位窗口（多窗口各自生效） */
electron_1.ipcMain.on('win:minimize', (e) => {
    const w = electron_1.BrowserWindow.fromWebContents(e.sender);
    if (w)
        w.minimize();
});
electron_1.ipcMain.on('win:maximize-toggle', (e) => {
    const w = electron_1.BrowserWindow.fromWebContents(e.sender);
    if (!w)
        return;
    if (w.isMaximized())
        w.unmaximize();
    else
        w.maximize();
});
electron_1.ipcMain.on('win:close', (e) => {
    const w = electron_1.BrowserWindow.fromWebContents(e.sender);
    if (w)
        w.close();
});
function forwardMaxState(w) {
    const send = () => { if (!w.isDestroyed())
        w.webContents.send('win:max-changed', w.isMaximized()); };
    w.on('maximize', send);
    w.on('unmaximize', send);
}
/* ---------------- 日志 ---------------- */
const LOG_FILE = path.join(DATA_DIR, 'app.log');
function appendLog(line) {
    try {
        fs.appendFileSync(LOG_FILE, new Date().toISOString() + ' ' + line + '\n');
    }
    catch (e) { /* 忽略 */ }
}
/* ---------------- 主窗口 ---------------- */
function createWindow() {
    win = new electron_1.BrowserWindow({
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
    win.once('ready-to-show', () => { if (win)
        win.show(); });
    /* 兜底：页面命中缓存加载极快时，ready-to-show 可能先于监听注册触发，窗口会永远 show:false */
    setTimeout(() => {
        if (win && !win.isDestroyed() && !win.isVisible() && !quitting) {
            win.show();
            win.focus();
        }
    }, 3000);
    win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url))
        electron_1.shell.openExternal(url); return { action: 'deny' }; });
    /* 关窗 = 隐藏到托盘；退出走托盘菜单 */
    win.on('close', (e) => {
        if (!quitting && win) {
            e.preventDefault();
            win.hide();
        }
    });
}
function toggleWindow() {
    if (!win)
        return;
    if (win.isVisible() && win.isFocused())
        win.hide();
    else {
        win.show();
        win.focus();
    }
}
function toggleTopmost() {
    alwaysOnTop = !alwaysOnTop;
    if (win)
        win.setAlwaysOnTop(alwaysOnTop);
    if (tray)
        tray.setToolTip('ChatScience' + (alwaysOnTop ? '（置顶）' : ''));
    if (win)
        win.webContents.send('topmost-changed', alwaysOnTop);
}
/* ---------------- 托盘 ---------------- */
function createTray() {
    const icon = electron_1.nativeImage.createFromPath(path.join(__dirname, 'tray.png'));
    tray = new electron_1.Tray(icon);
    const menu = electron_1.Menu.buildFromTemplate([
        { label: '显示主界面', click: () => { if (win) {
                win.show();
                win.focus();
            } } },
        { label: '新建窗口（多窗口）', click: createChildWindow },
        { type: 'separator' },
        { label: '置顶窗口 Ctrl+Alt+T', click: toggleTopmost },
        { type: 'separator' },
        { label: '退出', click: () => { quitting = true; electron_1.app.exit(0); } }
    ]);
    tray.setContextMenu(menu);
    tray.setToolTip('ChatScience');
    tray.on('double-click', () => { if (win) {
        win.show();
        win.focus();
    } });
}
/* 多窗口：子窗口共享同一后端与状态 */
const childWins = [];
function createChildWindow() {
    const w = new electron_1.BrowserWindow({
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
    w.on('closed', () => { const i = childWins.indexOf(w); if (i > -1)
        childWins.splice(i, 1); });
}
/* ---------------- 启动 ---------------- */
/* 单实例：重复双击 exe 时唤起已有窗口（配合关窗到托盘的常驻设计） */
const gotLock = electron_1.app.requestSingleInstanceLock();
if (!gotLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', () => {
        if (win && !win.isDestroyed()) {
            if (win.isMinimized())
                win.restore();
            win.show();
            win.focus();
        }
    });
}
electron_1.app.whenReady().then(() => {
    /* 去掉默认 File/Edit/View 菜单栏（配合自绘标题栏）；功能入口都在界面与托盘里 */
    electron_1.Menu.setApplicationMenu(null);
    try {
        serverHandle = require('./server/index').startServer(PORT_CANDIDATES, TOKEN, __dirname, function (actualPort) {
            PORT = actualPort;
            /* 运行时信息落盘，供验证脚本复用 */
            try {
                fs.mkdirSync(DATA_DIR, { recursive: true });
                fs.writeFileSync(path.join(DATA_DIR, 'runtime.json'), JSON.stringify({ port: PORT, token: TOKEN, pid: process.pid }), 'utf8');
            }
            catch (e) { /* 忽略 */ }
            if (win)
                win.loadFile(path.join(__dirname, 'renderer', 'index.html'), { search: 'token=' + TOKEN + '&port=' + PORT });
        });
        appendLog('server module starting, candidates=' + PORT_CANDIDATES.join(','));
    }
    catch (e) {
        appendLog('SERVER FAILED: ' + e.message + ' stack=' + (e.stack || '').slice(0, 500));
        console.error('[server] failed', e);
    }
    createWindow();
    createTray();
    electron_1.globalShortcut.register('CommandOrControl+Alt+C', toggleWindow);
    electron_1.globalShortcut.register('CommandOrControl+Alt+T', toggleTopmost);
    /* 左侧栏展开/收起（仅此快捷键与左栏顶部按钮触发侧栏滑动动画） */
    electron_1.globalShortcut.register('CommandOrControl+Alt+L', () => {
        if (win && !win.isDestroyed())
            win.webContents.send('left-panel-toggle');
    });
});
electron_1.app.on('before-quit', () => {
    quitting = true;
    flushState();
    /* 关 HTTP + 终止仍在运行的沙箱进程树，防止解释器进程变孤儿 */
    if (serverHandle) {
        try {
            serverHandle.stop();
        }
        catch (e) { /* 忽略 */ }
    }
});
electron_1.app.on('will-quit', () => { electron_1.globalShortcut.unregisterAll(); });
electron_1.app.on('window-all-closed', () => { });

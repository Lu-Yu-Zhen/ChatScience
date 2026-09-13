"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* ==================================================================
   ChatScience 桌面版 · preload 安全桥（contextIsolation）
   token 通过页面 URL query 注入（不落盘），preload 读取后透出。
   暴露的 window.csDesktop 结构对应 shared/domain.ts 的 CsDesktopBridge。
   ================================================================== */
const electron_1 = require("electron");
const params = new URLSearchParams(window.location.search || '');
const token = params.get('token') || '';
const port = params.get('port') || '';
electron_1.contextBridge.exposeInMainWorld('csDesktop', {
    version: '1.0.0',
    platform: process.platform,
    token: token,
    port: port,
    base: port ? 'http://127.0.0.1:' + port : '',
    getStateSync: () => electron_1.ipcRenderer.sendSync('state:get'),
    saveState: (json) => electron_1.ipcRenderer.sendSync('state:save', json),
    notify: (title, body) => electron_1.ipcRenderer.send('notify', { title, body }),
    log: (line) => electron_1.ipcRenderer.send('log', line),
    onTopmostChanged: (cb) => electron_1.ipcRenderer.on('topmost-changed', (e, v) => cb(v)),
    onLeftPanelToggle: (cb) => electron_1.ipcRenderer.on('left-panel-toggle', () => cb()),
    onMaxChanged: (cb) => electron_1.ipcRenderer.on('win:max-changed', (e, v) => cb(v)),
    winMinimize: () => electron_1.ipcRenderer.send('win:minimize'),
    winMaximizeToggle: () => electron_1.ipcRenderer.send('win:maximize-toggle'),
    winClose: () => electron_1.ipcRenderer.send('win:close'),
    selectDirectory: () => electron_1.ipcRenderer.invoke('cs:select-directory')
});

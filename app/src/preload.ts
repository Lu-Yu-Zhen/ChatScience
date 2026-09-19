/* ==================================================================
   ChatScience 桌面版 · preload 安全桥（contextIsolation）
   token 通过页面 URL query 注入（不落盘），preload 读取后透出。
   暴露的 window.csDesktop 结构对应 shared/domain.ts 的 CsDesktopBridge。
   ================================================================== */
import { contextBridge, ipcRenderer } from 'electron';

const params = new URLSearchParams(window.location.search || '');
const token = params.get('token') || '';
const port = params.get('port') || '';

contextBridge.exposeInMainWorld('csDesktop', {
  version: '1.0.0',
  platform: process.platform,
  token: token,
  port: port,
  base: port ? 'http://127.0.0.1:' + port : '',
  getStateSync: () => ipcRenderer.sendSync('state:get'),
  saveState: (json: string) => ipcRenderer.sendSync('state:save', json),
  notify: (title: string, body: string) => ipcRenderer.send('notify', { title, body }),
  log: (line: string) => ipcRenderer.send('log', line),
  onTopmostChanged: (cb: (v: boolean) => void) => ipcRenderer.on('topmost-changed', (e, v) => cb(v)),
  onLeftPanelToggle: (cb: () => void) => ipcRenderer.on('left-panel-toggle', () => cb()),
  onMaxChanged: (cb: (v: boolean) => void) => ipcRenderer.on('win:max-changed', (e, v) => cb(v)),
  winMinimize: () => ipcRenderer.send('win:minimize'),
  winMaximizeToggle: () => ipcRenderer.send('win:maximize-toggle'),
  winClose: () => ipcRenderer.send('win:close'),
  selectDirectory: () => ipcRenderer.invoke('cs:select-directory'),
  openPath: (p: string) => ipcRenderer.invoke('cs:open-path', p)
});

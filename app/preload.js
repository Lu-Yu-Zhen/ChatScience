/* ChatScience 桌面版 · preload 安全桥（contextIsolation）
   token 通过页面 URL query 注入（不落盘），preload 读取后透出 */
const { contextBridge, ipcRenderer } = require('electron');

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
  saveState: (json) => ipcRenderer.sendSync('state:save', json),
  notify: (title, body) => ipcRenderer.send('notify', { title, body }),
  log: (line) => ipcRenderer.send('log', line),
  onTopmostChanged: (cb) => ipcRenderer.on('topmost-changed', (e, v) => cb(v)),
  onLeftPanelToggle: (cb) => ipcRenderer.on('left-panel-toggle', () => cb()),
  onMaxChanged: (cb) => ipcRenderer.on('win:max-changed', (e, v) => cb(v)),
  winMinimize: () => ipcRenderer.send('win:minimize'),
  winMaximizeToggle: () => ipcRenderer.send('win:maximize-toggle'),
  winClose: () => ipcRenderer.send('win:close'),
  selectDirectory: () => ipcRenderer.invoke('cs:select-directory')
});

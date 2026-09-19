/* 截真实 exe 设置页（最大化窗口）并打印关键几何数据 */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, execSync } = require('child_process');
const STAGE = path.join(__dirname, '..', 'dist', 'ChatScience-win32-x64');
const EXE = path.join(STAGE, 'ChatScience.exe');
const RUNTIME = path.join(STAGE, 'resources', 'app', 'data', 'runtime.json');
const CDP = 9227;
let ws = null, id = 0; const pend = new Map();
const sleep = ms => new Promise(r => setTimeout(r, ms));
function send(m, p) { return new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error('timeout ' + m)); } }, 15000); }); }
async function ev(e) { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true }); return r && r.result ? r.result.value : undefined; }
function rect(sel) {
  return `(function(){const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect();return {l:Math.round(r.left),t:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height),r:Math.round(r.right),cx:Math.round(r.left+r.width/2)};})()`;
}
async function main() {
  const mt = fs.existsSync(RUNTIME) ? fs.statSync(RUNTIME).mtimeMs : 0;
  const env = Object.assign({}, process.env); delete env.ELECTRON_RUN_AS_NODE;
  spawn(EXE, ['--remote-debugging-port=' + CDP], { cwd: STAGE, env, stdio: 'ignore' }).unref();
  let rt = null;
  for (let i = 0; i < 80; i++) { await sleep(500); try { if (fs.statSync(RUNTIME).mtimeMs > mt) { rt = JSON.parse(fs.readFileSync(RUNTIME, 'utf8')); break; } } catch (e) { } }
  console.log('rt.port=' + rt.port); await sleep(1500);
  const tg = await new Promise((res, rej) => { http.get('http://127.0.0.1:' + CDP + '/json/list', r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d))); }).on('error', rej); });
  const page = tg.find(t => t.type === 'page');
  const WS = (await import('ws')).default;
  await new Promise((res, rej) => { ws = new WS(page.webSocketDebuggerUrl, { perMessageDeflate: false }); ws.on('open', () => { ws.on('message', m => { const x = JSON.parse(m); if (x.id && pend.has(x.id)) { const p = pend.get(x.id); pend.delete(x.id); x.error ? p.reject(new Error(JSON.stringify(x.error))) : p.res(x.result); } }); res(); }); ws.on('error', rej); });
  await send('Runtime.enable');
  await ev('typeof openSettings === "function" && openSettings("memory")');
  await sleep(1500);
  const win = { iw: await ev('window.innerWidth'), ih: await ev('window.innerHeight') };
  console.log('window: ' + JSON.stringify(win));
  console.log('leftPanel: ' + JSON.stringify(await ev(rect('#leftPanel'))));
  console.log('settingsPage: ' + JSON.stringify(await ev(rect('#settingsPage'))));
  console.log('settingsNav: ' + JSON.stringify(await ev(rect('#settingsNav'))));
  console.log('content paper: ' + JSON.stringify(await ev(rect('#settingsPage > div:nth-child(2) > .settings-paper'))));
  console.log('panelHead: ' + JSON.stringify(await ev(rect('#settingsPanelHead'))));
  console.log('workBody: ' + JSON.stringify(await ev(rect('#settingsWorkBody'))));
  console.log('first pref-card: ' + JSON.stringify(await ev(rect('#settingsWorkBody .pref-card'))));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, 'settings-geometry.png'), Buffer.from(shot.data, 'base64'));
  console.log('screenshot: verify/settings-geometry.png');
  try { execSync('taskkill /IM ChatScience.exe /T /F', { stdio: 'ignore' }); } catch (e) { }
  process.exit(0);
}
main().catch(e => { console.error('ERR ' + e.message); try { execSync('taskkill /IM ChatScience.exe /T /F', { stdio: 'ignore' }); } catch (x) { } process.exit(1); });

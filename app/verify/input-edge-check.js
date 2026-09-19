/* 标题栏压缩 + 输入框渐变边框主题适配验证（真实 exe CDP） */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, execSync } = require('child_process');
const STAGE = path.join(__dirname, '..', 'dist', 'ChatScience-win32-x64');
const EXE = path.join(STAGE, 'ChatScience.exe');
const RUNTIME = path.join(STAGE, 'resources', 'app', 'data', 'runtime.json');
const CDP = 9228;
let ws = null, id = 0; const pend = new Map();
const sleep = ms => new Promise(r => setTimeout(r, ms));
function send(m, p) { return new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error('timeout ' + m)); } }, 15000); }); }
async function ev(e) { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true }); return r && r.result ? r.result.value : undefined; }
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('  PASS ' + name + (extra ? ' | ' + extra : '')); } else { fail++; console.log('  FAIL ' + name + (extra ? ' | ' + extra : '')); } }

async function main() {
  const mt = fs.existsSync(RUNTIME) ? fs.statSync(RUNTIME).mtimeMs : 0;
  const env = Object.assign({}, process.env); delete env.ELECTRON_RUN_AS_NODE;
  spawn(EXE, ['--remote-debugging-port=' + CDP], { cwd: STAGE, env, stdio: 'ignore' }).unref();
  let rt = null;
  for (let i = 0; i < 80; i++) { await sleep(500); try { if (fs.statSync(RUNTIME).mtimeMs > mt) { rt = JSON.parse(fs.readFileSync(RUNTIME, 'utf8')); break; } } catch (e) { } }
  await sleep(1500);
  const tg = await new Promise((res, rej) => { http.get('http://127.0.0.1:' + CDP + '/json/list', r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d))); }).on('error', rej); });
  const page = tg.find(t => t.type === 'page');
  const WS = (await import('ws')).default;
  await new Promise((res, rej) => { ws = new WS(page.webSocketDebuggerUrl, { perMessageDeflate: false }); ws.on('open', () => { ws.on('message', m => { const x = JSON.parse(m); if (x.id && pend.has(x.id)) { const p = pend.get(x.id); pend.delete(x.id); x.error ? p.reject(new Error(JSON.stringify(x.error))) : p.res(x.result); } }); res(); }); ws.on('error', rej); });
  await send('Runtime.enable');

  console.log('[A] 标题栏高度压缩 + 总高守恒');
  const geo = await ev('(function(){const h=document.getElementById("mainHeader").getBoundingClientRect();const c=document.querySelector("#centerPanel .chat-body").getBoundingClientRect();const p=document.getElementById("centerPanel").getBoundingClientRect();return {hh:Math.round(h.height),ch:Math.round(c.height),ph:Math.round(p.height)};})()');
  console.log('    mainHeader=' + geo.hh + 'px chat-body=' + geo.ch + 'px centerPanel=' + geo.ph + 'px');
  check('A1 标题栏已收窄（<60px）', geo.hh < 60, geo.hh + 'px');
  check('A2 总高守恒（header+body+margin≈panel）', geo.hh + geo.ch + 20 >= geo.ph - 4 && geo.hh + geo.ch + 20 <= geo.ph + 4, 'sum=' + (geo.hh + geo.ch) + ' panel=' + geo.ph);

  console.log('[B] 输入框「由内向外」渐变光晕随主题切换');
  const themes = [
    { id: 'modern-minimal', expect: '47, 111, 237' },
    { id: 'ink-green', expect: '27, 107, 90' },
    { id: 'cinnabar', expect: '53, 86, 107' },
    { id: 'sky-sea', expect: '44, 95, 141' },
    { id: 'nostalgia', expect: '160, 82, 45' },
    { id: 'glass', expect: '158, 59, 34' }
  ];
  for (const th of themes) {
    await ev('localStorage.setItem("cs-theme","' + th.id + '");applyTheme()');
    await sleep(300);
    const bs = await ev('(function(){return getComputedStyle(document.querySelector(".input-box")).boxShadow;})()');
    /* 由内向外光晕 = inset 1px 主题色实描边 + 外扩柔光渐隐层
       （未聚焦 12px 2px / 聚焦 16px 4px，启动时输入框自动聚焦） */
    const layered = /inset/.test(bs) && /0px 0px 1[26]px [24]px/.test(bs);
    check('B·' + th.id + ' 由内向外光晕且含主题色', bs.indexOf(th.expect) > -1 && layered, bs.slice(0, 150));
  }
  /* 截图：切到万山红遍看输入框观感 */
  await ev('localStorage.setItem("cs-theme","glass");applyTheme()');
  await sleep(500);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, '..', '..', '设置页验证截图', '0916-input-edge-glass.png'), Buffer.from(shot.data, 'base64'));
  await ev('localStorage.setItem("cs-theme","ink-green");applyTheme()');
  await sleep(500);
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, '..', '..', '设置页验证截图', '0916-input-edge-inkgreen.png'), Buffer.from(shot2.data, 'base64'));
  console.log('    截图已存 设置页验证截图/0916-input-edge-*.png');

  console.log('\n结果: ' + pass + ' PASS, ' + fail + ' FAIL');
  try { execSync('taskkill /IM ChatScience.exe /T /F', { stdio: 'ignore' }); } catch (e) { }
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('ERR ' + e.message); try { execSync('taskkill /IM ChatScience.exe /T /F', { stdio: 'ignore' }); } catch (x) { } process.exit(1); });

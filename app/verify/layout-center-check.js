/* 主页面布局调整验证（真实 exe CDP）：
   A 标题栏收窄（原 70px → ≤47px，至少减 1/3）
   B 初始态无卡片、输入框垂直居中
   C 发送消息后输入框下滑到底部（原位置）
   D 中栏左上角圆角 12px（左栏可见时）
   E Work 模式初始态同样居中 */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, execSync } = require('child_process');
const STAGE = path.join(__dirname, '..', 'dist', 'ChatScience-win32-x64');
const EXE = path.join(STAGE, 'ChatScience.exe');
const RUNTIME = path.join(STAGE, 'resources', 'app', 'data', 'runtime.json');
const CDP = 9230;
let ws = null, id = 0; const pend = new Map();
const sleep = ms => new Promise(r => setTimeout(r, ms));
function send(m, p) { return new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error('timeout ' + m)); } }, 15000); }); }
async function ev(e) { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); return r && r.result ? r.result.value : undefined; }
let pass = 0, fail = 0;
function check(name, cond, extra) { if (cond) { pass++; console.log('  PASS ' + name + (extra ? ' | ' + extra : '')); } else { fail++; console.log('  FAIL ' + name + (extra ? ' | ' + extra : '')); } }

async function geo() {
  return ev('(function(){' +
    'function r(id){const e=document.getElementById(id);if(!e)return null;const b=e.getBoundingClientRect();return {t:Math.round(b.top),b:Math.round(b.bottom),l:Math.round(b.left),w:Math.round(b.width),h:Math.round(b.height),cy:Math.round(b.top+b.height/2)};}' +
    'const cb=document.querySelector(".chat-body").getBoundingClientRect();' +
    'const es=(function(){const e=document.querySelector("#chatScroll .empty-state");if(!e)return null;const b=e.getBoundingClientRect();return {t:Math.round(b.top),b:Math.round(b.bottom)};})();' +
    'return {hdr:r("mainHeader"),input:r("inputArea"),scroll:r("chatScroll"),chatBody:{t:Math.round(cb.top),b:Math.round(cb.bottom),cy:Math.round(cb.top+cb.height/2),h:Math.round(cb.height)},' +
    'group:es,' +
    'radius:getComputedStyle(document.getElementById("centerPanel")).borderTopLeftRadius,' +
    'cards:document.querySelectorAll("#chatScroll .empty-state > div").length,' +
    'initial:document.body.classList.contains("is-initial-chat")};})()');
}

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
  await sleep(800);

  console.log('[A] 标题栏收窄');
  const g0 = await geo();
  console.log('    hdr.h=' + g0.hdr.h + 'px（原 70px，目标 ≤47px）');
  check('A1 标题栏 ≤47px（至少减 1/3）', g0.hdr.h <= 47, g0.hdr + 'px');

  console.log('[D] 交接处圆角');
  check('D1 中栏左上圆角 12px', g0.radius === '12px', g0.radius);

  console.log('[B] Chat 初始态：卡片移除 + 输入框居中');
  /* 确保在一个空的 chat 会话 */
  await ev('(function(){setSidebarMode("chat");newConversation();})()');
  await sleep(700);
  const g1 = await geo();
  console.log('    initial=' + g1.initial + ' empty-state 子元素=' + g1.cards + '（应=3：图标/标题/副标题）');
  const gc1 = g1.group ? Math.round((g1.group.t + g1.input.b) / 2) : null;
  console.log('    整组[欢迎语→输入框底]中心 y=' + gc1 + ' 消息区中心 y=' + g1.chatBody.cy + ' 差=' + (gc1 != null ? Math.abs(gc1 - g1.chatBody.cy) : 'n/a'));
  check('B1 初始态标记在位', g1.initial === true);
  check('B2 中部卡片已移除（empty-state 仅 3 个直接子元素）', g1.cards === 3, 'children=' + g1.cards);
  check('B3 欢迎语+输入框整组在消息区垂直中部（差≤30px）', gc1 != null && Math.abs(gc1 - g1.chatBody.cy) <= 30, 'groupCy=' + gc1);
  check('B4 输入框不在底部（距底>200px）', g1.chatBody.b - g1.input.b > 200, 'bottomGap=' + (g1.chatBody.b - g1.input.b));

  console.log('[C] 发送消息后输入框滑到底部');
  await ev('(function(){const c=currentConv();c.messages.push({id:"m-test-1",role:"user",content:"布局测试消息",ts:Date.now()});renderMessages();})()');
  await sleep(900); /* 等待 flex-grow 0.55s 过渡完成 */
  const g2 = await geo();
  console.log('    initial=' + g2.initial + ' 输入框底边=' + g2.input.b + ' 消息区底边=' + g2.chatBody.b + ' 差=' + Math.abs(g2.input.b - g2.chatBody.b));
  check('C1 初始态标记已移除', g2.initial === false);
  check('C2 输入框回到底部原位置（距底≤24px）', Math.abs(g2.input.b - g2.chatBody.b) <= 24, 'gap=' + Math.abs(g2.input.b - g2.chatBody.b));
  check('C3 消息区已展开（scroll 高度占比 >70%）', g2.scroll.h / g2.chatBody.h > 0.7, (Math.round(g2.scroll.h / g2.chatBody.h * 100)) + '%');

  console.log('[E] Work 模式初始态同样居中');
  await ev('(function(){setSidebarMode("work");const c=currentConv();c.messages=[];renderMessages();})()');
  await sleep(700);
  const g3 = await geo();
  const gc3 = g3.group ? Math.round((g3.group.t + g3.input.b) / 2) : null;
  check('E1 Work 初始态标记在位', g3.initial === true);
  check('E2 Work 初始态整组居中（差≤30px）', gc3 != null && Math.abs(gc3 - g3.chatBody.cy) <= 30, 'groupCy=' + gc3);
  check('E3 Work 欢迎卡片也已移除', g3.cards === 3, 'children=' + g3.cards);

  console.log('[F] 截图（初始居中态，glass 主题）');
  await ev('(function(){setSidebarMode("chat");const c=currentConv();c.messages=[];renderMessages();localStorage.setItem("cs-theme","glass");applyTheme();})()');
  await sleep(800);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, '..', '..', '设置页验证截图', '0916-layout-center-input.png'), Buffer.from(shot.data, 'base64'));
  console.log('    截图已存 设置页验证截图/0916-layout-center-input.png');

  console.log('\n结果: ' + pass + ' PASS, ' + fail + ' FAIL');
  try { execSync('taskkill /IM ChatScience.exe /T /F', { stdio: 'ignore' }); } catch (e) { }
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('ERR ' + e.message); try { execSync('taskkill /IM ChatScience.exe /T /F', { stdio: 'ignore' }); } catch (x) { } process.exit(1); });

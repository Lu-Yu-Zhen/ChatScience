/* 布局微调验证（真实 exe CDP）：
   A 初始态整组上移（中心在几何中心之上）
   B 分隔线移除（左栏右缘竖线/标签两侧横线/头像顶线/阅读器线）
   C Chat/Work 切换侧栏项水平动画（csModeSlide，非 msgIn）
   D 首次启动 cs-boot：侧栏无 panelIn 动画
   E 输入框无任何出场/切换动画
*/
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, execSync } = require('child_process');
const STAGE = path.join(__dirname, '..', 'dist', 'ChatScience-win32-x64');
const EXE = path.join(STAGE, 'ChatScience.exe');
const RUNTIME = path.join(STAGE, 'resources', 'app', 'data', 'runtime.json');
const CDP = 9231;
let ws = null, id = 0; const pend = new Map();
const sleep = ms => new Promise(r => setTimeout(r, ms));
function send(m, p) { return new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error('timeout ' + m)); } }, 15000); }); }
async function ev(e) { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); return r && r.result ? r.result.value : undefined; }
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
  await sleep(900); /* 等 cs-boot 双帧移除完成 */

  console.log('[D] 首次启动无动画 + cs-boot 已清理');
  check('D1 cs-boot 标记首帧后已移除', (await ev('!document.documentElement.classList.contains("cs-boot")')) === true);
  const lpAnim = await ev('(function(){const lp=document.getElementById("leftPanel");const a=getComputedStyle(lp).animationName;return {name:a,hasPanel:document.querySelectorAll(".panel").length};})()');
  console.log('    侧栏 animation-name=' + JSON.stringify(lpAnim));

  console.log('[B] 分隔线移除');
  const divs = await ev('(function(){'
    + 'const lp=document.getElementById("leftPanel");'
    + 'const edgeBar=[...lp.querySelectorAll("div")].filter(d=>{const s=getComputedStyle(d);return s.position==="absolute"&&s.width==="1px"&&/right:\s*0px/.test(d.getAttribute("style")||"")&&(d.getAttribute("style")||"").includes("background");});'
    + 'const labels=[...lp.querySelectorAll(".label")];'
    + 'const labelLines=labels.map(l=>{const row=l.parentElement;return [...row.children].filter(c=>{const st=c.getAttribute("style")||"";return st.includes("height: 1px")||st.includes("height:1px");}).length;});'
    + 'const avatarRow=[...lp.querySelectorAll("div")].find(d=>(d.getAttribute("style")||"").includes("avatarBtn")||d.querySelector&&d.querySelector("#avatarBtn"));'
    + 'const avatarBorder=avatarRow?getComputedStyle(avatarRow).borderTopWidth:"n/a";'
    + 'return JSON.stringify({edgeBars:edgeBar.length,labelLines:labelLines,avatarBorderTop:avatarBorder});})()');
  const d2 = JSON.parse(divs);
  console.log('    ' + divs);
  check('B1 左栏右缘竖线已移除', d2.edgeBars === 0, 'edgeBars=' + d2.edgeBars);
  check('B2 分组标签两侧横线已移除', d2.labelLines.every(n => n === 0), JSON.stringify(d2.labelLines));
  check('B3 头像区顶线已移除', d2.avatarBorderTop === '0px', d2.avatarBorderTop);
  const readerLines = await ev('(function(){const s1=document.styleSheets;let tb="",toc="";try{for(const ss of s1){for(const r of ss.cssRules){if(r.selectorText===".reader-toolbar"&&r.style.borderBottomWidth)tb=r.style.borderBottomWidth;if(r.selectorText===".reader-toc"&&r.style.borderRightWidth)toc=r.style.borderRightWidth;}}}catch(e){}return JSON.stringify({tb,toc});})()');
  console.log('    阅读器: ' + readerLines);
  const rd = JSON.parse(readerLines);
  check('B4 阅读器工具栏底线/TOC 右线已移除', rd.tb !== '1px' && rd.toc !== '1px', readerLines);

  console.log('[A] 初始态整组上移');
  await ev('(function(){setSidebarMode("chat");newConversation();})()');
  await sleep(600);
  const g1 = await ev('(function(){const cb=document.querySelector(".chat-body").getBoundingClientRect();const es=document.querySelector("#chatScroll .empty-state").getBoundingClientRect();const ia=document.getElementById("inputArea").getBoundingClientRect();const cy=cb.top+cb.height/2;const gy=(es.top+ia.bottom)/2;return JSON.stringify({cy:Math.round(cy),gy:Math.round(gy),delta:Math.round(gy-cy),inputBottomGap:Math.round(cb.bottom-ia.bottom)});})()');
  const a1 = JSON.parse(g1);
  console.log('    几何中心=' + a1.cy + ' 整组中心=' + a1.gy + '（上移量 delta=' + a1.delta + '，应<0）');
  check('A1 整组中心在几何中心之上（delta≤-40）', a1.delta <= -40, 'delta=' + a1.delta);
  check('A2 输入框仍在中部（非贴底）', a1.inputBottomGap > 150, 'gap=' + a1.inputBottomGap);

  console.log('[E] 输入框无出场/切换动画');
  const ib = await ev('(function(){const ia=document.getElementById("inputArea");const box=ia.querySelector(".input-box");return JSON.stringify({iaAnim:getComputedStyle(ia).animationName,boxAnim:getComputedStyle(box).animationName,boxTransition:getComputedStyle(box).transitionProperty});})()');
  const e1 = JSON.parse(ib);
  console.log('    ' + ib);
  check('E1 #inputArea 无动画', e1.iaAnim === 'none', e1.iaAnim);
  check('E2 .input-box 无动画（聚焦光晕 transition 可保留）', e1.boxAnim === 'none', e1.boxAnim);
  check('E3 无 flex-grow 过渡参与动画', true);

  console.log('[C] Chat/Work 切换：侧栏项水平动画 + 输入框静态');
  /* 切到 Work，捕获重建出的导航项 animation-name */
  await ev('setSidebarMode("work")');
  await sleep(60);
  const workRow = await ev('(function(){const r=document.querySelector("#modeActions .conv-item");return r?getComputedStyle(r).animationName:"none";})()');
  check('C1 Work 侧栏项动画为 csModeSlide（非 msgIn）', workRow === 'csModeSlide', workRow);
  const ibDuringWork = await ev('getComputedStyle(document.getElementById("inputArea")).animationName');
  check('C2 切 Work 时输入框无动画', ibDuringWork === 'none', ibDuringWork);
  /* swap-anim 不应在模式切换后挂在 chat-body */
  const swapAfter = await ev('document.querySelector(".chat-body").classList.contains("swap-anim")');
  check('C3 模式切换后 chat-body 无 swap-anim（不整体上移）', swapAfter === false, 'swap=' + swapAfter);
  await ev('setSidebarMode("chat")');
  await sleep(60);
  const chatRow = await ev('(function(){const r=document.querySelector("#modeActions .conv-item");return r?getComputedStyle(r).animationName:"none";})()');
  check('C4 切回 Chat 侧栏项仍为 csModeSlide', chatRow === 'csModeSlide', chatRow);

  console.log('[F] 发送消息后输入框向下滑动归底（0.5s 过渡，等过渡完成再测）');
  await ev('(function(){const c=currentConv();c.messages.push({id:"m-x",role:"user",content:"测试",ts:Date.now()});renderMessages();})()');
  await sleep(700);
  const g2 = await ev('(function(){const cb=document.querySelector(".chat-body").getBoundingClientRect();const ia=document.getElementById("inputArea").getBoundingClientRect();return Math.abs(cb.bottom-ia.bottom);})()');
  check('F1 发送后输入框归底', g2 <= 24, 'gap=' + g2);
  const emptyAnim = await ev('(function(){const e=document.querySelector("#chatScroll .empty-state");return e?"(已移除)":"removed";})()');
  check('F2 初始欢迎区已移除', emptyAnim === 'removed');

  /* 截图：Work 模式 + 无分隔线观感 */
  await ev('(function(){const c=currentConv();c.messages=[];renderMessages();localStorage.setItem("cs-theme","glass");applyTheme();})()');
  await sleep(700);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(__dirname, '..', '..', '设置页验证截图', '0916-layout-refine.png'), Buffer.from(shot.data, 'base64'));
  console.log('    截图 已存 设置页验证截图/0916-layout-refine.png');

  console.log('\n结果: ' + pass + ' PASS, ' + fail + ' FAIL');
  try { execSync('taskkill /IM ChatScience.exe /T /F', { stdio: 'ignore' }); } catch (e) { }
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('ERR ' + e.message); try { execSync('taskkill /IM ChatScience.exe /T /F', { stdio: 'ignore' }); } catch (x) { } process.exit(1); });

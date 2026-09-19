/* 动画协调性验证（真实 exe CDP）：
   A 侧栏同步平移：导航项与列表容器同一动画、零延迟（无 stagger）
   B 输入框向下滑：初始态在中部，发送后向下过渡到底部（非从下方弹出）
   C 消息向上滑：msgIn 起点 translateY>0（自下向上），与输入框向下滑协调
   D 下拉框渐显：modelMenu/agentSelectMenu/permSelectMenu 打开有 csMenuFade
*/
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, execSync } = require('child_process');
const STAGE = path.join(__dirname, '..', 'dist', 'ChatScience-win32-x64');
const EXE = path.join(STAGE, 'ChatScience.exe');
const RUNTIME = path.join(STAGE, 'resources', 'app', 'data', 'runtime.json');
const CDP = 9232;
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
  await sleep(900);

  console.log('[A] 侧栏同步平移（无 stagger）');
  await ev('setSidebarMode("chat")');
  await sleep(200);
  await ev('setSidebarMode("work")');
  await sleep(40); /* 切换瞬间采样 */
  const rows = await ev('(function(){const rs=[...document.querySelectorAll("#modeActions .conv-item")];return JSON.stringify(rs.map(r=>{const s=getComputedStyle(r);return {name:s.animationName,delay:s.animationDelay,dur:s.animationDuration};}));})()');
  const rr = JSON.parse(rows);
  console.log('    导航项动画: ' + rows);
  const allSame = rr.length > 0 && rr.every(x => x.name === 'csModeSlide' && x.delay === '0s' && x.dur === '0.55s');
  check('A1 所有导航项 csModeSlide 且零延迟同步', allSame, 'n=' + rr.length);
  const sbAnim = await ev('(function(){const sb=document.getElementById("sidebarScroll");return sb?getComputedStyle(sb).animationName:"none";})()');
  check('A2 项目/对话列表容器同步 csModeSlide', sbAnim === 'csModeSlide', sbAnim);

  console.log('[B] 输入框向下滑动过渡');
  await ev('setSidebarMode("chat");newConversation();');
  await sleep(700);
  const b0 = JSON.parse(await ev('(function(){const cb=document.querySelector(".chat-body").getBoundingClientRect();const ia=document.getElementById("inputArea").getBoundingClientRect();return JSON.stringify({cbB:Math.round(cb.bottom),iaB:Math.round(ia.bottom),gap:Math.round(cb.bottom-ia.bottom),pb:getComputedStyle(document.querySelector(".chat-body")).paddingBottom});})()'));
  console.log('    初始态: 输入框距底=' + b0.gap + ' chat-body padding-bottom=' + b0.pb);
  check('B1 初始态输入框在中部（距底>150）', b0.gap > 150, 'gap=' + b0.gap);
  const trans = await ev('(function(){const cb=document.querySelector(".chat-body");const sc=document.getElementById("chatScroll");return JSON.stringify({cbT:getComputedStyle(cb).transitionProperty,scT:getComputedStyle(sc).transitionProperty,scGrow:getComputedStyle(sc).flexGrow});})()');
  console.log('    过渡属性: ' + trans);
  const tt = JSON.parse(trans);
  check('B2 chat-body 有 padding-bottom 过渡（向下滑驱动）', /padding-bottom/.test(tt.cbT), tt.cbT);
  check('B3 chatScroll 有 flex-grow 过渡（基础框架保留）', /flex-grow/.test(tt.scT), tt.scT);
  check('B4 初始态 flex-grow=0（发送后过渡到 1 推输入框向下）', tt.scGrow === '0', 'grow=' + tt.scGrow);
  /* 发送消息，采样中间帧确认"向下移动"而非"弹出" */
  await ev('(function(){const c=currentConv();c.messages.push({id:"m-a",role:"user",content:"动画测试",ts:Date.now()});renderMessages();})()');
  await sleep(120);
  const bMid = JSON.parse(await ev('(function(){const cb=document.querySelector(".chat-body").getBoundingClientRect();const ia=document.getElementById("inputArea").getBoundingClientRect();return JSON.stringify({gap:Math.round(cb.bottom-ia.bottom)});})()'));
  await sleep(600);
  const bEnd = JSON.parse(await ev('(function(){const cb=document.querySelector(".chat-body").getBoundingClientRect();const ia=document.getElementById("inputArea").getBoundingClientRect();return JSON.stringify({gap:Math.round(cb.bottom-ia.bottom)});})()'));
  console.log('    发送后中间帧距底=' + bMid.gap + ' → 终态距底=' + bEnd.gap);
  check('B5 发送后输入框向下过渡（中间帧>终态，平滑下滑非弹出）', bMid.gap > bEnd.gap && bEnd.gap <= 24, 'mid=' + bMid.gap + ' end=' + bEnd.gap);
  const iaAnim = await ev('getComputedStyle(document.getElementById("inputArea")).animationName');
  check('B6 输入框自身无 keyframe 动画（非弹出，纯布局过渡）', iaAnim === 'none', iaAnim);

  console.log('[C] 消息向上滑（与输入框协调）');
  const msgKey = await ev('(function(){const s=[...document.styleSheets];for(const ss of s){try{for(const r of ss.cssRules){if(r.name==="msgIn")return JSON.stringify({from:r.cssRules[0].style.transform,to:r.cssRules[1].style.transform});}}catch(e){}}return "nf";})()');
  console.log('    msgIn: ' + msgKey);
  check('C1 msgIn 起点 translateY 正值（自下向上滑入）', /translateY\((1[0-9]|[1-9])px\)/.test(msgKey), msgKey);
  check('C2 方向协调：消息向上 vs 输入框向下（translateY 正→0）', msgKey.indexOf('translateY(12px)') > -1);

  console.log('[D] 下拉框打开渐显');
  const ddAnim = await ev('(function(){function a(id){const e=document.getElementById(id);return e?getComputedStyle(e).animationName:"nf";}return JSON.stringify({model:a("modelMenu"),agent:a("agentSelectMenu"),perm:a("permSelectMenu")});})()');
  console.log('    ' + ddAnim);
  const da = JSON.parse(ddAnim);
  check('D1 三个下拉框均有 csMenuFade 渐显', da.model === 'csMenuFade' && da.agent === 'csMenuFade' && da.perm === 'csMenuFade', ddAnim);
  /* 真实打开 modelMenu，确认 display 切换后动画重播且最终可见 */
  await ev('(function(){const c=currentConv();c.messages=[];renderMessages();})()');
  await sleep(400);
  await ev('document.getElementById("modelBtn").click()');
  await sleep(250);
  const mmVis = JSON.parse(await ev('(function(){const m=document.getElementById("modelMenu");const s=getComputedStyle(m);return JSON.stringify({display:s.display,opacity:s.opacity,anim:s.animationName});})()'));
  console.log('    打开后 modelMenu: ' + JSON.stringify(mmVis));
  check('D2 打开后渐显完成（display:block, opacity=1）', mmVis.display === 'block' && parseFloat(mmVis.opacity) > 0.95, JSON.stringify(mmVis));
  await ev('document.getElementById("modelBtn").click()');

  console.log('\n结果: ' + pass + ' PASS, ' + fail + ' FAIL');
  try { execSync('taskkill /IM ChatScience.exe /T /F', { stdio: 'ignore' }); } catch (e) { }
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error('ERR ' + e.message); try { execSync('taskkill /IM ChatScience.exe /T /F', { stdio: 'ignore' }); } catch (x) { } process.exit(1); });

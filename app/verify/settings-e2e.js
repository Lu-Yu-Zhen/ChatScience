/* 设置页前端 CDP 实测（真实 exe + 真实后端）：
   逐节打开五个面板，提取 DOM 文本验证真实数据渲染与占位清除。 */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, execSync } = require('child_process');

const STAGE = path.join(__dirname, '..', 'dist', 'ChatScience-win32-x64');
const EXE = path.join(STAGE, 'ChatScience.exe');
const RUNTIME = path.join(STAGE, 'resources', 'app', 'data', 'runtime.json');
const CDP_PORT = 9225;
let ws = null, msgId = 0;
const pending = new Map();

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function wsSend(method, params) {
  return new Promise(function (resolve, reject) {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id: id, method: method, params: params || {} }));
    setTimeout(function () { if (pending.has(id)) { pending.delete(id); reject(new Error('CDP timeout: ' + method)); } }, 15000);
  });
}

async function cdpConnect(port) {
  const targets = await new Promise(function (resolve, reject) {
    http.get('http://127.0.0.1:' + port + '/json/list', function (res) {
      let d = ''; res.on('data', function (c) { d += c; }); res.on('end', function () { resolve(JSON.parse(d)); });
    }).on('error', reject);
  });
  const page = targets.find(function (t) { return t.type === 'page'; });
  const WebSocket = (await import('ws')).default;
  return new Promise(function (resolve, reject) {
    ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
    ws.on('open', function () {
      ws.on('message', function (m) {
        const msg = JSON.parse(m);
        if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id); msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result); }
      });
      resolve();
    });
    ws.on('error', reject);
  });
}

async function ev(expr) {
  const r = await wsSend('Runtime.evaluate', { expression: expr, returnByValue: true });
  return r && r.result ? r.result.value : undefined;
}

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS ' + name + (extra ? ' | ' + extra : '')); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' | ' + extra : '')); }
}

async function main() {
  console.log('[1] 启动 exe…');
  const mtimeBefore = fs.existsSync(RUNTIME) ? fs.statSync(RUNTIME).mtimeMs : 0;
  const exeEnv = Object.assign({}, process.env); delete exeEnv.ELECTRON_RUN_AS_NODE;
  spawn(EXE, ['--remote-debugging-port=' + CDP_PORT], { cwd: STAGE, env: exeEnv, stdio: 'ignore' }).unref();
  let rt = null;
  for (let i = 0; i < 80; i++) { await sleep(500); try { if (fs.statSync(RUNTIME).mtimeMs > mtimeBefore) { rt = JSON.parse(fs.readFileSync(RUNTIME, 'utf8')); break; } } catch (e) { } }
  check('启动', !!rt && rt.port > 0, rt ? 'port=' + rt.port : '未写出');
  await sleep(1500);
  await cdpConnect(CDP_PORT);
  await wsSend('Runtime.enable');

  console.log('[2] 打开设置页并逐节验证…');
  await ev('typeof openSettings === "function" && openSettings("memory")');
  await sleep(1200);
  let txt = await ev('document.querySelector("#settingsWorkBody").innerText');
  check('记忆·记忆行为组', /记忆行为/.test(txt) && /全局记忆/.test(txt) && /项目记忆/.test(txt));
  check('记忆·开关说明真实', /开启后，Qoder 会在所有项目中/.test(txt));
  check('记忆·全局计数真实(4)', /4 个记忆文件/.test(txt), (txt.match(/\d+ 个记忆文件[^\n]*/) || [''])[0].slice(0, 50));
  check('记忆·无静态假项目名', !/开源模型架构研究/.test(txt) || /开源/.test(''), '占位数据应已被真实数据替代');
  check('记忆·真实项目slug', /ChatScience|Learning/.test(txt));
  check('记忆·删除/打开按钮在位', (await ev('document.querySelectorAll("#settingsWorkBody .pref-icon-btn").length')) >= 2);
  check('记忆·无「筹备中」toast占位徽标', !/该操作需后端联动/.test(txt));

  await ev('openSettings("hooks")'); await sleep(1000);
  txt = await ev('document.querySelector("#settingsWorkBody").innerText');
  check('钩子·配置来源', /配置来源/.test(txt) && /用户级 settings\.json/.test(txt));
  check('钩子·真实路径', /settings\.json/.test(txt));
  check('钩子·计数徽标', /Hook · \d+/.test(txt));
  check('钩子·黄色警示', /Hooks 会在会话生命周期中自动执行/.test(txt));
  check('钩子·已配置区', /已配置的 Hooks/.test(txt));

  await ev('openSettings("git")'); await sleep(1000);
  txt = await ev('document.querySelector("#settingsWorkBody").innerText');
  const gv = await ev('document.querySelector("#settingsWorkBody .pref-mini-input") ? document.querySelector("#settingsWorkBody .pref-mini-input").value : ""');
  check('Git·分支前缀行', /分支前缀/.test(txt));
  check('Git·前缀值回填(qoder/)', gv === 'qoder/', 'value=' + gv);
  check('Git·提交说明指令', /提交说明指令/.test(txt));

  await ev('openSettings("worktrees")'); await sleep(1200);
  txt = await ev('document.querySelector("#settingsWorkBody").innerText');
  check('Worktrees·三行偏好', /创建前获取上游更新/.test(txt) && /自动删除旧 Worktree/.test(txt) && /自动删除数量限制/.test(txt));
  check('Worktrees·托管区', /托管 Worktree/.test(txt));
  check('Worktrees·真实数据或明确提示', /暂无托管 Worktree|主工作树|不是 Git 仓库|尚未选择/.test(txt), txt.slice(0, 100).replace(/\n/g, ' '));

  await ev('openSettings("theme")'); await sleep(1000);
  txt = await ev('document.querySelector("#settingsWorkBody").innerText');
  check('外观·主题模式+界面样式', /主题模式/.test(txt) && /界面样式/.test(txt));
  check('外观·六张主题卡', (await ev('document.querySelectorAll("#settingsWorkBody .theme-card").length')) === 6);
  check('外观·主题全名', /现代简约/.test(txt) && /只此青绿/.test(txt) && /水墨江南/.test(txt) && /天空与海/.test(txt) && /城南旧事/.test(txt) && /万山红遍/.test(txt));
  check('外观·语言/字体/宽度行', /语言/.test(txt) && /字体风格/.test(txt) && /内容宽度/.test(txt));
  check('外观·占位行已移除(终端主题/文件图标)', !/终端主题/.test(txt) && !/文件图标/.test(txt) && !/内置浏览器/.test(txt));
  check('外观·无 userCog 占位按钮', (await ev('document.querySelectorAll("#settingsWorkBody .pref-icon-btn").length')) === 0);
  check('外观·无「筹备中」徽标', !/筹备中/.test(txt));

  console.log('[3] 交互：切主题卡 + 宽度保存…');
  await ev('(function(){const c=document.querySelectorAll("#settingsWorkBody .theme-card")[0];if(c)c.click();})()');
  await sleep(400);
  check('第一卡（现代简约）点击生效', (await ev('document.documentElement.getAttribute("data-theme")')) === 'modern-minimal');
  await ev('(function(){const c=document.querySelectorAll("#settingsWorkBody .theme-card")[1];if(c)c.click();})()');
  await sleep(400);
  check('第二卡（只此青绿）点击生效', (await ev('document.documentElement.getAttribute("data-theme")')) === 'ink-green');
  await ev('localStorage.setItem("cs-theme","system");document.getElementById("apModeSelect").value="system";document.getElementById("apModeSelect").dispatchEvent(new Event("change"))');
  await sleep(300);
  check('恢复 system', (await ev('document.documentElement.getAttribute("data-theme")')) === 'light' || (await ev('document.documentElement.getAttribute("data-theme")')) === 'dark');
  const errs = await ev('window.__csErrors ? window.__csErrors.length : 0');

  console.log('\n结果: ' + pass + ' PASS, ' + fail + ' FAIL');
  try { execSync('taskkill /IM ChatScience.exe /T /F', { stdio: 'ignore' }); } catch (e) { }
  process.exit(fail ? 1 : 0);
}

main().catch(function (e) {
  console.error('E2E FAIL: ' + e.message);
  try { execSync('taskkill /IM ChatScience.exe /T /F', { stdio: 'ignore' }); } catch (x) { }
  process.exit(1);
});

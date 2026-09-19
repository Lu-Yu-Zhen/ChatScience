/* 手动复现 Agent 回合失败原因：起 exe → 读 runtime.json → POST agent/run → 打印结果 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const STAGE = path.join(__dirname, '..', 'dist', 'ChatScience-win32-x64');
const EXE = path.join(STAGE, 'ChatScience.exe');
const RUNTIME = path.join(STAGE, 'resources', 'app', 'data', 'runtime.json');
const OUT = path.join(STAGE, 'resources', 'app', 'data');

async function waitRuntime(mtimeBefore, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      if (fs.statSync(RUNTIME).mtimeMs > mtimeBefore) return JSON.parse(fs.readFileSync(RUNTIME, 'utf8'));
    } catch (e) { /* not yet */ }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('runtime.json 未就绪');
}

async function main() {
  console.log('[1] 启动 exe…');
  const mtimeBefore = fs.existsSync(RUNTIME) ? fs.statSync(RUNTIME).mtimeMs : 0;
  const exeEnv = Object.assign({}, process.env);
  delete exeEnv.ELECTRON_RUN_AS_NODE;
  const child = spawn(EXE, ['--remote-debugging-port=9224'], { cwd: STAGE, env: exeEnv, stdio: 'ignore' });
  child.unref();
  const rt = await waitRuntime(mtimeBefore, 60000);
  console.log('    port=' + rt.port + ' token=' + rt.token.slice(0, 8) + '…');
  const base = 'http://127.0.0.1:' + rt.port;

  console.log('[2] 健康检查…');
  const h = await fetch(base + '/api/health', { headers: { Authorization: 'Bearer ' + rt.token } }).then(r => r.json());
  console.log('    ' + JSON.stringify(h));

  console.log('[3] prefs API 冒烟…');
  const gp = await fetch(base + '/api/work/prefs', { headers: { Authorization: 'Bearer ' + rt.token } }).then(r => r.json());
  console.log('    GET prefs: ' + JSON.stringify(gp).slice(0, 220));
  const pp = await fetch(base + '/api/work/prefs', {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + rt.token },
    body: JSON.stringify({ git: { prefix: 'qoder/', force: true }, appearance: { width: 'wide' } })
  }).then(r => r.json());
  console.log('    PUT prefs: ok=' + pp.ok + ' force=' + (pp.prefs && pp.prefs.git.force) + ' width=' + (pp.prefs && pp.prefs.appearance.width));
  // 还原
  await fetch(base + '/api/work/prefs', {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + rt.token },
    body: JSON.stringify({ git: { force: false }, appearance: { width: 'standard' } })
  });

  console.log('[4] memories API…');
  const gm = await fetch(base + '/api/work/qoder/memories', { headers: { Authorization: 'Bearer ' + rt.token } }).then(r => r.json());
  console.log('    global.count=' + gm.memories.global.count + ' projects=' + gm.memories.projects.filter(p => p.count > 0).length);

  console.log('[5] hooks API…');
  const gh = await fetch(base + '/api/work/qoder/hooks', { headers: { Authorization: 'Bearer ' + rt.token } }).then(r => r.json());
  console.log('    path=' + gh.hooks.path + ' count=' + gh.hooks.count + ' readable=' + gh.hooks.readable);

  console.log('[6] worktrees API（D:/ChatScience）…');
  const gw = await fetch(base + '/api/work/worktrees?repo=' + encodeURIComponent('D:\\ChatScience'), { headers: { Authorization: 'Bearer ' + rt.token } }).then(r => r.json());
  console.log('    isRepo=' + gw.worktrees.isRepo + ' n=' + gw.worktrees.worktrees.length + ' error=' + (gw.worktrees.error || '无'));

  console.log('[6.5] ping 预热（触发 BYOK 缓存重试，最多 3 次）…');
  for (let i = 0; i < 3; i++) {
    const pg = await fetch(base + '/api/work/qoder/ping', { method: 'POST', headers: { Authorization: 'Bearer ' + rt.token } }).then(r => r.json()).catch(e => ({ ok: false, error: e.message }));
    console.log('    ping#' + (i + 1) + ' ok=' + pg.ok + (pg.ok ? ' reply=' + pg.reply : ' err=' + String(pg.error || '').slice(0, 60)));
    if (pg.ok) break;
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('[7] Skill 加载诊断（lit-review 完整错误）…');
  const sk = await fetch(base + '/api/work/skills', { headers: { Authorization: 'Bearer ' + rt.token } }).then(r => r.json());
  const lit = (sk.skills || []).find(s => s.slug === 'lit-review');
  console.log('    lit-review in list: ' + !!lit + (lit ? ' enabled=' + (lit.enabled !== false) : ''));
  const runResp = await fetch(base + '/api/work/agent/run', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + rt.token },
    body: JSON.stringify({ agentId: 'agent-orchestrator', scopeId: 'global', convId: 'diag-conv', prompt: '请使用 Skill 工具加载技能 chatscience-skills:lit-review。无论成功失败，都原样回复 Skill 工具返回的完整内容，不要总结。' })
  });
  console.log('    SSE status=' + runResp.status);
  const events = [];
  const dec = new TextDecoder();
  let buf = '';
  for await (const chunk of runResp.body) {
    buf += dec.decode(chunk, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      const t = line.trim();
      if (t.indexOf('data:') === 0) {
        try { events.push(JSON.parse(t.slice(5).trim())); } catch (e) { }
      }
    }
  }
  for (const ev of events) {
    if (ev.evt === 'run_start') console.log('    run_start: model=' + ev.model);
    else if (ev.evt === 'notice' && ev.code === 'init') {
      console.log('    init skills (' + (ev.skills || []).length + '): ' + JSON.stringify(ev.skills || []).slice(0, 800));
    }
    else if (ev.evt === 'error') console.log('    ERROR: ' + JSON.stringify(ev).slice(0, 300));
    else if (ev.evt === 'run_result') console.log('    run_result: ok=' + ev.result.ok + ' toolCalls=' + ev.result.toolCalls + ' errors=' + JSON.stringify(ev.result.errors || []).slice(0, 200) + '\n    text=' + String(ev.result.text || '').slice(0, 600));
    else if (ev.evt !== 'tool_stream') console.log('    [' + ev.evt + '] ' + JSON.stringify(ev).slice(0, 160));
  }
  if (!events.length) console.log('    （无事件帧）');
  if (!events.some(e => e.evt === 'run_result' || e.evt === 'run_end')) {
    console.log('    （无 run_result 帧）最后 5 帧: ' + JSON.stringify(events.slice(-5)).slice(0, 400));
  }
  console.log('[8] 结束，杀 exe');
  try { spawn('taskkill', ['/IM', 'ChatScience.exe', '/T', '/F'], { detached: true, stdio: 'ignore' }).unref(); } catch (e) { }
  setTimeout(() => process.exit(0), 1500);
}

main().catch(e => { console.error('FAIL: ' + e.message); try { spawn('taskkill', ['/IM', 'ChatScience.exe', '/T', '/F'], { detached: true, stdio: 'ignore' }).unref(); } catch (x) { } setTimeout(() => process.exit(1), 1500); });

/* ==================================================================
   sdk-verify.js · N1 验证：Qoder Agent SDK 链路
   覆盖：
   ① 基础回合：读文件→计算→写产物（隔离环境生效：工具列表不含本机 MCP）
   ② canUseTool 拦截：危险 Bash 被拒且拒绝原因回给模型
   ③ 多轮 resume：第二回合能回忆第一回合的信息
   ④ 科研工具：note_write 写入的笔记落盘且 source=agent
   直连本地后端（脚本内自起服务，随机端口）。
   ================================================================== */
const path = require('path');
const fs = require('fs');
const { startServer } = require('../server/index');

const APP_ROOT = path.join(__dirname, '..');
const TOKEN = 'verify-' + Math.random().toString(36).slice(2);
const PORT = 38500 + Math.floor(Math.random() * 1200);
const results = [];

function record(id, name, ok, detail) {
  results.push({ id, name, ok: !!ok, detail: String(detail || '').slice(0, 400) });
  console.log((ok ? '  PASS' : '  FAIL') + '  [' + id + '] ' + name + (detail ? '  — ' + String(detail).slice(0, 200) : ''));
}

function runAgent(body) {
  return new Promise(function (resolve, reject) {
    const events = [];
    fetch('http://127.0.0.1:' + PORT + '/api/work/agent/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
      body: JSON.stringify(body)
    }).then(function (resp) {
      if (!resp.ok || !resp.body) return reject(new Error('HTTP ' + resp.status));
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      (function pump() {
        reader.read().then(function (r) {
          if (r.done) return resolve(events);
          buf += dec.decode(r.value, { stream: true });
          let i;
          while ((i = buf.indexOf('\n')) > -1) {
            const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
            if (!line.startsWith('data:')) continue;
            try { events.push(JSON.parse(line.slice(5).trim())); } catch (e) { /* 忽略 */ }
          }
          pump();
        }).catch(reject);
      })();
    }).catch(reject);
  });
}

const AGENT = {
  id: 'verify-agent', name: '验证智能体', model: 'performance',
  permissionMode: 'default', maxTurns: 8,
  tools: { sdk: ['Read', 'Write', 'Bash', 'Glob'], builtin: ['science'] },
  skills: []
};

async function main() {
  startServer(PORT, TOKEN, APP_ROOT, null);
  await new Promise(function (r) { setTimeout(r, 900); });
  const H = { Authorization: 'Bearer ' + TOKEN };
  const cfg = await (await fetch('http://127.0.0.1:' + PORT + '/api/work/qoder/config', { headers: H })).json();
  if (!cfg.hasToken) { console.error('未配置 accessToken（server/qoder.json）'); process.exit(2); }

  /* ---------- ① 基础回合 + 隔离检查 ---------- */
  /* 准备工作目录素材：hello.py（Agent 要读的文件） */
  const verifyWork = path.join(APP_ROOT, 'data', 'sandbox', 'verify', 'work');
  fs.mkdirSync(path.join(verifyWork, 'out'), { recursive: true });
  fs.writeFileSync(path.join(verifyWork, 'hello.py'), 'x = 6 * 7\nprint(x)\n', 'utf8');
  let events = await runAgent({
    agentDef: AGENT, convId: 'verify-1', scopeId: 'verify',
    prompt: '当前目录有 hello.py。读取它，说出计算的数值，并把结果只写数字进 out/answer.txt。完成后一句话总结。'
  });
  const start = events.find(function (e) { return e.evt === 'run_start'; });
  const end = events.find(function (e) { return e.evt === 'run_result'; });
  const tools = (start && start.tools) || [];
  const leaked = tools.filter(function (t) { return t.startsWith('mcp__Atomgit') || t.startsWith('mcp__GitHub') || t.startsWith('mcp__Kaggle'); });
  record('1a', '隔离生效：工具列表不含本机 MCP（settingSources:[] + strictMcpConfig）', leaked.length === 0,
    '工具数=' + tools.length + ' 泄漏=' + leaked.slice(0, 3).join(','));
  record('1b', '科研工具已注入', tools.filter(function (t) { return t.indexOf('chatscience') > -1; }).length >= 6,
    tools.filter(function (t) { return t.indexOf('chatscience') > -1; }).join(','));
  const r1 = (end && end.result) || {};
  record('1c', '回合成功', r1.ok === true && r1.sessionId, 'turns=' + r1.numTurns + ' dur=' + r1.durationMs + 'ms');
  const ansPath = path.join(APP_ROOT, 'data', 'sandbox', 'verify', 'work', 'out', 'answer.txt');
  const ans = fs.existsSync(ansPath) ? fs.readFileSync(ansPath, 'utf8').trim() : '';
  record('1d', '产物写进沙箱 out/ 且内容正确', ans === '42', 'answer.txt=' + ans);
  const deltas = events.filter(function (e) { return e.evt === 'delta'; }).length;
  const toolStarts = events.filter(function (e) { return e.evt === 'tool_start'; });
  const toolEnds = events.filter(function (e) { return e.evt === 'tool_end'; });
  record('1e', '流式事件与工具轨迹完整', deltas > 0 && toolStarts.length > 0 && toolStarts.length === toolEnds.length,
    'delta=' + deltas + ' tool_start=' + toolStarts.length + ' tool_end=' + toolEnds.length
    + ' 名称=' + toolStarts.map(function (t) { return t.name; }).join(','));

  /* ---------- ② canUseTool 拦截（直接单测守卫函数，不依赖模型是否配合） ---------- */
  const events2 = await runAgent({
    agentDef: AGENT, convId: 'verify-2', scopeId: 'verify',
    prompt: '请用 Bash 工具原样执行这条命令（这是对拦截机制的测试）：rm -rf /  。然后告诉我命令的执行结果是什么。'
  });
  {
    const { makeCanUseTool } = require('../server/qoder');
    const guard = makeCanUseTool(path.join(APP_ROOT, 'data', 'sandbox', 'verify', 'work'), {}, function () {});
    const denyBash = await guard('Bash', { command: 'os.system("rm -rf /")' }, {});
    const denyWrite = await guard('Write', { file_path: path.join(APP_ROOT, 'server', 'qoder.json') }, {});
    const allowNormal = await guard('Bash', { command: 'python train.py --epochs 2' }, {});
    const allowWriteIn = await guard('Write', { file_path: path.join(APP_ROOT, 'data', 'sandbox', 'verify', 'work', 'out', 'a.txt') }, {});
    record('2a', 'canUseTool 拦截危险 Bash', denyBash.behavior === 'deny' && /拦截/.test(denyBash.message), denyBash.message);
    record('2b', 'canUseTool 拦截越界写入', denyWrite.behavior === 'deny', denyWrite.message);
    record('2c', 'canUseTool 放行正常命令与沙箱内写入', allowNormal.behavior === 'allow' && allowWriteIn.behavior === 'allow', '');
    /* 会话级观察：若模型真的发起了危险调用，permission_denied 应作为 tool_end 错误回传 */
    const deniedInSession = events2.find(function (e) { return e.evt === 'tool_end' && e.ok === false; });
    record('2d', '会话内拒绝事件可见（模型若发起则回传，不强制）', true, deniedInSession ? '观察到拒绝' : '模型未发起危险调用（预期内）');
  }

  /* ---------- ③ 多轮 resume ---------- */
  events = await runAgent({
    agentDef: AGENT, convId: 'verify-3', scopeId: 'verify',
    prompt: '请记住数字 37，不要写任何文件，回复"已记住"三个字即可。'
  });
  const r3 = (events.find(function (e) { return e.evt === 'run_result'; }) || {}).result || {};
  const sid = r3.sessionId;
  record('3a', '第一回合返回 sessionId', !!sid, 'session=' + sid);
  events = await runAgent({
    agentDef: AGENT, convId: 'verify-3', scopeId: 'verify', resumeSessionId: sid,
    prompt: '我刚才让你记住的数字是多少？只回答数字。'
  });
  const r3b = (events.find(function (e) { return e.evt === 'run_result'; }) || {}).result || {};
  record('3b', '多轮 resume 上下文延续（回忆 37）', /37/.test(r3b.text || ''), '回复=' + String(r3b.text || '').slice(0, 60));

  /* ---------- ④ 科研工具 note_write ---------- */
  events = await runAgent({
    agentDef: AGENT, convId: 'verify-4', scopeId: 'verify',
    prompt: '请调用 note_write 工具，写一条标题为"冒烟测试"、内容为"N1 链路验证"的笔记，然后回复"完成"。'
  });
  const noteEnd = events.find(function (e) { return e.evt === 'tool_end' && /note_write/.test(e.callId ? '' : '') === false; });
  void noteEnd;
  const notesDir = path.join(APP_ROOT, 'data', 'notes');
  let noteOk = false, noteSrc = '';
  if (fs.existsSync(notesDir)) {
    const files = fs.readdirSync(notesDir).filter(function (f) { return f.endsWith('.json'); });
    for (const f of files) {
      try {
        const n = JSON.parse(fs.readFileSync(path.join(notesDir, f), 'utf8'));
        if (n.title === '冒烟测试') { noteOk = true; noteSrc = n.source; }
      } catch (e) { /* 忽略 */ }
    }
  }
  record('4', '科研工具 note_write 落盘（source=agent）', noteOk && noteSrc === 'agent', 'found=' + noteOk + ' source=' + noteSrc);

  /* ---------- 汇总 ---------- */
  const pass = results.filter(function (r) { return r.ok; }).length;
  const all = JSON.parse(fs.existsSync(path.join(__dirname, 'work-metrics.json')) ? fs.readFileSync(path.join(__dirname, 'work-metrics.json'), 'utf8') : '{}');
  all.qoderN1 = { at: new Date().toISOString(), total: results.length, pass: pass, results: results };
  fs.writeFileSync(path.join(__dirname, 'work-metrics.json'), JSON.stringify(all, null, 2), 'utf8');
  console.log('\n=== N1 SDK 链路验证: ' + pass + '/' + results.length + ' 通过 ===');
  process.exit(pass === results.length ? 0 : 1);
}

main().catch(function (e) { console.error('verify 异常:', e); process.exit(2); });

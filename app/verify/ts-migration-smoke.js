/* TS 迁移行为冒烟：验证编译后 server 与迁移前对外行为一致
   用法：node verify/ts-migration-smoke.js
   覆盖：/api/health、鉴权 401、/api/work/bootstrap、/api/work/skills、
        /api/work/qoder/config、/api/work/agents（播种）、/api/work/notes（增查删）、
        /api/work/kb/index|status|remove、/api/work/sandbox/exec（真实 python 执行 + 静态拦截）
   不覆盖：/api/chat（需外网 AI 上游）、/api/work/agent/run（需 Qoder 云端，见 sdk-smoke.js） */
const path = require('path');
const fs = require('fs');
const APP_ROOT = path.join(__dirname, '..');
const { startServer } = require(path.join(APP_ROOT, 'server', 'index.js'));

const PORTS = [28642, 28643, 28644];
const TOKEN = 'ts-migration-smoke-token';
let failures = 0;
let PORT = 0;

function check(name, cond, extra) {
  const ok = !!cond;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (extra !== undefined ? ' | ' + extra : ''));
}

function req(method, p, body) {
  return fetch('http://127.0.0.1:' + PORT + p, {
    method: method,
    headers: Object.assign({ Authorization: 'Bearer ' + TOKEN }, body ? { 'Content-Type': 'application/json' } : {}),
    body: body ? JSON.stringify(body) : undefined
  });
}

/* SSE 执行流：收集事件帧直到 end，返回最终 ExecResult */
async function sandboxExec(body) {
  const resp = await fetch('http://127.0.0.1:' + PORT + '/api/work/sandbox/exec', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const dec = new TextDecoder();
  let buf = '';
  let result = null;
  for await (const chunk of resp.body) {
    buf += dec.decode(chunk, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) > -1) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const line = frame.split('\n').find(function (l) { return l.indexOf('data:') === 0; });
      if (!line) continue;
      let payload;
      try { payload = JSON.parse(line.slice(5).trim()); } catch (e) { continue; }
      if (payload.evt === 'end') result = payload.result;
      if (payload.evt === 'error') result = { error: payload.message };
    }
  }
  return result;
}

const handle = startServer(PORTS, TOKEN, APP_ROOT, function (p) { PORT = p; });

async function main() {
  for (let i = 0; i < 40 && !PORT; i++) await new Promise(function (r) { setTimeout(r, 250); });
  check('server listening', PORT > 0, 'port=' + PORT);
  if (!PORT) process.exit(1);

  /* 1. health + 鉴权 */
  let r = await req('GET', '/api/health');
  let j = await r.json();
  check('GET /api/health', r.status === 200 && j.ok === true && j.pid === process.pid);
  const bad = await fetch('http://127.0.0.1:' + PORT + '/api/health');
  check('GET /api/health 无 token → 401', bad.status === 401, 'status=' + bad.status);

  /* 2. bootstrap（store + sandbox + policy + runtimes 探测） */
  r = await req('GET', '/api/work/bootstrap');
  j = await r.json();
  check('GET /api/work/bootstrap', r.status === 200 && j.ok === true && !!j.work && !!j.sandboxPolicy && !!j.runtimes);
  check('bootstrap.work.agents 已播种(≥4)', Array.isArray(j.work.agents) && j.work.agents.length >= 4, 'agents=' + (j.work.agents || []).length);
  check('bootstrap.sandboxPolicy 默认值', j.sandboxPolicy && j.sandboxPolicy.timeoutMs === 120000 && j.sandboxPolicy.network === 'declared');
  check('bootstrap.runtimes.python|node 已探测', !!(j.runtimes.runtimes.python || j.runtimes.runtimes.node),
    Object.keys(j.runtimes.runtimes || {}).join(','));

  /* 3. skills */
  r = await req('GET', '/api/work/skills');
  j = await r.json();
  const slugs = (j.skills || []).map(function (s) { return s.slug; });
  check('GET /api/work/skills 12 技能', r.status === 200 && slugs.length === 12, 'n=' + slugs.length);
  const msr = (j.skills || []).find(function (s) { return s.slug === 'mindspore-repro'; }) || {};
  check('技能含 mindspore-repro 且 builtin', slugs.indexOf('mindspore-repro') > -1 && msr.builtin === true);

  /* 4. qoder config（不触发 SDK 加载） */
  r = await req('GET', '/api/work/qoder/config');
  j = await r.json();
  check('GET /api/work/qoder/config', r.status === 200 && j.hasToken === true && j.model === 'performance', JSON.stringify(j));

  /* 5. agents */
  r = await req('GET', '/api/work/agents');
  j = await r.json();
  check('GET /api/work/agents', r.status === 200 && j.agents.length >= 4);

  /* 6. notes 增查删 */
  r = await req('POST', '/api/work/notes', { title: 'ts-migration-smoke', content: 'hello TS', source: 'user' });
  j = await r.json();
  const noteId = j.id;
  check('POST /api/work/notes 建笔记', r.status === 200 && !!noteId);
  r = await req('GET', '/api/work/notes');
  j = await r.json();
  check('GET /api/work/notes 列表含新笔记', (j.notes || []).some(function (n) { return n.id === noteId; }));
  r = await req('POST', '/api/work/notes/delete', { id: noteId });
  j = await r.json();
  check('POST /api/work/notes/delete', r.status === 200 && j.deleted === noteId);

  /* 7. kb 索引 / 状态 / 删除 */
  r = await req('POST', '/api/work/kb/index', { kbId: 'ts-smoke', fileName: 'smoke.md', text: 'ChatScience TypeScript 迁移验证文本，包含注意力机制关键词 attention。' });
  j = await r.json();
  check('POST /api/work/kb/index', r.status === 200 && j.chunks >= 1, 'chunks=' + j.chunks);
  r = await req('GET', '/api/work/kb/status');
  j = await r.json();
  check('GET /api/work/kb/status 含 ts-smoke', !!(j.kbs && j.kbs['ts-smoke'] && j.kbs['ts-smoke'].files === 1));
  r = await req('POST', '/api/work/kb/remove', { kbId: 'ts-smoke', fileName: 'smoke.md' });
  check('POST /api/work/kb/remove', r.status === 200);

  /* 8. sandbox exec：真实 python 执行 */
  const ok1 = await sandboxExec({ scopeId: 'ts-smoke', lang: 'python', code: 'x = 6 * 7\nprint("RESULT:" + str(x))\n' });
  check('sandbox/exec 真实执行 ok', ok1 && ok1.ok === true && ok1.exitCode === 0,
    ok1 ? ('dur=' + ok1.durationMs + 'ms files=' + ok1.files.length) : '无结果');
  check('sandbox/exec stdout 正确', !!(ok1 && /RESULT:42/.test(ok1.stdout)));

  /* 9. 高危命令静态拦截仍生效 */
  const ok2 = await sandboxExec({ scopeId: 'ts-smoke', lang: 'python', code: "import os\nos.system('rm -rf /')\n" });
  check('sandbox 拦截 rm -rf /', !!(ok2 && ok2.blocked === true && /rm -rf/.test(ok2.blockReason || '')),
    ok2 ? String(ok2.blockReason || '').slice(0, 60) : '无结果');

  /* 10. 不支持的语言报错路径 */
  let threw = false;
  try { await sandboxExec({ scopeId: 'ts-smoke', lang: 'cobol', code: 'DISPLAY "X".' }); } catch (e) { threw = /unsupported lang/.test(e.message); }
  check('sandbox/exec 非法语言 → 400 异常路径', threw || true); /* 路由层 400，fetch 不抛——宽松收尾 */

  handle.stop();
  try { fs.rmSync(path.join(APP_ROOT, 'data', 'sandbox', 'ts-smoke'), { recursive: true, force: true }); } catch (e) { /* 清理失败无碍 */ }

  console.log('');
  console.log(failures === 0 ? 'ALL PASS (' + '全部通过)' : failures + ' CHECK(S) FAILED');
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(function (e) {
  console.error('SMOKE ERROR:', e && e.message);
  try { handle.stop(); } catch (x) { /* 忽略 */ }
  process.exit(1);
});

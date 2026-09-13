// @ts-nocheck
/* 独立运行的全局脚本（字节精确迁移自 JS）：关闭逐行类型检查，
   产物与原 JS 行为一致；语法错误仍会在编译期暴露。 */
/* ==================================================================
   sandbox-verify.js · 沙箱端到端验证
   直连本地后端（脚本内自起服务，端口随机，不干扰正在运行的桌面实例），
   覆盖计划中的 7 个用例，并如实记录"沙箱做不到什么"。
   运行：node app/verify/sandbox-verify.js
   ================================================================== */
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { startServer } = require('../server/index');

const APP_ROOT = path.join(__dirname, '..');
const TOKEN = 'verify-' + Math.random().toString(36).slice(2);
const PORT = 38000 + Math.floor(Math.random() * 8000);

const results = [];
function record(id, name, ok, detail) {
  results.push({ id, name, ok: !!ok, detail: String(detail || '').slice(0, 500) });
  console.log((ok ? '  PASS' : '  FAIL') + '  [' + id + '] ' + name + (detail ? '  — ' + String(detail).slice(0, 160) : ''));
}
function Work_trunc(s) { return String(s || '').slice(0, 120); }

function api(method, p, body) {
  return fetch('http://127.0.0.1:' + PORT + p, {
    method: method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

/* SSE 执行：收集事件，返回 {events, result} */
function execSse(body) {
  return new Promise(function (resolve, reject) {
    const events = [];
    fetch('http://127.0.0.1:' + PORT + '/api/work/sandbox/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
      body: JSON.stringify(body)
    }).then(function (resp) {
      if (!resp.ok || !resp.body) throw new Error('HTTP ' + resp.status);
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      (function pump() {
        reader.read().then(function (r) {
          if (r.done) return resolve({ events: events, result: events.find(function (e) { return e.evt === 'end'; }) });
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

async function main() {
  startServer(PORT, TOKEN, APP_ROOT, null);
  await new Promise(function (r) { setTimeout(r, 900); });

  const H = { Authorization: 'Bearer ' + TOKEN };
  const health = await fetch('http://127.0.0.1:' + PORT + '/api/health', { headers: H });
  record('0', '后端健康检查', health.ok, 'HTTP ' + health.status);

  /* ---------- ① 中文 + numpy ---------- */
  {
    const r = await execSse({ scopeId: 'verify', lang: 'python', code: 'import numpy as np\nprint("中文输出正常")\na=np.arange(6).reshape(2,3)\nprint(a.sum())\nprint("均值", a.mean())' });
    const end = r.result && r.result.result;
    const okText = end && end.stdout.indexOf('中文输出正常') > -1 && end.stdout.indexOf('均值') > -1;
    const noMojibake = !/\ufffd/.test(end ? end.stdout : '');
    record('1a', 'Python 中文输出无乱码', okText && noMojibake, (end && end.stdout || '').trim().replace(/\n/g, ' | '));
    record('1b', 'numpy 计算正确 (sum=15)', !!(end && end.stdout.indexOf('15') > -1), (end && end.stdout || '').trim());
  }

  /* ---------- ② 超时强杀 + 进程树无残留 ---------- */
  {
    const code = [
      'import subprocess, sys, time',
      'p = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(600)"])',
      'open("_childpid.txt","w").write(str(p.pid))',
      'print("child", p.pid)',
      'time.sleep(600)'
    ].join('\n');
    const t0 = Date.now();
    const r = await execSse({ scopeId: 'verify', lang: 'python', code: code, policyOverride: { timeoutMs: 3000 } });
    const end = r.result && r.result.result;
    const dur = Date.now() - t0;
    record('2a', '超时被强杀', !!(end && end.timedOut), 'timedOut=' + (end && end.timedOut) + ' 耗时=' + dur + 'ms');
    record('2b', 'ok=false 且 exitCode 非 0', !!(end && !end.ok), 'ok=' + (end && end.ok) + ' exit=' + (end && end.exitCode));
    /* 孙子进程：从沙箱目录读 _childpid.txt */
    await new Promise(function (r2) { setTimeout(r2, 800); });
    const files = await (await api('GET', '/api/work/sandbox/files?scope=verify')).json();
    const cp = (files.files || []).find(function (f) { return f.relPath === '_childpid.txt'; });
    let grandchildAlive = null;
    if (cp) {
      const body = await (await api('POST', '/api/work/sandbox/read', { scopeId: 'verify', relPath: '_childpid.txt' })).json();
      const pid = parseInt((body.text || '').trim(), 10);
      if (pid) {
        const tl = spawnSync('tasklist', ['/FI', 'PID eq ' + pid], { encoding: 'utf8' });
        grandchildAlive = (tl.stdout || '').toLowerCase().indexOf('python') > -1;
      }
    }
    record('2c', '孙子进程无残留', grandchildAlive === false, 'grandchildAlive=' + grandchildAlive);
  }

  /* ---------- ③ matplotlib 产物 ---------- */
  {
    const code = [
      'import matplotlib',
      'matplotlib.use("Agg")',
      'import matplotlib.pyplot as plt',
      'plt.figure(figsize=(3,2))',
      'plt.plot([1,2,3],[2,4,3])',
      'plt.savefig("out/loss.png", dpi=60)',
      'plt.close()',
      'print("saved")'
    ].join('\n');
    const r = await execSse({ scopeId: 'verify', lang: 'python', code: code, policyOverride: { timeoutMs: 60000 } });
    const end = r.result && r.result.result;
    const f = end && (end.files || []).find(function (x) { return x.relPath === 'out/loss.png'; });
    const okData = !!(f && f.dataUrl && f.dataUrl.startsWith('data:image/png;base64,') && f.dataUrl.length > 500);
    record('3', 'matplotlib 产物回传（Agg 后端不挂起）', okData, f ? (f.name + ' ' + f.size + 'B dataUrl=' + (f.dataUrl ? f.dataUrl.length + ' chars' : 'null')) : '无产物: ' + JSON.stringify((end && end.files) || []));
  }

  /* ---------- ④ 工具级路径守卫 ---------- */
  {
    const w = await api('POST', '/api/work/sandbox/write', { scopeId: 'verify', relPath: '../../server/evil.txt', content: 'x' });
    const wj = await w.json();
    record('4a', '写 ../server/ 被拒', w.status === 400 && /ERELPATH|escape/.test(wj.code + wj.error), JSON.stringify(wj).slice(0, 120));

    const r2 = await api('POST', '/api/work/sandbox/read', { scopeId: 'verify', relPath: '../_global_/state.json' });
    const rj = await r2.json();
    record('4b', '读 ../ 被拒', r2.status === 400, JSON.stringify(rj).slice(0, 120));

    const ok = await api('POST', '/api/work/sandbox/write', { scopeId: 'verify', relPath: 'sub/dir/ok.txt', content: 'hello' });
    const okj = await ok.json();
    record('4c', '正常相对路径可写', ok.status === 200 && okj.relPath === 'sub/dir/ok.txt', JSON.stringify(okj));

    const dp = await api('POST', '/api/work/sandbox/write', { scopeId: 'verify', relPath: 'CON.txt', content: 'x' });
    const dpj = await dp.json();
    record('4d', 'Windows 保留名被拒', dp.status === 400, JSON.stringify(dpj).slice(0, 120));
  }

  /* ---------- ⑤ 诚实演示：代码层可以读沙箱外 ---------- */
  {
    const code = 'import os\np = "C:/Windows"\nprint(os.path.isdir(p))\nprint(len(os.listdir(p)) > 0)';
    const r = await execSse({ scopeId: 'verify', lang: 'python', code: code, policyOverride: { timeoutMs: 20000 } });
    const end = r.result && r.result.result;
    const readOk = !!(end && end.stdout.indexOf('True') > -1 && end.stdout.indexOf('True', end.stdout.indexOf('True') + 1) > -1);
    /* 这是"演示沙箱不是安全边界"，所以 readOk===true 才符合预期并如实记录 */
    record('5', '诚实演示：代码层可访问 C:/Windows（预期可达，证明沙箱非安全边界）', readOk, (end && end.stdout || '').trim().replace(/\n/g, ' | '));
  }

  /* ---------- ⑥ 进度条刷屏，tail 保留 ---------- */
  {
    const code = [
      'import sys, time',
      'for i in range(3000):',
      '    sys.stdout.write("downloading %d/%d%%\\r" % (i, i % 100))',
      '    if i % 200 == 0: sys.stdout.flush()',
      'sys.stdout.flush()',
      'print("FINAL_LINE_RESULT_42")'
    ].join('\n');
    const r = await execSse({ scopeId: 'verify', lang: 'python', code: code, policyOverride: { timeoutMs: 30000, maxOutputBytes: 4096 } });
    const end = r.result && r.result.result;
    record('6', '进度条刷屏不吞掉尾部结果', !!(end && end.stdout.indexOf('FINAL_LINE_RESULT_42') > -1),
      'stdout 长度=' + ((end && end.stdout || '').length) + ' 含 FINAL=' + ((end && end.stdout || '').indexOf('FINAL_LINE_RESULT_42') > -1));
  }

  /* ---------- ⑦ 声明式断网 ---------- */
  {
    /* 7a 静态拦截 import requests（显式开启 blockNetworkImports） */
    const r1 = await execSse({ scopeId: 'verify', lang: 'python', code: 'import requests\nprint("no")', policyOverride: { blockNetworkImports: true, timeoutMs: 15000 } });
    const e1 = r1.result && r1.result.result;
    record('7a', '断网策略：import requests 被静态拦截', !!(e1 && e1.blocked && /禁止导入/.test(e1.blockReason || '')), e1 && e1.blockReason);

    /* 7b socket monkeypatch 生效 */
    const r2 = await execSse({ scopeId: 'verify', lang: 'python', code: 'import socket\ntry:\n    socket.create_connection(("1.1.1.1", 80), timeout=2)\n    print("NETWORK_OK")\nexcept OSError as e:\n    print("BLOCKED:", e)' });
    const e2 = r2.result && r2.result.result;
    record('7b', '断网策略：socket 被阻断', !!(e2 && /BLOCKED/.test(e2.stdout || '') && !/NETWORK_OK/.test(e2.stdout || '')), (e2 && e2.stdout || '').trim().split('\n')[0]);

    /* 7c 如实记录：blockNetworkImports 默认关时，标准库网络模块不会被静态拦截 */
    const r3 = await execSse({ scopeId: 'verify', lang: 'python', code: 'import urllib.request\nprint("IMPORT_OK")', policyOverride: { blockNetworkImports: false, timeoutMs: 20000 } });
    const e3 = r3.result && r3.result.result;
    const imported = e3 && /IMPORT_OK/.test(e3.stdout || '');
    record('7c', '如实记录：blockNetworkImports 默认关时不拦截 import', imported === true,
      'imported=' + imported + '（urllib 为标准库，不依赖第三方安装；stderr=' + Work_trunc(e3 && e3.stderr) + '）');

    /* 7d 破坏性命令拦截 */
    const r4 = await execSse({ scopeId: 'verify', lang: 'python', code: 'import os\nos.system("rm -rf /")' });
    const e4 = r4.result && r4.result.result;
    record('7d', 'rm -rf / 被静态拦截', !!(e4 && e4.blocked), e4 && e4.blockReason);
  }

  /* ---------- ⑧ 并发上限 ---------- */
  {
    const mk = function () { return execSse({ scopeId: 'verify', lang: 'python', code: 'import time\ntime.sleep(1.2)\nprint("done")', policyOverride: { timeoutMs: 20000 } }); };
    const t0 = Date.now();
    const all = await Promise.all([mk(), mk(), mk(), mk()]);
    const dur = Date.now() - t0;
    const allOk = all.every(function (r) { const e = r.result && r.result.result; return e && e.ok; });
    /* 默认 maxConcurrent=2：4 个 1.2s 任务串成两批 ≈ 2.4s+ */
    record('8', '并发信号量生效（4 任务 ≈ 两批）', allOk && dur > 2000, '耗时=' + dur + 'ms 全部成功=' + allOk);
  }

  /* ---------- 汇总 ---------- */
  const pass = results.filter(function (r) { return r.ok; }).length;
  const summary = {
    at: new Date().toISOString(), total: results.length, pass: pass, fail: results.length - pass,
    results: results
  };
  fs.writeFileSync(path.join(__dirname, 'work-metrics.json'),
    JSON.stringify({ sandbox: summary }, null, 2), 'utf8');
  console.log('\n=== 沙箱验证: ' + pass + '/' + results.length + ' 通过，明细已写入 verify/work-metrics.json ===');
  process.exit(pass === results.length ? 0 : 1);
}

main().catch(function (e) { console.error('verify 脚本异常:', e); process.exit(2); });

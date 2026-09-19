/* 一次性验证：墨道回合 BYOK-only 路由（run_start.model 应为 BYOK 模型 id，非档位） */
const fs = require('fs');
const http = require('http');

const rt = JSON.parse(fs.readFileSync('D:/ChatScience/app/dist/ChatScience-win32-x64/resources/app/data/runtime.json', 'utf8'));
const prompt = process.argv[2] || '请直接回复四个字：链路正常。不要调用任何工具。';

const payload = JSON.stringify({ agentId: 'agent-orchestrator', prompt: prompt });
const req = http.request({
  host: '127.0.0.1', port: rt.port, path: '/api/work/agent/run', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + rt.token, 'Content-Length': Buffer.byteLength(payload) }
}, function (res) {
  let buf = '';
  const t0 = Date.now();
  res.on('data', function (chunk) {
    buf += chunk.toString();
    let idx;
    while ((idx = buf.indexOf('\n\n')) > -1) {
      const frame = buf.slice(0, idx); buf = buf.slice(idx + 2);
      const dataLine = frame.split('\n').find(function (l) { return l.startsWith('data: '); });
      if (!dataLine) continue;
      let evt; try { evt = JSON.parse(dataLine.slice(6)); } catch (e) { continue; }
      const kind = evt.evt || evt.event;
      if (kind === 'run_start') {
        console.log('[run_start] model=' + evt.model + ' permission=' + evt.permissionMode + ' agent=' + evt.agentId);
      } else if (kind === 'delta') {
        process.stdout.write(evt.delta || '');
      } else if (kind === 'error') {
        console.log('\n[error] ' + (evt.message || JSON.stringify(evt)));
      } else if (kind === 'tool_start') {
        console.log('\n[tool] ' + evt.name);
      } else if (kind === 'run_result') {
        const r = evt.result || {};
        console.log('\n[run_result] ok=' + r.ok + ' dur=' + r.durationMs + 'ms toolCalls=' + r.toolCalls + ' turns=' + r.numTurns + ' session=' + (r.sessionId || ''));
        if (r.error) console.log('[run_result.error] ' + r.error);
        if (r.errors && r.errors.length) console.log('[run_result.errors] ' + r.errors.join(' | '));
        if (!r.ok && r.text) console.log('[run_result.text] ' + String(r.text).slice(0, 500));
        console.log('[总耗时] ' + (Date.now() - t0) + 'ms');
        process.exit(r.ok ? 0 : 2);
      } else if (kind === 'end') {
        console.log('\n[end] ' + JSON.stringify(evt.data).slice(0, 300));
        process.exit(0);
      }
    }
  });
});
req.on('error', function (e) { console.error('request failed: ' + e.message); process.exit(1); });
req.write(payload); req.end();
/* 超时保护 120s */
setTimeout(function () { console.error('\n[timeout] 120s 无结果'); process.exit(3); }, 120000);

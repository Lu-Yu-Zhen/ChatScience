/* 流式分块时序验证：记录每个 SSE chunk 的到达时刻与累计长度 */
const PORT = process.argv[2] || '8642';
const TOKEN = process.argv[3] || '';

(async function () {
  const t0 = Date.now();
  const resp = await fetch('http://127.0.0.1:' + PORT + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
    body: JSON.stringify({
      providerId: 'bailian', model: 'qwen3.8-flash', web: true,
      messages: [{ role: 'user', content: '请用 80 字左右介绍一下联合学习的核心思想，并给出一个公式。' }]
    })
  });
  if (!resp.ok) { console.log('HTTP', resp.status, await resp.text()); process.exit(1); }
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buf = '', full = '', deltas = 0, firstDelta = null, lastLog = 0, done = false;
  const samples = [];
  while (true) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n')) > -1) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const p = line.slice(5).trim();
      if (p === '[DONE]') { done = true; continue; }
      try {
        const j = JSON.parse(p);
        if (j.delta) {
          deltas++;
          if (firstDelta === null) firstDelta = Date.now() - t0;
          full += j.delta;
        }
        if (j.done) done = true;
      } catch (e) {}
    }
    if (full.length - lastLog >= 30) {
      lastLog = full.length;
      samples.push({ t: Date.now() - t0, len: full.length });
    }
  }
  console.log(JSON.stringify({
    totalMs: Date.now() - t0,
    firstDeltaMs: firstDelta,
    deltaCount: deltas,
    chars: full.length,
    samplesEvery30Chars: samples.slice(0, 25),
    conclusion: deltas > 5 ? 'STREAMING_OK（多段到达，非一次性）' : 'NOT_STREAMING（段数过少）'
  }, null, 2));
  console.log('--- tail ---\n' + full.slice(-160));
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });

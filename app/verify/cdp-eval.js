// 通用 CDP evaluate 工具：node cdp-eval.js "<js 表达式>" [--file script.js]
const fs = require('fs');
const http = require('http');

function getTargets() {
  return new Promise(function (resolve, reject) {
    http.get('http://127.0.0.1:9223/json/list', function (res) {
      let b = ''; res.on('data', function (c) { b += c; });
      res.on('end', function () { resolve(JSON.parse(b)); });
    }).on('error', reject);
  });
}

(async function () {
  const arg = process.argv[2] || '';
  const expr = (function () {
    if (process.argv[3] === '--file') return fs.readFileSync(process.argv[2], 'utf8');
    return arg;
  })();
  const targets = await getTargets();
  const page = targets.find(function (t) { return t.type === 'page'; });
  if (!page) { console.error('no page target'); process.exit(1); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(function (r) { ws.onopen = r; });
  let id = 0;
  function send(method, params) {
    return new Promise(function (resolve) {
      const mid = ++id;
      function onmsg(e) {
        const d = JSON.parse(e.data);
        if (d.id === mid) { ws.removeEventListener('message', onmsg); resolve(d.result || d.error); }
      }
      ws.addEventListener('message', onmsg);
      ws.send(JSON.stringify({ id: mid, method: method, params: params }));
    });
  }
  const r = await send('Runtime.evaluate', {
    expression: expr, returnByValue: true, awaitPromise: true, userGesture: true
  });
  if (r.exceptionDetails) console.log('EXC: ' + JSON.stringify(r.exceptionDetails, null, 1).slice(0, 800));
  else console.log(typeof r.result.value === 'string' ? r.result.value : JSON.stringify(r.result.value, null, 1));
  ws.close();
  process.exit(0);
})().catch(function (e) { console.error('ERR: ' + e.message); process.exit(1); });

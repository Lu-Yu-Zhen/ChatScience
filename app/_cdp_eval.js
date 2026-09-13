/* CDP evaluate: node _cdp_eval.js "<expression>" — prints JSON result */
const WebSocket = require('ws');
const http = require('http');

const expr = process.argv[2] || 'document.title';
const flag = process.argv[3] || '';

http.get('http://127.0.0.1:9222/json', function (res) {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', function () {
    const targets = JSON.parse(d).filter(t => t.type === 'page');
    const t = targets[0];
    if (!t) { console.error('no page target'); process.exit(1); }
    const ws = new WebSocket(t.webSocketDebuggerUrl, { perMessageDeflate: false });
    ws.on('open', function () {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: {
        expression: expr, returnByValue: true, awaitPromise: flag.indexOf('await') > -1,
        timeout: flag.indexOf('await') > -1 ? 20000 : undefined
      } }));
    });
    ws.on('message', function (m) {
      const msg = JSON.parse(m);
      if (msg.id === 1) {
        if (msg.result && msg.result.exceptionDetails) {
          console.error('EXCEPTION: ' + JSON.stringify(msg.result.exceptionDetails).slice(0, 600));
        } else {
          console.log(JSON.stringify(msg.result.result.value, null, 1));
        }
        ws.close(); process.exit(0);
      }
    });
    setTimeout(() => { console.error('timeout'); process.exit(2); }, 25000);
  });
});

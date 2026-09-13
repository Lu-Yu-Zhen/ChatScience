// @ts-nocheck
/* 独立运行的全局脚本（字节精确迁移自 JS）：关闭逐行类型检查，
   产物与原 JS 行为一致；语法错误仍会在编译期暴露。 */
/* 对照测试：web=false 的 TTFT */
const PORT = process.argv[2] || '8642';
const TOKEN = process.argv[3] || '';
(async function () {
    const t0 = Date.now();
    const resp = await fetch('http://127.0.0.1:' + PORT + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
        body: JSON.stringify({ providerId: 'bailian', model: 'qwen3.8-flash', web: false, messages: [{ role: 'user', content: '用 50 字介绍强化学习。' }] })
    });
    if (!resp.ok) {
        console.log('HTTP', resp.status, (await resp.text()).slice(0, 200));
        process.exit(1);
    }
    const reader = resp.body.getReader();
    const dec = new TextDecoder();
    let buf = '', full = '', first = null, err = null;
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n')) > -1) {
            const line = buf.slice(0, idx).trim();
            buf = buf.slice(idx + 1);
            if (!line.startsWith('data:'))
                continue;
            const p = line.slice(5).trim();
            if (p === '[DONE]')
                continue;
            try {
                const j = JSON.parse(p);
                if (j.error)
                    err = j.error;
                if (j.delta) {
                    if (first === null)
                        first = Date.now() - t0;
                    full += j.delta;
                }
            }
            catch (e) { }
        }
    }
    console.log('NOWEB ttft=' + first + 'ms total=' + (Date.now() - t0) + 'ms chars=' + full.length + (err ? ' ERR=' + err.slice(0, 200) : ''));
    console.log('tail: ' + full.slice(-100));
})().catch(e => console.error('FATAL', e.message));

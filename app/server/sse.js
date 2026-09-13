"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openSse = openSse;
function openSse(res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });
    let closed = false;
    let onCloseHandler = null;
    /* 心跳注释帧，前端按 data: 前缀过滤，不受影响 */
    const beat = setInterval(function () {
        if (closed)
            return;
        try {
            res.write(': hb\n\n');
        }
        catch (e) { /* 连接已断 */ }
    }, 15000);
    function send(evt, payload) {
        if (closed)
            return false;
        const body = Object.assign({ evt: evt }, payload || {});
        try {
            res.write('data: ' + JSON.stringify(body) + '\n\n');
            return true;
        }
        catch (e) {
            closed = true;
            return false;
        }
    }
    function end(payload) {
        if (closed)
            return;
        send('stream_end', payload || {});
        closed = true;
        clearInterval(beat);
        try {
            res.end();
        }
        catch (e) { /* 忽略 */ }
    }
    /* 客户端断开：正常完成时也会触发 close，调用方须用 finished 标志区分 */
    res.on('close', function () {
        if (closed)
            return;
        closed = true;
        clearInterval(beat);
        if (onCloseHandler)
            onCloseHandler();
    });
    return {
        send: send,
        end: end,
        onClientClose: function (fn) { onCloseHandler = fn; },
        get closed() { return closed; }
    };
}

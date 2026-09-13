// @ts-nocheck
/* 独立运行的全局脚本（字节精确迁移自 JS）：关闭逐行类型检查，
   产物与原 JS 行为一致；语法错误仍会在编译期暴露。 */
/* SDK 冒烟：真实调用 query()，验证 PAT / 运行时 / 流式事件
   用法：node verify/sdk-smoke.js */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { accessToken, query } = require('@qodercn-ai/qodercn-agent-sdk');
const APP_ROOT = path.join(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(APP_ROOT, 'server', 'qoder.json'), 'utf8'));
const workDir = path.join(os.tmpdir(), 'cs-sdk-smoke-' + Date.now());
fs.mkdirSync(path.join(workDir, 'out'), { recursive: true });
fs.writeFileSync(path.join(workDir, 'hello.py'), 'x = 6 * 7\nprint(x)\n', 'utf8');
console.log('[smoke] cwd =', workDir);
const t0 = Date.now();
(async function () {
    const q = query({
        prompt: '当前目录里有一个 hello.py。请读取它，说出它计算的数值，并把结果写进 out/answer.txt（内容只有数字）。完成后用一句话总结。',
        options: {
            auth: accessToken(cfg.accessToken),
            cwd: workDir,
            model: cfg.model || 'performance',
            maxTurns: 6,
            permissionMode: 'acceptEdits',
            /* 沙箱三件套：不继承本机 CLI 的任何配置（否则会把用户全部 MCP 服务器
               与设置带进会话）、工具可见集收敛、MCP 只认代码里注入的 */
            settingSources: [],
            strictMcpConfig: true,
            tools: ['Read', 'Write', 'Glob', 'Bash'],
            allowedTools: ['Read', 'Write', 'Glob', 'Bash'],
            includePartialMessages: true
        }
    });
    const seen = {};
    for await (const msg of q) {
        seen[msg.type] = (seen[msg.type] || 0) + 1;
        if (msg.type === 'system' && msg.subtype === 'init') {
            console.log('[smoke] init: cli=' + msg.qodercli_version + ' model=' + msg.model
                + ' perm=' + msg.permissionMode + ' tools=' + (msg.tools || []).join(','));
        }
        else if (msg.type === 'stream_event') {
            const d = msg.event && msg.event.delta;
            if (d && d.type === 'text_delta')
                process.stdout.write(d.text);
            else if (d && d.type === 'thinking_delta') { /* 静默 */ }
            else if (d && d.type === 'input_json_delta') { /* 静默 */ }
        }
        else if (msg.type === 'assistant') {
            const blocks = (msg.message && msg.message.content) || [];
            const tu = blocks.filter(function (b) { return b.type === 'tool_use'; });
            if (tu.length)
                tu.forEach(function (b) { console.log('\n[tool_use] ' + b.name + ' ' + JSON.stringify(b.input).slice(0, 160)); });
        }
        else if (msg.type === 'user' && msg.message && Array.isArray(msg.message.content)) {
            msg.message.content.forEach(function (b) {
                if (b.type === 'tool_result') {
                    const txt = typeof b.content === 'string' ? b.content : JSON.stringify(b.content);
                    console.log('[tool_result] err=' + !!b.is_error + ' ' + String(txt).slice(0, 120).replace(/\n/g, ' | '));
                }
            });
        }
        else if (msg.type === 'result') {
            console.log('\n[result] subtype=' + msg.subtype + ' turns=' + msg.num_turns
                + ' dur=' + msg.duration_ms + 'ms isError=' + msg.is_error);
            console.log('[result.text] ' + String(msg.result || '').slice(0, 400));
        }
    }
    console.log('\n[smoke] 消息类型统计:', JSON.stringify(seen), '总耗时', Date.now() - t0, 'ms');
    const answer = fs.readFileSync(path.join(workDir, 'out', 'answer.txt'), 'utf8').trim();
    console.log('[smoke] out/answer.txt =', answer);
    console.log(answer === '42' ? 'PASS: Agent 完整跑通（读文件→计算→写产物）' : 'FAIL: 产物不符合预期');
    process.exit(0);
})().catch(function (e) {
    console.error('[smoke] 失败:', e && e.message);
    if (e && e.stack)
        console.error(e.stack.split('\n').slice(0, 4).join('\n'));
    process.exit(1);
});

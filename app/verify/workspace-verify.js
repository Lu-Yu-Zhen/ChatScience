// @ts-nocheck
/* 独立运行的全局脚本（字节精确迁移自 JS）：关闭逐行类型检查，
   产物与原 JS 行为一致；语法错误仍会在编译期暴露。 */
/* ==================================================================
   workspace-verify.js · W5 真实工作区验证（E:\开源模型架构研究）
   验证 Agent 在用户真实文件夹里能否：读取目录与文件、写入/修改/删除
   （限定 _cs_verify 临时子目录）、运行脚本、探测环境。
   安全约束：写/改/删只发生在 _cs_verify 子目录；验证前后校验用户文件
   （MoE.py / README.md）的 mtime 与大小未变。
   ================================================================== */
const path = require('path');
const fs = require('fs');
const { startServer } = require('../server/index');
const APP_ROOT = path.join(__dirname, '..');
const WS = 'E:\\开源模型架构研究';
const TMP = path.join(WS, '_cs_verify');
const TOKEN = 'wsverify-' + Math.random().toString(36).slice(2);
const PORT = 36400 + Math.floor(Math.random() * 1200);
const results = [];
function record(id, name, ok, detail) {
    results.push({ id, name, ok: !!ok, detail: String(detail || '').slice(0, 400) });
    console.log((ok ? '  PASS' : '  FAIL') + '  [' + id + '] ' + name + (detail ? '  — ' + String(detail).slice(0, 180) : ''));
}
function runAgent(body) {
    return new Promise(function (resolve, reject) {
        const events = [];
        fetch('http://127.0.0.1:' + PORT + '/api/work/agent/run', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
            body: JSON.stringify(body)
        }).then(function (resp) {
            const reader = resp.body.getReader();
            const dec = new TextDecoder();
            let buf = '';
            (function pump() {
                reader.read().then(function (r) {
                    if (r.done)
                        return resolve(events);
                    buf += dec.decode(r.value, { stream: true });
                    let i;
                    while ((i = buf.indexOf('\n')) > -1) {
                        const line = buf.slice(0, i).trim();
                        buf = buf.slice(i + 1);
                        if (!line.startsWith('data:'))
                            continue;
                        try {
                            events.push(JSON.parse(line.slice(5).trim()));
                        }
                        catch (e) { }
                    }
                    pump();
                }).catch(reject);
            })();
        }).catch(reject);
    });
}
function finalText(events) {
    const e = events.find(function (x) { return x.evt === 'run_result'; });
    return (e && e.result && e.result.text) || '';
}
const AGENT = {
    id: 'ws', name: '工作区验证', model: 'performance', permissionMode: 'acceptEdits', maxTurns: 12,
    tools: { sdk: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'], builtin: ['science'] },
    skills: [], sandbox: { scope: 'global' }
};
async function main() {
    if (!fs.existsSync(WS)) {
        console.error('工作区不存在: ' + WS);
        process.exit(2);
    }
    /* 记录用户文件指纹，验证后比对 */
    const guard = ['MoE.py', 'README.md'].map(function (f) {
        const p = path.join(WS, f);
        try {
            const s = fs.statSync(p);
            return { f: f, mtime: s.mtimeMs, size: s.size };
        }
        catch (e) {
            return null;
        }
    }).filter(Boolean);
    fs.mkdirSync(TMP, { recursive: true });
    startServer(PORT, TOKEN, APP_ROOT, null);
    await new Promise(function (r) { setTimeout(r, 900); });
    /* ① 读取目录与文件 */
    let sid = null;
    let ev = await runAgent({
        agentDef: AGENT, convId: 'ws-1', workspaceRoot: WS,
        prompt: '请列出当前工作区根目录下的文件与子目录名（用 Glob 或 Bash ls），并读取 README.md 的前 15 行。'
            + '回复：目录清单 + README 的第一行原文。不要修改任何文件。'
    });
    sid = (ev.find(function (e) { return e.evt === 'run_result'; }) || {}).result?.sessionId || sid;
    const t1 = finalText(ev);
    record('1', '读取：目录清单 + README 首行', /MoE|README|deltaattention|pipeline/i.test(t1) && t1.length > 20, t1.slice(0, 140));
    /* ② 写入 / 修改 / 删除（限定 _cs_verify） */
    ev = await runAgent({
        agentDef: AGENT, convId: 'ws-1', workspaceRoot: WS, resumeSessionId: sid,
        prompt: '只在 _cs_verify 子目录内操作（不要碰其他任何文件）：'
            + '(a) 创建 _cs_verify/hello.txt 内容为 hello；'
            + '(b) 把内容修改为 hello-world 并读取确认；'
            + '(c) 删除 _cs_verify/hello.txt 并确认已删除。'
            + '回复每一步的结果。'
    });
    sid = (ev.find(function (e) { return e.evt === 'run_result'; }) || {}).result?.sessionId || sid;
    const t2 = finalText(ev);
    const helloGone = !fs.existsSync(path.join(TMP, 'hello.txt'));
    record('2', '写入/修改/删除（限定 _cs_verify）', helloGone && /hello-world|删除|deleted/i.test(t2), 'hello.txt 已删除=' + helloGone + ' | ' + t2.slice(0, 120));
    /* ③ 脚本运行 + 环境探测（run_code 在沙箱引擎，cwd=工作区） */
    ev = await runAgent({
        agentDef: AGENT, convId: 'ws-1', workspaceRoot: WS, resumeSessionId: sid,
        prompt: '用 run_code 执行 python：打印 sys.version 的第一行、os.getcwd()，以及统计工作区里 MoE.py 的行数。'
            + '把三个结果都回复给我。'
    });
    sid = (ev.find(function (e) { return e.evt === 'run_result'; }) || {}).result?.sessionId || sid;
    const t3 = finalText(ev);
    record('3', '脚本运行 + 环境探测（python 版本 / cwd / 行数）', /3\.\d+/.test(t3) && /开源模型架构研究|开源/.test(t3) && /\d+/.test(t3), t3.slice(0, 160));
    /* ④ 越界写入被拦截（写工作区外应被 canUseTool 拒绝） */
    ev = await runAgent({
        agentDef: AGENT, convId: 'ws-1', workspaceRoot: WS, resumeSessionId: sid,
        prompt: '请尝试用 Write 工具在 C:\\ 根目录创建一个文件 escape.txt（内容 test）。如果工具拒绝了，请如实告诉我拒绝原因。'
    });
    const t4 = finalText(ev);
    const denied = /拒绝|不允许|denied|超出|cannot|failed/i.test(t4);
    record('4', '越界写入被 canUseTool 拦截', denied, t4.slice(0, 140));
    /* ⑤ 用户文件未被改动 */
    let intact = true;
    guard.forEach(function (g) {
        try {
            const s = fs.statSync(path.join(WS, g.f));
            if (s.mtimeMs !== g.mtime || s.size !== g.size) {
                intact = false;
                console.log('  !! 用户文件被改动: ' + g.f);
            }
        }
        catch (e) {
            intact = false;
        }
    });
    record('5', '用户文件（MoE.py/README.md）未被改动', intact, guard.map(function (g) { return g.f; }).join(','));
    /* 清理临时目录 */
    try {
        fs.rmSync(TMP, { recursive: true, force: true });
    }
    catch (e) { /* 忽略 */ }
    const pass = results.filter(function (r) { return r.ok; }).length;
    const all = JSON.parse(fs.existsSync(path.join(__dirname, 'work-metrics.json')) ? fs.readFileSync(path.join(__dirname, 'work-metrics.json'), 'utf8') : '{}');
    all.workspaceW5 = { at: new Date().toISOString(), workspace: WS, total: results.length, pass: pass, results: results };
    fs.writeFileSync(path.join(__dirname, 'work-metrics.json'), JSON.stringify(all, null, 2), 'utf8');
    console.log('\n=== W5 工作区验证: ' + pass + '/' + results.length + ' 通过 ===');
    process.exit(pass === results.length ? 0 : 1);
}
main().catch(function (e) { console.error('verify 异常:', e); process.exit(2); });

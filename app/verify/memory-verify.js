// @ts-nocheck
/* 独立运行的全局脚本（字节精确迁移自 JS）：关闭逐行类型检查，
   产物与原 JS 行为一致；语法错误仍会在编译期暴露。 */
/* ==================================================================
   memory-verify.js · Work 项目记忆机制验证
   A 模块单测（memory.ts 工厂直连）：目录/md 生成、幂等、标题同步、
     Stop 决策 hook（首触 block + stop_hook_active 放行 + 单回合双保险）、
     ID 安全化防目录穿越
   B HTTP 面（脚本内自起服务）：/api/work/memory/{project,task} 增查与参数校验
   C e2e 真实 SDK 回合（BYOK）：带 projectId 的 agent/run——
     回合前记忆就绪、Stop 决策 hook 必触发（audit + notice）、
     模型自主写入任务记忆（md 内容含约定事实）、无 projectId 不触发
   运行：node app/verify/memory-verify.js
   ================================================================== */
const path = require('path');
const fs = require('fs');
const { startServer } = require('../server/index');
const { createMemory } = require('../server/memory');
const APP_ROOT = path.join(__dirname, '..');
const TOKEN = 'verify-' + Math.random().toString(36).slice(2);
const PORT = 39000 + Math.floor(Math.random() * 8000);
const AUDIT_FILE = path.join(APP_ROOT, 'data', 'work-audit.jsonl');
const results = [];
const createdDirs = []; /* 验证产生的 data/projects/<id> 目录，结束后清理 */
function record(id, name, ok, detail) {
    results.push({ id, name, ok: !!ok, detail: String(detail || '').slice(0, 500) });
    console.log((ok ? '  PASS' : '  FAIL') + '  [' + id + '] ' + name + (detail ? '  — ' + String(detail).slice(0, 160) : ''));
}
function api(method, p, body) {
    return fetch('http://127.0.0.1:' + PORT + p, {
        method: method,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
}
/* SSE agent/run：收集事件（与 agent-verify 同构） */
function runAgent(body) {
    return new Promise(function (resolve, reject) {
        const events = [];
        fetch('http://127.0.0.1:' + PORT + '/api/work/agent/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
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
                        catch (e) { /* 忽略 */ }
                    }
                    pump();
                }).catch(reject);
            })();
        }).catch(reject);
    });
}
/* 审计文件中与 projectId 相关的 memory_decision 条数 */
function countMemoryDecisions(projectId) {
    try {
        const txt = fs.readFileSync(AUDIT_FILE, 'utf8');
        return txt.split('\n').filter(function (l) {
            return l.indexOf('"memory_decision"') > -1 && l.indexOf('project=' + projectId) > -1;
        }).length;
    }
    catch (e) {
        return 0;
    }
}
const AGENT = {
    id: 'mem-e2e', name: '记忆验证', permissionMode: 'acceptEdits', maxTurns: 12,
    tools: { sdk: ['Read', 'Write', 'Edit'], builtin: [] }, sandbox: { scope: 'agent' }
};
/* ---------------- A 模块单测 ---------------- */
async function moduleTests() {
    const mem = createMemory(APP_ROOT);
    const pid = 'verify-mem-' + Date.now().toString(36);
    const tid = 'verify-task-' + Date.now().toString(36);
    const p1 = mem.ensureProject(pid, '记忆验证项目');
    createdDirs.push(path.join(APP_ROOT, 'data', 'projects', pid));
    record('a1', 'ensureProject 生成项目记忆文件夹 + README.md', fs.existsSync(p1.readme) && fs.existsSync(path.join(p1.dir, 'tasks')) && p1.created === true, p1.dir);
    const t1 = mem.ensureTask(pid, tid, '种子记忆任务');
    record('a2', 'ensureTask 生成任务记忆 md + 登记进 README 任务清单', fs.existsSync(t1.file) && t1.created === true
        && fs.readFileSync(p1.readme, 'utf8').indexOf(tid) > -1, t1.file);
    const t2 = mem.ensureTask(pid, tid, '种子记忆任务');
    record('a3', 'ensureTask 幂等（二次创建不覆盖）', t2.created === false);
    const titleChanged = mem.syncTaskTitle(pid, tid, '随机种子约定');
    const h1 = /^#\s*任务记忆：(.*)$/m.exec(fs.readFileSync(t1.file, 'utf8'));
    record('a4', 'syncTaskTitle 同步 md 标题（draft→正题）', titleChanged === true && h1 && h1[1].trim() === '随机种子约定', h1 ? h1[1] : '');
    const rd = mem.readTask(pid, tid);
    record('a5', 'readTask / readProject 读回', rd.exists === true && rd.content.indexOf('随机种子约定') > -1
        && mem.readProject(pid).tasks.indexOf(tid) > -1, 'tasks=' + mem.readProject(pid).tasks.join(','));
    const ctx = mem.ensureContext(pid, '记忆验证项目', tid, '随机种子约定');
    const section = mem.buildPromptSection(ctx);
    record('a6', 'ensureContext 就绪 + buildPromptSection 含机制与路径', ctx.taskFile === t1.file && section.indexOf('记忆更新决策') > -1
        && section.indexOf(t1.file) > -1 && section.indexOf(ctx.dir) > -1, 'section ' + section.length + ' chars');
    /* Stop 决策 hook：首次 block；stop_hook_active 放行；单回合双保险放行 */
    const audit = { appended: [], append: function (e) { this.appended.push(e); } };
    const notices = [];
    const hooks = mem.makeStopHook(ctx, audit, function (evt, d) { notices.push({ evt: evt, d: d }); });
    const stopInput = { hook_event_name: 'Stop', stop_hook_active: false, session_id: 's', transcript_path: '', cwd: '' };
    const out1 = await hooks.Stop[0].hooks[0](stopInput, undefined, { signal: new AbortController().signal });
    record('a7', 'Stop hook 首触返回 block + 决策指令（含任务记忆路径）', out1.decision === 'block' && String(out1.reason).indexOf(t1.file) > -1
        && String(out1.reason).indexOf('记忆更新决策') > -1, String(out1.reason).slice(0, 80));
    const out2 = await hooks.Stop[0].hooks[0](Object.assign({}, stopInput, { stop_hook_active: true }), undefined, { signal: new AbortController().signal });
    record('a8', 'stop_hook_active=true 时放行（防循环）', out2.decision === undefined);
    const out3 = await hooks.Stop[0].hooks[0](stopInput, undefined, { signal: new AbortController().signal });
    record('a9', '单回合双保险：已阻断过一次后放行', out3.decision === undefined);
    record('a10', '决策触发落审计 memory_decision + 发 notice', audit.appended.some(function (e) { return e.event === 'memory_decision'; })
        && notices.some(function (n) { return n.d && n.d.code === 'memory_decision'; }), 'audit=' + audit.appended.length + ' notice=' + notices.length);
    /* ID 安全化：目录穿越 id 不能逃出 data/projects */
    const evil = mem.ensureProject('../../evil-' + Date.now().toString(36), 'x');
    createdDirs.push(path.dirname(path.dirname(evil.dir)));
    record('a11', 'ID 安全化防目录穿越（../../ 前缀被清洗）', evil.dir.indexOf(path.join(APP_ROOT, 'data', 'projects') + path.sep) === 0
        && evil.dir.indexOf('..') === -1, evil.dir);
}
/* ---------------- B HTTP 面 ---------------- */
async function httpTests() {
    const pid = 'verify-mem-http-' + Date.now().toString(36);
    const tid = 'verify-task-http-' + Date.now().toString(36);
    createdDirs.push(path.join(APP_ROOT, 'data', 'projects', pid));
    const r1 = await (await api('POST', '/api/work/memory/project', { projectId: pid, name: 'HTTP 验证项目' })).json();
    record('b1', 'POST /memory/project 创建项目记忆文件夹', r1.ok === true && r1.created === true, r1.dir || JSON.stringify(r1));
    const r2 = await (await api('POST', '/api/work/memory/task', { projectId: pid, projectName: 'HTTP 验证项目', taskId: tid, title: 'HTTP 任务' })).json();
    record('b2', 'POST /memory/task 创建任务记忆 md', r2.ok === true && r2.created === true && fs.existsSync(r2.file), r2.file || JSON.stringify(r2));
    const r3 = await (await api('GET', '/api/work/memory/task?projectId=' + pid + '&taskId=' + tid)).json();
    record('b3', 'GET /memory/task 读回内容', r3.exists === true && r3.content.indexOf('HTTP 任务') > -1, 'chars=' + (r3.content || '').length);
    const r4 = await (await api('GET', '/api/work/memory/project?projectId=' + pid)).json();
    record('b4', 'GET /memory/project 索引含任务清单', r4.tasks.indexOf(tid) > -1, r4.tasks.join(','));
    const bad = await api('POST', '/api/work/memory/task', { projectId: pid });
    record('b5', '缺 taskId 返回 400', bad.status === 400, 'HTTP ' + bad.status);
}
/* ---------------- C e2e 真实 SDK 回合 ---------------- */
/* 等待 BYOK 缓存就绪（SDK worker 首启有瞬态竞争，bootstrap/回合前会自动重试） */
async function waitByok(timeoutMs) {
    const t0 = Date.now();
    while (Date.now() - t0 < (timeoutMs || 30000)) {
        try {
            const b = await (await api('GET', '/api/work/bootstrap')).json();
            if (b.byokModels && b.byokModels.length)
                return b.byokModels;
        }
        catch (e) { /* 服务未就绪 */ }
        await new Promise(function (r) { setTimeout(r, 1500); });
    }
    return null;
}
async function e2eTests() {
    const byok = await waitByok(30000);
    record('c0', 'BYOK 模型就绪（e2e 前置）', !!byok, byok ? byok.map(function (m) { return m.model; }).filter(Boolean).join(',') : 'bootstrap 30s 内未就绪');
    const pid = 'verify-mem-e2e-' + Date.now().toString(36);
    /* 应用语义：convId 即任务 id，任务记忆文档为 tasks/<convId>.md */
    const convId = 'mem-e2e-1';
    createdDirs.push(path.join(APP_ROOT, 'data', 'projects', pid));
    const taskFile = path.join(APP_ROOT, 'data', 'projects', pid, 'memory', 'tasks', convId + '.md');
    const before = countMemoryDecisions(pid);
    const body = {
        agentDef: AGENT, convId: convId, scopeId: 'mem-e2e',
        projectId: pid, projectName: '记忆验证项目', taskTitle: '随机种子约定',
        prompt: '请记住一个项目级事实：本项目所有实验的随机种子固定为 42，后续生成任何随机数据都必须使用 seed(42)。'
            + '然后只用一句话向用户确认你已记住该规则。'
    };
    let events = await runAgent(body);
    let end = events.find(function (e) { return e.evt === 'run_result'; });
    let r = (end && end.result) || {};
    /* BYOK 瞬态未就绪时重试一次（缓存刷新是异步的） */
    if (!r.ok && String(r.error || '').indexOf('未检测到') > -1) {
        await new Promise(function (res) { setTimeout(res, 3000); });
        events = await runAgent(body);
        end = events.find(function (e) { return e.evt === 'run_result'; });
        r = (end && end.result) || {};
    }
    const notices = events.filter(function (e) { return e.evt === 'notice' && e.code === 'memory_decision'; });
    record('c1', 'e2e 回合成功（带项目记忆链路）', r.ok === true, 'turns=' + r.numTurns + ' toolCalls=' + r.toolCalls + ' dur=' + r.durationMs + 'ms err=' + (r.error || ''));
    record('c2', '回合前记忆就绪：项目文件夹 + 任务 md 已生成', fs.existsSync(taskFile) && fs.existsSync(path.join(APP_ROOT, 'data', 'projects', pid, 'memory', 'README.md')), taskFile);
    record('c3', 'Stop 记忆决策 hook 每轮必触发（audit + SSE notice）', notices.length >= 1 && countMemoryDecisions(pid) > before, 'notice=' + notices.length + ' auditDelta=' + (countMemoryDecisions(pid) - before));
    let md = '';
    try {
        md = fs.readFileSync(taskFile, 'utf8');
    }
    catch (e) { /* 不存在 */ }
    record('c4', '模型自主决策写入任务记忆（md 含约定事实 seed 42）', md.indexOf('42') > -1 && md.indexOf('### ') > -1, md.slice(0, 200).replace(/\n/g, ' | '));
    record('c5', '决策 hook 未造成循环（turns 有界 < maxTurns）', typeof r.numTurns === 'number' && r.numTurns >= 2 && r.numTurns < 12, 'turns=' + r.numTurns);
    /* 负面对照：无 projectId 的回合不触发记忆决策 */
    const before2 = countMemoryDecisions('none');
    const events2 = await runAgent({
        agentDef: AGENT, convId: 'mem-e2e-2', scopeId: 'mem-e2e',
        prompt: '请只回复四个字：记忆无关。'
    });
    const r2 = ((events2.find(function (e) { return e.evt === 'run_result'; }) || {}).result) || {};
    const notices2 = events2.filter(function (e) { return e.evt === 'notice' && e.code === 'memory_decision'; });
    record('c6', '无 projectId 回合不触发记忆决策（负面对照）', r2.ok === true && notices2.length === 0 && countMemoryDecisions('none') === before2, 'ok=' + r2.ok + ' notice=' + notices2.length);
}
async function main() {
    const t0 = Date.now();
    await moduleTests();
    startServer(PORT, TOKEN, APP_ROOT, null);
    await new Promise(function (r) { setTimeout(r, 900); });
    await httpTests();
    await e2eTests();
    /* 清理验证产生的项目记忆目录 */
    createdDirs.forEach(function (d) {
        try {
            fs.rmSync(d, { recursive: true, force: true });
        }
        catch (e) { /* 忽略 */ }
    });
    const pass = results.filter(function (r) { return r.ok; }).length;
    const all = JSON.parse(fs.existsSync(path.join(__dirname, 'work-metrics.json')) ? fs.readFileSync(path.join(__dirname, 'work-metrics.json'), 'utf8') : '{}');
    all.projectMemory = {
        at: new Date().toISOString(), totalMs: Date.now() - t0,
        total: results.length, pass: pass, results: results,
        note: 'C 组为真实 SDK 回合（BYOK）；Stop hook 决策 + 模型自主写入'
    };
    fs.writeFileSync(path.join(__dirname, 'work-metrics.json'), JSON.stringify(all, null, 2), 'utf8');
    console.log('\n=== 项目记忆验证: ' + pass + '/' + results.length + ' 通过（总耗时 ' + Math.round((Date.now() - t0) / 1000) + 's）===');
    process.exit(pass === results.length ? 0 : 1);
}
main().catch(function (e) { console.error('verify 异常:', e); process.exit(2); });

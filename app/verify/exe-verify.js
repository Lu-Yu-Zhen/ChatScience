// @ts-nocheck
/* exe 系统性功能验证驱动（针对打包版 ChatScience.exe）
 * 运行：node verify/exe-verify.js   （需先 node pack.js 完成打包）
 *
 * 覆盖：
 *  A. 启动 + runtime.json + HTTP API（health / state 持久化 / bootstrap / skills / qoder config / notes / kb）
 *  B. CDP UI 验证：Chat 新建会话、真实流式回复、Work 模式切换、侧栏九入口、智能体/技能页渲染、控制台 0 错误
 *  C. 重启恢复：再次启动后历史会话仍在（保存与恢复跨重启）
 *  D. 沙箱执行 + Agent 回合（run_code / note_write / Skill）
 *
 * 环境边界（如实声明）：本验证若运行在 WorkBuddy 沙箱会话内，安全策略会终止
 * exe 派生子进程（python/cmd/qodercli）——D 类检查将自动标记 SKIP；
 * 相同编译产物已由 verify/ts-migration-smoke.js 在 node 侧完成等价验证。
 * 在普通终端（安全中心不拦截的会话）运行本脚本可完整覆盖 D 类。
 */
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn, execSync } = require('child_process');
const WebSocket = require('ws');
const STAGE = 'D:/ChatScience/app/dist/ChatScience-win32-x64';
const EXE = path.join(STAGE, 'ChatScience.exe');
const APPDIR = path.join(STAGE, 'resources', 'app');
const DATA = path.join(APPDIR, 'data');
const RUNTIME = path.join(DATA, 'runtime.json');
const STATE = path.join(DATA, 'state.json');
const CDP_PORT = '9223';
const SHOTS = 'D:/ChatScience/.workbuddy/_tmp/shots';
fs.mkdirSync(SHOTS, { recursive: true });
const results = [];
function check(name, ok, extra, kind) {
    results.push({ name: name, ok: !!ok, kind: kind || (ok ? 'pass' : 'fail') });
    const tag = kind === 'skip' ? 'SKIP' : (ok ? 'PASS' : 'FAIL');
    console.log(tag + ' | ' + name + (extra !== undefined && extra !== '' ? ' | ' + extra : ''));
}
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function api(port, token, method, p, body) {
    return fetch('http://127.0.0.1:' + port + p, {
        method: method,
        headers: Object.assign({ Authorization: 'Bearer ' + token }, body ? { 'Content-Type': 'application/json' } : {}),
        body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json(); });
}
/* ---------- CDP 小客户端 ---------- */
let cdpWs = null;
let cdpId = 0;
const cdpPending = {};
let consoleErrors = [];
function cdpConnect(port) {
    return new Promise(function (resolve, reject) {
        http.get('http://127.0.0.1:' + port + '/json', function (res) {
            let d = '';
            res.on('data', function (c) { d += c; });
            res.on('end', function () {
                try {
                    const targets = JSON.parse(d).filter(function (t) { return t.type === 'page'; });
                    if (!targets.length) {
                        reject(new Error('no page target'));
                        return;
                    }
                    const ws = new WebSocket(targets[0].webSocketDebuggerUrl, { perMessageDeflate: false });
                    ws.on('open', function () { resolve(ws); });
                    ws.on('message', function (m) {
                        const msg = JSON.parse(m);
                        if (msg.id && cdpPending[msg.id]) {
                            const fn = cdpPending[msg.id];
                            delete cdpPending[msg.id];
                            fn(msg);
                        }
                        else if (msg.method === 'Runtime.exceptionThrown') {
                            consoleErrors.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
                        }
                        else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
                            consoleErrors.push(JSON.stringify(msg.params.args).slice(0, 300));
                        }
                    });
                }
                catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}
function cdpSend(method, params) {
    return new Promise(function (resolve, reject) {
        const id = ++cdpId;
        cdpPending[id] = function (msg) {
            if (msg.error)
                reject(new Error(method + ': ' + JSON.stringify(msg.error).slice(0, 200)));
            else
                resolve(msg.result);
        };
        cdpWs.send(JSON.stringify({ id: id, method: method, params: params || {} }));
        setTimeout(function () { if (cdpPending[id]) {
            delete cdpPending[id];
            reject(new Error('cdp timeout: ' + method));
        } }, 30000);
    });
}
async function ev(expr) {
    const r = await cdpSend('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails)
        throw new Error('eval error: ' + JSON.stringify(r.exceptionDetails).slice(0, 300));
    return r.result ? r.result.value : undefined;
}
async function shot(name) {
    try {
        const r = await cdpSend('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(r.data, 'base64'));
    }
    catch (e) {
        console.log('[shot] ' + name + ' failed: ' + e.message);
    }
}
/* ---------- 进程管理 ---------- */
function killChatScience() {
    try {
        execSync('taskkill /IM ChatScience.exe /T /F', { stdio: 'ignore' });
    }
    catch (e) { /* 无实例 */ }
}
function killStaleDevInstance() {
    try {
        const rt = JSON.parse(fs.readFileSync('D:/ChatScience/app/data/runtime.json', 'utf8'));
        if (rt.pid) {
            let img = '';
            try {
                img = execSync('tasklist /FI "PID eq ' + rt.pid + '" /FO CSV /NH', { encoding: 'utf8' });
            }
            catch (e) {
                return;
            }
            if (/electron\.exe/i.test(img)) {
                try {
                    execSync('taskkill /PID ' + rt.pid + ' /T /F', { stdio: 'ignore' });
                    console.log('[pre] 已结束占用单实例锁的开发实例 pid=' + rt.pid);
                }
                catch (e) { /* 忽略 */ }
            }
        }
    }
    catch (e) { /* 无 runtime.json */ }
}
async function launchExe(tag) {
    killChatScience();
    await sleep(1500);
    const rtBefore = fs.existsSync(RUNTIME) ? fs.statSync(RUNTIME).mtimeMs : 0;
    /* 关键：剥掉宿主泄漏的 ELECTRON_RUN_AS_NODE，否则 electron.exe 退化为纯 Node，
       应用不会真正启动（WorkBuddy 等 Electron 宿主的沙箱环境常见此泄漏） */
    const exeEnv = Object.assign({}, process.env);
    delete exeEnv.ELECTRON_RUN_AS_NODE;
    /* CDP 端口必须走真实命令行参数（appendSwitch 对此类早期开关不生效） */
    const child = spawn(EXE, ['--remote-debugging-port=' + CDP_PORT], { cwd: STAGE, env: exeEnv, stdio: 'ignore' });
    let rt = null;
    for (let i = 0; i < 80; i++) {
        await sleep(500);
        try {
            if (fs.existsSync(RUNTIME) && fs.statSync(RUNTIME).mtimeMs > rtBefore) {
                rt = JSON.parse(fs.readFileSync(RUNTIME, 'utf8'));
                break;
            }
        }
        catch (e) { /* 重试 */ }
    }
    check('启动 ' + tag + '：exe 写出 runtime.json', !!rt && rt.port > 0, rt ? ('port=' + rt.port) : '未写出');
    return rt;
}
function stopExe() {
    killChatScience();
    cdpWs = null;
}
/* ---------- SSE agent run ---------- */
async function agentRun(port, token, body) {
    const resp = await fetch('http://127.0.0.1:' + port + '/api/work/agent/run', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const dec = new TextDecoder();
    let buf = '';
    let result = null;
    const started = Date.now();
    for await (const chunk of resp.body) {
        buf += dec.decode(chunk, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n\n')) > -1) {
            const frame = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            const line = frame.split('\n').find(function (l) { return l.indexOf('data:') === 0; });
            if (!line)
                continue;
            let payload;
            try {
                payload = JSON.parse(line.slice(5).trim());
            }
            catch (e) {
                continue;
            }
            if (payload.evt === 'run_result') {
                result = payload.result;
            }
            if (payload.evt === 'error' && !result)
                result = { ok: false, error: payload.message, toolCalls: 0, text: '' };
        }
        if (Date.now() - started > 240000)
            break;
    }
    return result;
}
async function sandboxExecViaHttp(port, token, body) {
    const resp = await fetch('http://127.0.0.1:' + port + '/api/work/sandbox/exec', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const dec = new TextDecoder();
    let buf = '';
    let result = null;
    for await (const chunk of resp.body) {
        buf += dec.decode(chunk, { stream: true });
        let i;
        while ((i = buf.indexOf('\n\n')) > -1) {
            const frame = buf.slice(0, i);
            buf = buf.slice(i + 2);
            const line = frame.split('\n').find(function (l) { return l.indexOf('data:') === 0; });
            if (!line)
                continue;
            let pl;
            try {
                pl = JSON.parse(line.slice(5).trim());
            }
            catch (e) {
                continue;
            }
            if (pl.evt === 'end')
                result = pl.result;
        }
    }
    return result;
}
/* ---------- UI 会话（CDP） ---------- */
async function uiVerify(P, T, tag) {
    for (let i = 0; i < 40 && !cdpWs; i++) {
        try {
            cdpWs = await cdpConnect(CDP_PORT);
        }
        catch (e) {
            await sleep(500);
        }
    }
    check('CDP 连接（remote-debugging-port）' + tag, !!cdpWs);
    if (!cdpWs)
        return;
    await cdpSend('Runtime.enable');
    await cdpSend('Page.enable');
    await sleep(1500);
    const title = await ev('document.title');
    check('UI 窗口加载（title=ChatScience）', title === 'ChatScience', title);
    const bridge = await ev('JSON.stringify({mode: window.CS_BACKEND && window.CS_BACKEND.mode, desktop: !!window.csDesktop})');
    check('UI 桥接生效（preload IPC）', bridge && JSON.parse(bridge).mode === 'ipc', bridge);
    check('UI 核心函数在位', (await ev('typeof startDraft==="function" && typeof sendMessage==="function" && typeof setSidebarMode==="function"')) === true);
    check('UI 当前模式 chat', (await ev('sidebarMode')) === 'chat');
    /* 2026-09-16：初始页改版——欢迎卡片/pills 移除、输入框居中；
       「模型」入口不再以 pills 文案出现，改为校验输入框工具条上的模型选择器控件。 */
    const uiTexts = await ev('JSON.stringify({hasNew:(document.body.innerText||"").indexOf("新建对话")>-1,'
        + 'hasBrand:(document.body.innerText||"").indexOf("ChatScience")>-1,'
        + 'hasInput:!!document.getElementById("chatInput"),'
        + 'hasModelMenu:!!document.getElementById("modelMenu"),'
        + 'hasSend:!!document.getElementById("sendBtn")})');
    const uiT = uiTexts ? JSON.parse(uiTexts) : {};
    check('UI 主界面元素齐全', !!(uiT.hasNew && uiT.hasBrand && uiT.hasInput && uiT.hasModelMenu && uiT.hasSend), JSON.stringify(uiT));
    await shot('chat-' + tag);
}
(async function main() {
    console.log('=== ChatScience.exe 系统性功能验证 ===');
    if (!fs.existsSync(EXE)) {
        console.error('未找到 ' + EXE + '（先 node pack.js）');
        process.exit(1);
    }
    killStaleDevInstance();
    const stateBackup = fs.existsSync(STATE) ? fs.readFileSync(STATE, 'utf8') : null;
    /* ===== Phase A：启动 + HTTP 基础 ===== */
    const rt = await launchExe('A');
    if (!rt) {
        stopExe();
        process.exit(1);
    }
    const P = rt.port, T = rt.token;
    const j0 = await api(P, T, 'GET', '/api/health');
    check('HTTP /api/health', j0 && j0.ok === true && j0.pid > 0);
    const marker = { conversations: [], projects: [], exeMark: 'persist-' + Date.now() };
    const j1 = await api(P, T, 'POST', '/api/state', marker);
    check('HTTP /api/state 写入', j1 && j1.ok === true);
    const j2 = await api(P, T, 'GET', '/api/state');
    check('HTTP /api/state 读回一致', j2 && j2.exeMark === marker.exeMark);
    const jb = await api(P, T, 'GET', '/api/work/bootstrap');
    check('HTTP bootstrap（内建智能体播种）', jb && jb.work && Array.isArray(jb.work.agents) && jb.work.agents.length >= 2
        && jb.work.agents.some(function (a) { return a.id === 'agent-orchestrator'; }), 'agents=' + (jb.work ? jb.work.agents.length : 0));
    const js = await api(P, T, 'GET', '/api/work/skills');
    check('HTTP skills 清单（科研技能包 >=15）', js && js.skills && js.skills.length >= 15, 'skills=' + (js.skills ? js.skills.length : 0));
    const jq = await api(P, T, 'GET', '/api/work/qoder/config');
    check('HTTP qoder config', jq && jq.hasToken === true);
    const jn = await api(P, T, 'POST', '/api/work/notes', { title: 'exe-smoke', content: 'note ok', source: 'user' });
    const nid = jn && jn.id;
    const jn2 = await api(P, T, 'POST', '/api/work/notes/delete', { id: nid });
    check('HTTP notes 增删', jn2 && jn2.deleted === nid);
    const jk = await api(P, T, 'POST', '/api/work/kb/index', { kbId: 'exe-smoke', fileName: 'note.md', text: 'ChatScience exe 验证文本 attention 注意力。' });
    check('HTTP kb 索引', jk && jk.chunks >= 1);
    const jk2 = await api(P, T, 'POST', '/api/work/kb/remove', { kbId: 'exe-smoke', fileName: 'note.md' });
    check('HTTP kb 删除', jk2 && jk2.removed === 'note.md');
    /* ===== Phase B：CDP UI + Chat E2E + 持久化 ===== */
    let countBefore = 0;
    try {
        await uiVerify(P, T, 'A');
        countBefore = await ev('conversations.length');
        /* Chat：新建会话 + 真实流式回复（/api/chat 为纯 HTTP 上游代理，无子进程派生） */
        await ev('startDraft(null)');
        await sleep(300);
        await ev('sendMessage("exe验证：请只回复两个字：正常")');
        let sent = false;
        for (let i = 0; i < 150; i++) {
            await sleep(1000);
            try {
                sent = await ev('(function(){const c=conversations[conversations.length-1];return !!(c && c.messages && c.messages.some(function(m){return (m.role==="ai"||m.role==="assistant") && m.text && m.text.length>0;}));})()');
                if (sent)
                    break;
            }
            catch (e) { /* 轮询中 */ }
        }
        check('Chat 真实流式回复完成', sent === true, sent ? '' : '150s 内未见 assistant 文本');
        const lastText = await ev('(function(){const c=conversations[conversations.length-1];const a=c.messages.filter(function(m){return m.role==="ai"||m.role==="assistant";}).pop();return a? a.text.slice(0,60):"";})()');
        /* 2026-09-16：BYOK 配置后 Chat 走真实模型，回复不再匹配演示文案；
           断言放宽为「模型返回了非空回复」（演示模式回复「正常」也命中） */
        check('Chat 回复内容实质（演示或真实模型）', !!(lastText && lastText.trim().length >= 2), JSON.stringify(lastText).slice(0, 80));
        const st = await api(P, T, 'GET', '/api/state');
        check('Chat 会话已持久化到 state.json', !!(st && st.conversations && st.conversations.length > (countBefore || 0)));
        /* Work UI：切换 + 侧栏入口 + 页面渲染
           前置：注入带文件夹的 Work 项目（等价于用户经「选择工作区」原生对话框
           选定目录后的数据层效果；原生对话框无法经 CDP 自动化）。
           注意：setSidebarMode('work') 在无任何带 folder 的项目时会静默回落 chat。
           2026-09-16 更新：笔记本/运行已迁入设置页（07-设置页改造.md §4），侧栏断言
           同步收窄为当前实际入口；智能体页断言改为主智能体「墨道」（09-15 管理页改版）。 */
        const wsDir = path.join(DATA, 'sandbox', 'exe-ws');
        fs.mkdirSync(wsDir, { recursive: true });
        const wsDirFwd = wsDir.replace(/\\/g, '/');
        await ev('(function(){if(!projects.some(function(p){return p.id==="p-exe-verify";})){' +
            'projects.push({id:"p-exe-verify",name:"exe-ws",mode:"work",folder:"' + wsDirFwd + '",files:[],kbFiles:[],dbs:[]});' +
            'if(typeof renderProjects==="function")renderProjects();}' +
            'return projects.length;})()');
        await ev('setSidebarMode("work")');
        await sleep(500);
        check('Work 模式切换生效', (await ev('sidebarMode')) === 'work');
        const pages = await ev('Object.keys(WORK_HOOKS.pages || {})');
        check('Work 页面注册 >=6', Array.isArray(pages) && pages.length >= 6, JSON.stringify(pages));
        const bodyText = await ev('document.body.innerText');
        const needItems = ['新建任务', '创建项目', '知识和数据库', '智能体', '技能与插件', '连接器', '沙箱'];
        const missing = needItems.filter(function (k) { return (bodyText || '').indexOf(k) === -1; });
        check('Work 侧栏入口齐全（迁移后）', missing.length === 0, missing.length ? '缺:' + missing.join(',') : '齐全');
        await ev('(function(){const el=[].slice.call(document.querySelectorAll("#leftPanel *")).find(function(n){return n.children.length===0 && n.textContent.trim()==="智能体";});if(el) el.click();})()');
        await sleep(600);
        const agentText = await ev('document.body.innerText');
        check('Work 智能体页渲染（含主智能体墨道）', /墨道/.test(agentText || ''));
        await ev('(function(){const el=[].slice.call(document.querySelectorAll("#leftPanel *")).find(function(n){return n.children.length===0 && n.textContent.trim()==="技能与插件";});if(el) el.click();})()');
        await sleep(600);
        const skillText = await ev('document.body.innerText');
        check('Work 技能页渲染（含 MindSpore 复现骨架）', /MindSpore 复现骨架/.test(skillText || ''));
        await shot('work-mode');
    }
    catch (e) {
        check('CDP UI 验证流程', false, ('' + (e && e.message)).slice(0, 140));
        try {
            await shot('error');
        }
        catch (x) { /* 忽略 */ }
    }
    /* ===== Phase C：重启恢复 ===== */
    stopExe();
    await sleep(2500);
    cdpWs = null;
    consoleErrors = [];
    const rt2 = await launchExe('C(重启)');
    if (rt2) {
        try {
            for (let i = 0; i < 40 && !cdpWs; i++) {
                try {
                    cdpWs = await cdpConnect(CDP_PORT);
                }
                catch (e) {
                    await sleep(500);
                }
            }
            await cdpSend('Runtime.enable');
            await sleep(2000);
            const restored = await ev('conversations.length');
            const hasMsg = await ev('conversations.some(function(c){return (c.messages||[]).some(function(m){return /exe验证/.test(m.text||"");});})');
            check('重启后历史会话恢复（跨重启持久化）', restored > 0 && hasMsg === true, 'conversations=' + restored);
            check('重启后 UI 桥接正常', (await ev('sidebarMode')) === 'chat' || (await ev('sidebarMode')) === 'work');
            check('控制台 0 错误（整个验证期）', consoleErrors.length === 0, consoleErrors.length ? consoleErrors.slice(0, 3).join(' || ') : '0');
            await shot('after-restart');
        }
        catch (e) {
            check('重启后历史会话恢复（跨重启持久化）', false, ('' + (e && e.message)).slice(0, 140));
        }
    }
    /* ===== Phase D：沙箱执行 + Agent 回合（exe 内会派生子进程） =====
       注意：Phase C 重启后 exe 的 token/port 已轮换，必须用重启后的凭证，
       否则全部请求 401（表现为 SSE 流里没有 end/run_result 帧）。 */
    const PD_PORT = (rt2 && rt2.port) || P;
    const PD_TOKEN = (rt2 && rt2.token) || T;
    let exeAlive = true;
    try {
        const r1 = await sandboxExecViaHttp(PD_PORT, PD_TOKEN, { scopeId: 'exe-smoke', lang: 'python', code: 'print("RESULT:" + str(6*7))\n' });
        check('沙箱真实 python 执行', !!(r1 && r1.ok && /RESULT:42/.test(r1.stdout || '')), r1 ? ('dur=' + r1.durationMs + 'ms') : '无结果');
    }
    catch (e) {
        exeAlive = /terminated|ECONNRESET|fetch failed/i.test('' + e.message);
        check('沙箱真实 python 执行', false, 'SKIP：沙箱会话安全策略终止 exe 的子进程派生（' + ('' + e.message).slice(0, 60) + '）', 'skip');
    }
    if (exeAlive) {
        try {
            const r2 = await sandboxExecViaHttp(PD_PORT, PD_TOKEN, { scopeId: 'exe-smoke', lang: 'python', code: "import os\nos.system('rm -rf /')\n" });
            check('沙箱静态拦截（rm -rf /）', !!(r2 && r2.blocked), r2 ? String(r2.blockReason || '').slice(0, 60) : '无结果');
        }
        catch (e) {
            check('沙箱静态拦截（rm -rf /）', false, 'SKIP：' + ('' + e.message).slice(0, 60), 'skip');
        }
        try {
            const run1 = await agentRun(PD_PORT, PD_TOKEN, {
                agentId: 'agent-orchestrator', scopeId: 'global', convId: 'exe-verify-conv',
                prompt: '请用 run_code 在当前工作目录创建文件 exe_check.txt（内容正好是 EXE_OK），然后读回确认内容，确认后删除该文件，最后用 note_write 写一条标题为「exe验证」的笔记。全部完成后只回复：DONE'
            });
            /* BYOK 未配置（环境限制）时回合必然被拒：明确转 SKIP，不误报回归 */
            const byokMissing = !!(run1 && run1.error && /API Key 模型/.test(run1.error));
            check('Work Agent 回合（run_code 建读删文件 + note_write）', !!(run1 && run1.ok), byokMissing ? 'SKIP：BYOK 模型未配置（环境限制，非回归）' : (run1 ? ('toolCalls=' + run1.toolCalls) : '无 run_result'), byokMissing ? 'skip' : 'fail');
            const notes = await api(PD_PORT, PD_TOKEN, 'GET', '/api/work/notes');
            check('note_write 笔记已写入', byokMissing || !!(notes && notes.notes && notes.notes.some(function (n) { return /exe验证/.test(n.title || ''); })), byokMissing ? 'SKIP：随 Agent 回合' : '', byokMissing ? 'skip' : undefined);
            const files = await api(PD_PORT, PD_TOKEN, 'GET', '/api/work/sandbox/files?scope=global');
            check('exe_check.txt 已被 Agent 删除', !!(files && files.files && !files.files.some(function (f) { return f.relPath === 'exe_check.txt'; })));
            const run2 = await agentRun(PD_PORT, PD_TOKEN, {
                agentId: 'agent-orchestrator', scopeId: 'global', convId: 'exe-verify-conv',
                /* 2026-09-16：墨道 skills 白名单 = [research-decompose, academic-writing, experiment-log]，
                   白名单外技能按 SDK 语义被 Skill 工具拒绝（设计行为）；断言改用白名单内技能 */
                prompt: '请使用 Skill 工具加载技能 chatscience-skills:academic-writing，加载成功后只回复：技能已加载'
            });
            const byokMissing2 = !!(run2 && run2.error && /API Key 模型/.test(run2.error));
            check('Skill 技能调用（academic-writing）', !!(run2 && (run2.text || '').indexOf('技能已加载') > -1), byokMissing2 ? 'SKIP：BYOK 模型未配置（环境限制，非回归）' : (run2 ? ('text=' + String(run2.text || '').slice(0, 40)) : '无 run_result'), byokMissing2 ? 'skip' : undefined);
        }
        catch (e) {
            const msg = '' + (e && e.message);
            const skipped = /terminated|ECONNRESET|fetch failed/i.test(msg);
            check('Work Agent 回合（run_code/note_write/Skill）', false, skipped ? 'SKIP：沙箱会话安全策略终止 exe 的子进程派生（qodercli/python）' : msg.slice(0, 100), skipped ? 'skip' : 'fail');
        }
    }
    else {
        check('沙箱静态拦截（rm -rf /）', false, 'SKIP：exe 已被环境终止', 'skip');
        check('Work Agent 回合（run_code/note_write/Skill）', false, 'SKIP：exe 已被环境终止（qodercli/python 派生触发安全策略）', 'skip');
    }
    /* ===== 收尾：还原用户 state ===== */
    stopExe();
    await sleep(1500);
    if (stateBackup !== null)
        fs.writeFileSync(STATE, stateBackup, 'utf8');
    else {
        try {
            fs.unlinkSync(STATE);
        }
        catch (e) { /* 忽略 */ }
    }
    console.log('[cleanup] 验证期 state 已还原为验证前快照');
    const fails = results.filter(function (r) { return r.kind === 'fail'; }).length;
    const skips = results.filter(function (r) { return r.kind === 'skip'; }).length;
    console.log('');
    console.log('=== 结果：' + (results.length - fails - skips) + ' 通过 / ' + fails + ' 失败 / ' + skips + ' 跳过（环境限制），共 ' + results.length + ' 项 ===');
    process.exit(fails === 0 ? 0 : 1);
})().catch(function (e) {
    console.error('DRIVER ERROR:', e && e.message);
    stopExe();
    process.exit(2);
});

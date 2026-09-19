// @ts-nocheck
/* 独立运行的全局脚本（宽松配置编译，与既有 verify 脚本一致） */
/* ==================================================================
   agent-system-verify.js · 04 策划案大版本更新验证（A/C/E 组验收）
   覆盖：
   V1  隔离不回归：工具列表不含本机 MCP 泄漏 + 12 个科研工具注入
   V2  主智能体播种：agent-orchestrator 进 agents 注册表
   V3  七类子智能体定义静态检查（description/tools 无 Agent/maxTurns/skills 存在）
   V4  技能发现：17 个内建技能（12 + 5 新增）
   V5  工具守卫单测：A1 超时 / A2 熔断 / A3 错误结构
   V6  六个新科研工具直调单测（C1，纯本地）
   V7  resolveModel 映射单测（A7/B1/B2，不发真实请求）
   V8  审计落盘：data/work-audit.jsonl 出现 tool_start/tool_end 记录（A4）
   V9  基础回合回归：普通智能体读文件→写产物（既有行为不回退）
   V10 主智能体：简单任务不误拉起子智能体（E 组验收）
   V11 主智能体：委派任务触发 Agent 工具 + 子智能体活动（E1/E2/E3 核心）
   直连本地后端（脚本内自起服务，随机端口）。依赖 server/qoder.json 的
   accessToken 与 Qoder 平台连通（真实运行）。
   ================================================================== */
const path = require('path');
const fs = require('fs');
const { startServer } = require('../server/index');
const qoderMod = require('../server/qoder');
const sciTools = require('../server/sci-tools');
const APP_ROOT = path.join(__dirname, '..');
const TOKEN = 'verify-' + Math.random().toString(36).slice(2);
const PORT = 37400 + Math.floor(Math.random() * 1500);
const results = [];
function record(id, name, ok, detail) {
    results.push({ id, name, ok: !!ok, detail: String(detail || '').slice(0, 400) });
    console.log((ok ? '  PASS' : '  FAIL') + '  [' + id + '] ' + name + (detail ? '  — ' + String(detail).slice(0, 220) : ''));
}
/* 额度耗尽等环境阻断：显式 SKIP（不计失败也不虚报通过），充值后重跑即可补验 */
function recordSkip(id, name, detail) {
    results.push({ id, name, ok: null, skipped: true, detail: String(detail || '').slice(0, 400) });
    console.log('  SKIP  [' + id + '] ' + name + '  — ' + String(detail).slice(0, 220));
}
function isCreditError(result) {
    return ((result && result.errors) || []).some(function (e) { return /credit usage limit/i.test(String(e)); });
}
function runAgent(body) {
    return new Promise(function (resolve, reject) {
        const events = [];
        fetch('http://127.0.0.1:' + PORT + '/api/work/agent/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
            body: JSON.stringify(body)
        }).then(function (resp) {
            if (!resp.ok || !resp.body) return reject(new Error('HTTP ' + resp.status));
            const reader = resp.body.getReader();
            const dec = new TextDecoder();
            let buf = '';
            (function pump() {
                reader.read().then(function (r) {
                    if (r.done) return resolve(events);
                    buf += dec.decode(r.value, { stream: true });
                    let i;
                    while ((i = buf.indexOf('\n')) > -1) {
                        const line = buf.slice(0, i).trim();
                        buf = buf.slice(i + 1);
                        if (!line.startsWith('data:')) continue;
                        try { events.push(JSON.parse(line.slice(5).trim())); } catch (e) { }
                    }
                    pump();
                }).catch(reject);
            })();
        }).catch(reject);
    });
}
/* 真实运行统一用 lite 档（0 Credit）：当前 Qoder 平台账户付费额度已耗尽，
   lite 不计费可完成全部 E2E 断言（隔离/轨迹/委派/审计与档位无关）。
   额度恢复后可把 model 改回 performance 复跑。 */
const BASE_AGENT = {
    id: 'verify-base', name: '基础验证', model: 'lite',
    permissionMode: 'acceptEdits', maxTurns: 14,
    tools: { sdk: ['Read', 'Write', 'Bash', 'Glob'], builtin: ['science'] },
    skills: []
};
const ORCH = {
    id: 'agent-orchestrator', name: '墨道主智能体', model: 'lite',
    permissionMode: 'acceptEdits', maxTurns: 24,
    tools: { sdk: ['Read', 'Write', 'Glob', 'Grep', 'Agent'], builtin: ['science'], scienceTools: ['kb_search', 'note_write'] },
    skills: [],
    systemPrompt: '你是「墨道」主智能体：唯一有权调度子智能体的角色。简单问题直接回答，绝不机械拉起子智能体；委派时把任务与必要材料写进委派提示词。'
};
async function main() {
    startServer(PORT, TOKEN, APP_ROOT, null);
    await new Promise(function (r) { setTimeout(r, 1200); });
    const H = { Authorization: 'Bearer ' + TOKEN };
    const cfg = await (await fetch('http://127.0.0.1:' + PORT + '/api/work/qoder/config', { headers: H })).json();
    if (!cfg.hasToken) {
        console.error('未配置 accessToken（server/qoder.json），跳过真实运行类验证');
        process.exit(2);
    }

    /* ---------- 静态检查（不依赖网络） ---------- */
    /* V3 七类子智能体定义 */
    const specs = qoderMod._subagentSpecs;
    record('V3a', '七类子智能体已定义', Array.isArray(specs) && specs.length === 7, specs.map(function (s) { return s.id; }).join(','));
    const badSpec = (specs || []).filter(function (s) {
        return !s.whenToUse || s.whenToUse.length < 10
            || s.sdkTools.indexOf('Agent') > -1
            || !s.maxTurns || s.maxTurns < 4
            || !Array.isArray(s.skills) || !s.skills.length;
    });
    record('V3b', '子智能体定义约束（whenToUse/无Agent/maxTurns/skills）', badSpec.length === 0, badSpec.map(function (s) { return s.id; }).join(',') || '全部满足');
    /* 子智能体技能引用都在技能清单内（在服务启动播种后检查） */
    const skillsResp = await (await fetch('http://127.0.0.1:' + PORT + '/api/work/skills', { headers: H })).json();
    const skillSlugs = (skillsResp.skills || []).map(function (s) { return s.slug; });
    const missingSkills = [];
    (specs || []).forEach(function (s) { s.skills.forEach(function (k) { if (skillSlugs.indexOf(k) < 0) missingSkills.push(s.id + ':' + k); }); });
    record('V3c', '子智能体 skills 引用全部存在', missingSkills.length === 0, missingSkills.join(',') || '全部存在');

    /* V4 技能发现：17 个内建（12 + 5 新增） */
    const newSkills = ['research-decompose', 'causal-variables', 'simulation-assumption', 'stats-interpretation', 'academic-writing'];
    const haveNew = newSkills.filter(function (s) { return skillSlugs.indexOf(s) > -1; });
    record('V4a', '5 项新技能已发现', haveNew.length === 5, haveNew.length + '/5 · ' + haveNew.join(','));
    const builtins = (skillsResp.skills || []).filter(function (s) { return s.builtin; }).length;
    record('V4b', '内建技能总数 ≥ 17', builtins >= 17, 'builtin=' + builtins + ' total=' + skillSlugs.length);

    /* V2 主智能体播种 */
    const agentsResp = await (await fetch('http://127.0.0.1:' + PORT + '/api/work/agents', { headers: H })).json();
    const orch = (agentsResp.agents || []).filter(function (a) { return a.id === 'agent-orchestrator'; });
    record('V2', 'agent-orchestrator 已播种进注册表', orch.length === 1, orch.length ? 'tools.sdk=' + (orch[0].tools && orch[0].tools.sdk ? orch[0].tools.sdk.join('+') : '∅') : '未找到');

    /* V5 工具守卫单测 */
    {
        const g = qoderMod._toolGuardInternals;
        /* A3 错误结构 */
        const err = g.mcpError('t_x', 'network', 'boom', true);
        const errText = err.content && err.content[0] && err.content[0].text || '';
        record('V5a', 'A3 统一错误结构（tool/type/retryable）', err.isError === true && errText.indexOf('tool=t_x') > -1 && errText.indexOf('type=network') > -1 && errText.indexOf('retryable=yes') > -1, errText.split('\n')[0]);
        /* A1 超时：handler 挂起 300ms，注入 50ms 超时上限 */
        const st1 = g.newState();
        const guardedSlow = g.guardTool('slow_tool', st1, false, function () { return new Promise(function (resolve) { setTimeout(function () { resolve({ content: [{ type: 'text', text: 'late' }] }); }, 300); }); }, 50);
        const t0 = Date.now();
        const r1 = await guardedSlow({});
        const dur1 = Date.now() - t0;
        const r1text = r1.content && r1.content[0] && r1.content[0].text || '';
        record('V5b', 'A1 超时保护：挂起调用被中止且归入工具错误', r1.isError === true && r1text.indexOf('type=timeout') > -1 && dur1 < 250, '耗时=' + dur1 + 'ms · ' + r1text.split('\n')[0]);
        /* A2 熔断：阈值 3——2 次失败未熔断，第 3 次达阈值打开，第 4 次直接熔断拒绝（handler 不再触达） */
        const st2 = g.newState();
        let calls = 0;
        const guardedFail = g.guardTool('fail_tool', st2, false, function () { calls++; return Promise.resolve({ isError: true, content: [{ type: 'text', text: 'failure #' + calls }] }); });
        await guardedFail({}); await guardedFail({});
        const notYetOpen = st2.openUntil === 0;
        const third = await guardedFail({});
        const thresholdOpen = st2.openUntil > Date.now() - 10 && calls === 3;
        const fourth = await guardedFail({});
        const fourthText = fourth.content && fourth.content[0] && fourth.content[0].text || '';
        const breakerBlocked = fourthText.indexOf('circuit-open') > -1 && calls === 3;
        record('V5c', 'A2 熔断：连续 3 次失败后拒绝并给出冷却提示', third.isError === true && notYetOpen && thresholdOpen && breakerBlocked,
            'handler 调用=' + calls + '（第 4 次未触达 handler）· 首行=' + fourthText.split('\n')[0]);
        /* 成功调用重置计数 */
        const st3 = g.newState();
        let failCalls = 0;
        const guardedFail3 = g.guardTool('fail3', st3, false, function () { failCalls++; return Promise.resolve({ isError: true, content: [{ type: 'text', text: 'x' }] }); });
        const guardedOk3 = g.guardTool('ok3', st3, false, function () { return Promise.resolve({ content: [{ type: 'text', text: 'fine' }] }); });
        await guardedFail3({});
        await guardedOk3({});
        record('V5d', '成功调用重置熔断计数', failCalls === 1 && st3.consecutiveFailures === 0 && st3.openUntil === 0, 'failures=' + st3.consecutiveFailures);
    }

    /* V6 六个新科研工具直调（C1 纯本地路径） */
    {
        const lc = sciTools.latexCheck({ latex: '\\begin{aligned} f(x) &= \\frac{1}{2}\\sum_{i=1}^n (x_i - \\mu)^2 \\\\ &= \\frac{n}{2}\\sigma^2 \\end{aligned}' });
        record('V6a', 'latex_check：合法公式通过', lc.ok === true && lc.issues.length === 0, 'commands=' + lc.stats.commands);
        const lcBad = sciTools.latexCheck({ latex: '\\begin{aligned} f(x} = \\frac{1}{2' });
        record('V6b', 'latex_check：括号/环境错误被捕获', lcBad.ok === false && lcBad.issues.length >= 2, lcBad.issues.map(function (i) { return i.type; }).join(','));
        const uc = sciTools.unitConvert({ value: 1, from: 'GPa', to: 'MPa' });
        record('V6c', 'unit_convert：GPa→MPa=1000', uc.value === 1000, uc.formula);
        const ut = sciTools.unitConvert({ value: 100, from: '°C', to: 'K' });
        record('V6d', 'unit_convert：°C→K=373.15', Math.abs(ut.value - 373.15) < 0.01, String(ut.value));
        const nn = sciTools.nameNormalize({ name: 'Attention-Dim Head count', style: 'snake_case' });
        record('V6e', 'name_normalize：多风格互转', nn.result === 'attention_dim_head_count' && nn.all && nn.all.camelCase === 'attentionDimHeadCount', JSON.stringify(nn.all && nn.all.snake_case));
        const fc = sciTools.figureCaption({ kind: 'figure', what: '三种方法的收敛速度对比', method: '折线图（对数 y 轴）', hasErrorBars: true, significance: '* p<0.05' });
        record('V6f', 'figure_caption：图注含要素与清单', fc.caption && fc.caption.indexOf('图 X') === 0 && fc.caption.indexOf('p<0.05') > -1 && Array.isArray(fc.checklist) && fc.checklist.length >= 3, String(fc.caption).slice(0, 60));
        const ke = sciTools.keywordExpand({ keywords: ['RLHF', 'sim2real'] });
        const kwOk = ke.expansions['RLHF'] && ke.expansions['RLHF'].join(' ').indexOf('human feedback') > -1
            && ke.expansions['sim2real'] && ke.expansions['sim2real'].join(' ').indexOf('domain randomization') > -1
            && typeof ke.booleanQuery === 'string' && ke.booleanQuery.indexOf('AND') > -1;
        record('V6g', 'keyword_expand：同义表命中 + 布尔检索式', kwOk, 'query=' + String(ke.booleanQuery).slice(0, 80));
        const dc = await sciTools.doiCite({ doi: 'not-a-doi' });
        record('V6h', 'doi_cite：非法 DOI 语法被拒', !!dc.error, dc.error);
    }

    /* V7 BYOK-only 锁定路由（不发真实请求）：resolveModel 恒返回绑定的 API Key 模型，
       平台订阅档位路由已移除 */
    {
        const mk = qoderMod.makeModelResolver;
        const logNoop = function () { };
        const ctx = function (purpose) { return { purpose: purpose, sessionId: 's', turnIndex: 0, availableModels: [] }; };
        const r = mk('qwen3.8-flash-pg');
        record('V7a', 'BYOK 锁定：main purpose 返回绑定的 API Key 模型', r(ctx('main')).model === 'qwen3.8-flash-pg', 'main=' + r(ctx('main')).model);
        record('V7b', 'BYOK 锁定与 purpose 无关：task/compact/utility 同模型', r(ctx('task')).model === 'qwen3.8-flash-pg' && r(ctx('compact')).model === 'qwen3.8-flash-pg' && r(ctx('utility')).model === 'qwen3.8-flash-pg', 'task=' + r(ctx('task')).model);
    }

    /* ---------- 真实运行类验证 ---------- */
    const verifyWork = path.join(APP_ROOT, 'data', 'sandbox', 'agent-sys-verify', 'work');
    fs.mkdirSync(path.join(verifyWork, 'out'), { recursive: true });
    fs.writeFileSync(path.join(verifyWork, 'planck.txt'), 'h = 6.62607015e-34\nprint(6.62607015e-34 * 2)\n', 'utf8');

    /* V9 基础回合回归（既有行为不回退） */
    const SKIP_NOTE = 'Qoder 平台账户额度耗尽（credit usage limit），充值/重置后重跑本脚本补验';
    let events = await runAgent({
        agentDef: BASE_AGENT, convId: 'asv-1', scopeId: 'agent-sys-verify',
        prompt: '当前目录有 planck.txt。读取它，说出第二行代码会输出的数值，并把该数值只写进 out/v9.txt。完成后一句话总结。'
    });
    const start9 = events.find(function (e) { return e.evt === 'run_start'; }) || {};
    const tools9 = start9.tools || [];
    const end9 = events.find(function (e) { return e.evt === 'run_result'; }) || {};
    const r9 = end9.result || {};
    const creditBlocked = isCreditError(r9);
    if (creditBlocked) {
        /* 额度耗尽：本轮所有依赖真实运行的断言显式 SKIP */
        recordSkip('V1a', '隔离不回归：无本机 MCP 泄漏（新增工具后）', SKIP_NOTE);
        recordSkip('V1b', '12 个科研工具全部注入', SKIP_NOTE);
        recordSkip('V9', '基础回合成功且产物正确', SKIP_NOTE);
        recordSkip('V9b', '流式事件与工具轨迹完整', SKIP_NOTE);
        recordSkip('V9c', 'N2 预留：tool_start 携带 parentToolUseId 字段', SKIP_NOTE);
        recordSkip('V8', 'A4 审计落盘', SKIP_NOTE);
    } else {
        const leaked9 = tools9.filter(function (t) { return t.indexOf('mcp__') === 0 && t.indexOf('mcp__chatscience__') !== 0; });
        record('V1a', '隔离不回归：无本机 MCP 泄漏（新增工具后）', leaked9.length === 0, '泄漏=' + leaked9.slice(0, 3).join(','));
        const sciInTools = tools9.filter(function (t) { return t.indexOf('mcp__chatscience__') === 0; });
        record('V1b', '12 个科研工具全部注入', sciInTools.length >= 12, sciInTools.length + ' 个: ' + sciInTools.map(function (t) { return t.replace('mcp__chatscience__', ''); }).join(','));
        const v9path = path.join(verifyWork, 'out', 'v9.txt');
        const v9 = fs.existsSync(v9path) ? fs.readFileSync(v9path, 'utf8').trim() : '';
        record('V9', '基础回合成功且产物正确（1.32521403e-33）', r9.ok === true && v9 === '1.32521403e-33', 'ok=' + r9.ok + ' v9.txt=' + v9 + ' turns=' + r9.numTurns);
        const delta9 = events.filter(function (e) { return e.evt === 'delta'; }).length;
        const ts9 = events.filter(function (e) { return e.evt === 'tool_start'; }).length;
        const te9 = events.filter(function (e) { return e.evt === 'tool_end'; }).length;
        record('V9b', '流式事件与工具轨迹完整', delta9 > 0 && ts9 > 0 && ts9 === te9, 'delta=' + delta9 + ' tool_start=' + ts9 + ' tool_end=' + te9);
        const ptid9 = events.find(function (e) { return e.evt === 'tool_start' && e.parentToolUseId !== undefined; });
        record('V9c', 'N2 预留：tool_start 携带 parentToolUseId 字段', !!ptid9, '主会话值=' + (ptid9 ? String(ptid9.parentToolUseId) : '字段缺失'));
        /* V8 审计落盘（本回合运行应已产生记录） */
        {
            const auditPath = path.join(APP_ROOT, 'data', 'work-audit.jsonl');
            const ok8 = fs.existsSync(auditPath);
            let entries = [];
            if (ok8) {
                entries = fs.readFileSync(auditPath, 'utf8').split('\n').filter(Boolean).map(function (l) { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
            }
            const hasStart = entries.some(function (e) { return e.event === 'tool_start' && e.tool; });
            const hasEnd = entries.some(function (e) { return e.event === 'tool_end' && e.durationMs !== undefined; });
            record('V8', 'A4 审计落盘：tool_start/tool_end 记录存在', hasStart && hasEnd, '总条数=' + entries.length + ' start=' + hasStart + ' end(含耗时)=' + hasEnd);
        }
    }

    /* V10 主智能体：简单任务不误拉起子智能体 */
    events = await runAgent({
        agentDef: ORCH, convId: 'asv-2', scopeId: 'agent-sys-verify',
        prompt: '用一句话解释什么是过拟合，不需要查阅任何文件或执行任何任务。'
    });
    const end10 = events.find(function (e) { return e.evt === 'run_result'; }) || {};
    const r10 = end10.result || {};
    if (isCreditError(r10)) {
        recordSkip('V10', '简单任务直接回答，不委派子智能体', SKIP_NOTE);
    } else {
        const ts10 = events.filter(function (e) { return e.evt === 'tool_start'; });
        const agentCalls10 = ts10.filter(function (e) { return e.name === 'Agent'; }).length;
        record('V10', '简单任务直接回答，不委派子智能体', r10.ok === true && agentCalls10 === 0,
            'ok=' + r10.ok + ' Agent 调用=' + agentCalls10 + ' 回答片段=' + String(r10.text || '').slice(0, 50));
    }

    /* V11 主智能体：委派任务 → Agent 工具 + 子智能体活动 */
    events = await runAgent({
        agentDef: ORCH, convId: 'asv-3', scopeId: 'agent-sys-verify',
        prompt: '请把这个实验记录交给资料归档子智能体归档：「2026-09-15 注意力温度扫描实验：温度系数 1.2 时收敛最快，验证了软掩码假设」。归档完成后汇报归档结果。'
    });
    const ts11 = events.filter(function (e) { return e.evt === 'tool_start'; });
    const end11 = events.find(function (e) { return e.evt === 'run_result'; }) || {};
    const r11 = end11.result || {};
    if (isCreditError(r11)) {
        recordSkip('V11a', '委派发生：Agent 工具被调用', SKIP_NOTE);
        recordSkip('V11b', '子智能体活动可观测（subagent_start/stop 通知）', SKIP_NOTE);
        recordSkip('V11c', 'N2：子智能体消息携带非空 parentToolUseId', SKIP_NOTE);
        recordSkip('V11d', '端到端成果：归档笔记真实落盘', SKIP_NOTE);
    } else {
        const agentCall11 = ts11.find(function (e) { return e.name === 'Agent'; });
        const subagentNotice = events.find(function (e) { return e.evt === 'notice' && (e.code === 'subagent_start' || e.code === 'subagent_stop'); });
        record('V11a', '委派发生：Agent 工具被调用', !!agentCall11, agentCall11 ? 'callId=' + agentCall11.callId + ' args=' + String(agentCall11.args).slice(0, 80) : '未见 Agent 调用；tool 序列=' + ts11.map(function (t) { return t.name; }).join(','));
        record('V11b', '子智能体活动可观测（subagent_start/stop 通知）', !!subagentNotice, subagentNotice ? e2s(subagentNotice) : '无 subagent 通知');
        const ptid11 = ts11.find(function (e) { return e.parentToolUseId !== undefined && e.parentToolUseId !== null; });
        record('V11c', 'N2：子智能体消息携带非空 parentToolUseId（或全程主会话）', ts11.length > 0 && ts11.every(function (e) { return e.parentToolUseId !== undefined; }), ptid11 ? '观察到嵌套 tool 事件 parent=' + String(ptid11.parentToolUseId).slice(0, 12) : '本轮无嵌套工具事件（子智能体仅写笔记）');
        const notesDir = path.join(APP_ROOT, 'data', 'notes');
        let note11 = false;
        if (fs.existsSync(notesDir)) {
            const files = fs.readdirSync(notesDir).filter(function (f) { return f.endsWith('.json'); });
            for (const f of files) {
                try {
                    const n = JSON.parse(fs.readFileSync(path.join(notesDir, f), 'utf8'));
                    if ((String(n.title || '') + String(n.content || '')).indexOf('注意力温度扫描') > -1) { note11 = true; break; }
                } catch (e) { }
            }
        }
        record('V11d', '端到端成果：归档笔记真实落盘', note11 && r11.ok === true, 'note=' + note11 + ' ok=' + r11.ok + ' 回复=' + String(r11.text || '').slice(0, 60));
    }

    /* 汇总（写独立 metrics，不触碰既有基线文件） */
    const pass = results.filter(function (r) { return r.ok === true; }).length;
    const skips = results.filter(function (r) { return r.ok === null; }).length;
    const fails = results.filter(function (r) { return r.ok === false; }).length;
    const metricsFile = path.join(__dirname, 'agent-system-metrics.json');
    fs.writeFileSync(metricsFile, JSON.stringify({ at: new Date().toISOString(), total: results.length, pass: pass, skip: skips, fail: fails, results: results }, null, 2), 'utf8');
    console.log('\n=== 04 Agent 系统大版本验证: PASS ' + pass + ' / SKIP ' + skips + ' / FAIL ' + fails + '（共 ' + results.length + ' 项） ===');
    if (skips > 0) console.log('SKIP 项为环境阻断（账户额度），非实现缺陷——充值/重置后重跑本脚本补验');
    console.log('metrics: ' + metricsFile);
    process.exit(fails === 0 ? 0 : 1);
}
function e2s(o) { return JSON.stringify(o).slice(0, 120); }
main().catch(function (e) { console.error('verify 异常:', e); process.exit(2); });

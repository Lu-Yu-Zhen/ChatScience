// @ts-nocheck
/* 独立运行的全局脚本（字节精确迁移自 JS）：关闭逐行类型检查，
   产物与原 JS 行为一致；语法错误仍会在编译期暴露。 */
/* ==================================================================
   kb-verify.js · N6 验证：知识库 BM25 检索（前端推送索引 → kb_search 工具）
   ① 索引写入与状态可见  ② BM25 相关性排序（直连单测）
   ③ 无索引时返回引导文案而非空数组  ④ Agent 会话内 kb_search 工具真实命中
   ================================================================== */
const path = require('path');
const fs = require('fs');
const { startServer } = require('../server/index');
const { createKb } = require('../server/kb');
const APP_ROOT = path.join(__dirname, '..');
const TOKEN = 'verify-' + Math.random().toString(36).slice(2);
const PORT = 37200 + Math.floor(Math.random() * 1200);
const results = [];
function record(id, name, ok, detail) {
    results.push({ id, name, ok: !!ok, detail: String(detail || '').slice(0, 400) });
    console.log((ok ? '  PASS' : '  FAIL') + '  [' + id + '] ' + name + (detail ? '  — ' + String(detail).slice(0, 180) : ''));
}
function api(method, p, body) {
    return fetch('http://127.0.0.1:' + PORT + p, {
        method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
        body: body === undefined ? undefined : JSON.stringify(body)
    }).then(function (r) { return r.json(); });
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
const TEXT_A = [
    '高效注意力机制研究。线性注意力的复杂度为 O(N)，相比标准注意力的 O(N^2) 大幅降低计算量。',
    'FlashAttention 通过分块计算减少显存访问，长上下文场景下注意力效率提升明显。',
    '稀疏注意力只计算部分位置对，注意力效率进一步提高，适合百万级上下文。'
].join('\n');
const TEXT_B = [
    'MindSpore 复现指南。使用 nn.Cell 构建网络，Model.train 启动训练，CheckpointConfig 保存检查点。',
    '混合精度训练通过 amp_level 参数开启，可显著降低显存占用并加速训练。'
].join('\n');
async function main() {
    startServer(PORT, TOKEN, APP_ROOT, null);
    await new Promise(function (r) { setTimeout(r, 900); });
    /* ① 索引写入 */
    const r1 = await api('POST', '/api/work/kb/index', { kbId: 'kbv', fileName: 'attention-survey.md', text: TEXT_A });
    const r2 = await api('POST', '/api/work/kb/index', { kbId: 'kbv', fileName: 'mindspore-guide.md', text: TEXT_B });
    record('1', '索引写入（分块完成）', r1.chunks > 0 && r2.chunks > 0, JSON.stringify(r1) + ' | ' + JSON.stringify(r2));
    const st = await api('GET', '/api/work/kb/status');
    record('2', '索引状态可见', st.totalFiles === 2, JSON.stringify(st));
    /* ② BM25 相关性排序（直连单测） */
    const kb = createKb(APP_ROOT);
    const s1 = await kb.search({ query: '注意力 效率 attention', kbId: 'kbv' });
    record('3a', 'BM25 命中且注意力文档排前', s1.results.length > 0 && s1.results[0].file === 'attention-survey.md' && s1.results[0].score > 0, s1.results.map(function (r) { return r.file + '(' + r.score + ')'; }).join(' > '));
    const s2 = await kb.search({ query: 'MindSpore 混合精度', kbId: 'kbv' });
    record('3b', '中文 bigram 分词命中 MindSpore 文档', s2.results.length > 0 && s2.results[0].file === 'mindspore-guide.md', s2.results.map(function (r) { return r.file + '(' + r.score + ')'; }).join(' > '));
    const s3 = await kb.search({ query: '量子引力波', kbId: 'kbv' });
    record('3c', '无关查询返回空结果（score 过滤生效）', s3.results.length === 0, 'results=' + s3.results.length);
    /* ③ 无索引 kbId → 引导文案 */
    const s4 = await kb.search({ query: '任何词', kbId: 'kb-empty' });
    record('4', '无索引时返回引导文案而非空数组', !!(s4.hint && s4.hint.indexOf('尚未建立索引') > -1), s4.hint);
    /* ④ Agent 会话内 kb_search 真实命中 */
    const workDir = path.join(APP_ROOT, 'data', 'sandbox', 'verify', 'work');
    fs.mkdirSync(workDir, { recursive: true });
    const events = await runAgent({
        agentDef: { id: 'v', name: 'v', model: 'lite', maxTurns: 3, tools: { sdk: [], builtin: ['science'] }, skills: [] },
        convId: 'verify-kb', scopeId: 'verify',
        prompt: '请调用 kb_search 工具检索「注意力 效率」，然后把排名第一的文件名原样告诉我（只回文件名）。'
    });
    const kbEnd = events.find(function (e) { return e.evt === 'tool_end' && /kb_search/.test((e.result || '') + (e.error || '')) || e.evt === 'tool_end'; });
    const kbHit = events.filter(function (e) { return e.evt === 'tool_end'; })
        .some(function (e) { return (e.result || '').indexOf('attention-survey.md') > -1; });
    record('5', 'Agent 会话内 kb_search 工具真实命中', kbHit, kbHit ? '命中 attention-survey.md' : '工具调用=' + JSON.stringify(events.filter(function (e) { return e.evt === 'tool_start'; }).map(function (e) { return e.name; })));
    const pass = results.filter(function (r) { return r.ok; }).length;
    const all = JSON.parse(fs.existsSync(path.join(__dirname, 'work-metrics.json')) ? fs.readFileSync(path.join(__dirname, 'work-metrics.json'), 'utf8') : '{}');
    all.kbN6 = { at: new Date().toISOString(), total: results.length, pass: pass, results: results };
    fs.writeFileSync(path.join(__dirname, 'work-metrics.json'), JSON.stringify(all, null, 2), 'utf8');
    console.log('\n=== N6 知识库检索验证: ' + pass + '/' + results.length + ' 通过 ===');
    process.exit(pass === results.length ? 0 : 1);
}
main().catch(function (e) { console.error('verify 异常:', e); process.exit(2); });

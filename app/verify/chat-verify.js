/* ==================================================================
   ChatScience AI 聊天验证脚本（API 层）
   - 直调本地后端 /api/chat（与渲染层同一链路）
   - DeepSeek-V4 论文全文注入为 system 上下文
   - 10 轮多轮对话：连贯性、流式 TTFT/吞吐、特殊符号与代码块渲染
   - 输出 verify/metrics.json
   用法：node chat-verify.js <port> <token>
   ================================================================== */
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || '3218';
const TOKEN = process.argv[3] || '';
const BASE = 'http://127.0.0.1:' + PORT;
const MODEL = 'qwen3.8-flash';
const MAX_CTX_CHARS = 170000; /* qwen3.8-flash 上下文 1M tokens，全文注入 */

const paper = fs.readFileSync(path.join(__dirname, 'paper_text.txt'), 'utf8').slice(0, MAX_CTX_CHARS);

const SYSTEM = '你是一位严谨的论文阅读与研究助手。用户提供了论文《DeepSeek-V4》的全文，请基于该文档内容回答问题，必要时引用论文中的章节、公式或实验结论。若问题超出文档范围，请先基于文档回答，再补充通用知识并明确区分。\n\n===== 论文全文开始 =====\n' + paper + '\n===== 论文全文结束 =====';

const ROUNDS = [
  { q: '这篇论文的标题是什么？介绍了哪两个模型？各自有多少参数（总量与激活量）？支持多长的上下文？', check: ['DeepSeek-V4', '1.6T', '284B', 'million', 'context'] },
  { q: 'DeepSeek-V4 的训练目标（预训练目标）是什么？与上一代相比主要改进了什么？', check: [] },
  { q: '论文中提到的核心技术架构有哪些？请给出其中两个技术的中文名称并用一句话解释。', check: [] },
  { q: '我在第 1 轮问过你什么问题？请复述那一轮问题的要点。', check: ['标题', '参数', '上下文'], coherence: true },
  { q: '请用 LaTeX 格式给出论文中一个关键公式（用 $$ 包裹），并解释每个符号的含义。', check: ['$$'] },
  { q: '请给出一段 Python 代码示例，展示如何用伪代码描述论文中的训练流程（用 ``` 代码块）。', check: ['```'] },
  { q: '论文的主要实验结果如何？在哪些基准上与哪些模型对比？效果提升幅度大概是多少？', check: [] },
  { q: '结合你前面几轮的回答，这篇论文最核心的创新点用三点概括，每点不超过 30 字。', check: [], coherence: true },
  { q: '论文有哪些局限性（limitations）或未来工作方向？', check: [] },
  { q: '最后请生成这篇论文的中文摘要（150 字以内），并注明本对话共进行了几轮。', check: ['10'] }
];

function now() { return Date.now(); }
const metrics = { rounds: [], model: MODEL, paperChars: paper.length, startedAt: new Date().toISOString() };

async function chat(messages) {
  const t0 = now();
  const resp = await fetch(BASE + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
    body: JSON.stringify({ providerId: 'bailian', model: MODEL, messages, temperature: 0.3 })
  });
  if (!resp.ok) throw new Error('HTTP ' + resp.status + ' ' + (await resp.text()).slice(0, 200));
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buf = '', full = '', ttft = null, doneInfo = null, err = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n')) > -1) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const p = line.slice(5).trim();
      if (p === '[DONE]') continue;
      try {
        const j = JSON.parse(p);
        if (j.delta) { if (ttft === null && j.delta) ttft = now() - t0; full += j.delta; }
        if (j.done) doneInfo = j;
        if (j.error) err = j.error;
      } catch (e) { /* 忽略 */ }
    }
  }
  if (err) throw new Error(err);
  return { text: full, ttft, total: now() - t0, doneInfo };
}

(async function main() {
  const msgs = [{ role: 'system', content: SYSTEM }];
  let okCount = 0;
  for (let i = 0; i < ROUNDS.length; i++) {
    const r = ROUNDS[i];
    msgs.push({ role: 'user', content: r.q });
    process.stdout.write('round ' + (i + 1) + '/10 ... ');
    try {
      const res = await chat(msgs);
      msgs.push({ role: 'assistant', content: res.text });
      let checkPass = true;
      const missing = [];
      (r.check || []).forEach(function (kw) {
        if (res.text.toLowerCase().indexOf(String(kw).toLowerCase()) === -1) { checkPass = false; missing.push(kw); }
      });
      okCount += checkPass ? 1 : 0;
      metrics.rounds.push({
        round: i + 1,
        question: r.q,
        ttftMs: res.ttft,
        totalMs: res.total,
        chars: res.text.length,
        chunksStreamed: res.doneInfo ? res.doneInfo.chars : null,
        checkKeywords: r.check || [],
        checkPass: checkPass,
        missingKeywords: missing,
        coherence: !!r.coherence,
        answerPreview: res.text.slice(0, 300)
      });
      console.log('OK ttft=' + res.ttft + 'ms total=' + res.total + 'ms chars=' + res.text.length + (checkPass ? '' : ' KEY_MISSING:' + missing.join(',')));
      fs.writeFileSync(path.join(__dirname, 'transcript.txt'), '【第' + (i + 1) + '轮】\nQ: ' + r.q + '\nA: ' + res.text + '\n\n', { flag: i === 0 ? 'w' : 'a' });
    } catch (e) {
      metrics.rounds.push({ round: i + 1, question: r.q, error: e.message });
      console.log('FAIL ' + e.message);
      fs.appendFileSync(path.join(__dirname, 'transcript.txt'), '【第' + (i + 1) + '轮】\nQ: ' + r.q + '\nERROR: ' + e.message + '\n\n');
    }
  }
  const ok = metrics.rounds.filter(r => !r.error);
  metrics.summary = {
    roundsTotal: ROUNDS.length,
    roundsOk: ok.length,
    successRate: (ok.length / ROUNDS.length * 100).toFixed(1) + '%',
    keywordPassRate: okCount + '/' + ROUNDS.length,
    avgTtftMs: ok.length ? Math.round(ok.reduce((s, r) => s + (r.ttftMs || 0), 0) / ok.length) : null,
    avgTotalMs: ok.length ? Math.round(ok.reduce((s, r) => s + (r.totalMs || 0), 0) / ok.length) : null,
    avgChars: ok.length ? Math.round(ok.reduce((s, r) => s + (r.chars || 0), 0) / ok.length) : null
  };
  metrics.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(__dirname, 'metrics.json'), JSON.stringify(metrics, null, 2), 'utf8');
  console.log('\nSUMMARY ' + JSON.stringify(metrics.summary, null, 2));
})().catch(function (e) { console.error('FATAL', e); process.exit(1); });

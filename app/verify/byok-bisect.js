// 二分实验：定位 runWorkTurn 附加选项中哪一项触发 credits 拒绝
const path = require('path');
const fs = require('fs');
const APP = 'D:/ChatScience/app/dist/ChatScience-win32-x64/resources/app';
const dynamicImport = new Function('s', 'return import(s);');

const variant = process.argv[2] || 'A';

(async () => {
  const sdk = await dynamicImport('@qodercn-ai/qodercn-agent-sdk');
  const mod = sdk.default || sdk;
  const qoderCfg = JSON.parse(fs.readFileSync(path.join(APP, 'server', 'qoder.json'), 'utf8'));
  const base = {
    auth: mod.accessToken(qoderCfg.accessToken),
    cwd: path.join(APP, 'data', 'sandbox', 'global', 'work'),
    maxTurns: 4, model: 'qwen3.8-flash-pg', settingSources: [], strictMcpConfig: true
  };

  const variants = {
    /* A：+ resolveModel 锁定 */
    A: () => ({
      ...base,
      resolveModel: () => ({ model: 'qwen3.8-flash-pg' }),
      resolveModelTimeoutMs: 800
    }),
    /* B：+ systemPrompt preset qodercli */
    B: () => ({
      ...base,
      systemPrompt: { type: 'preset', preset: 'qodercli', append: '你是墨道主智能体。' }
    }),
    /* C：+ includePartialMessages */
    C: () => ({ ...base, includePartialMessages: true }),
    /* D：+ permissionMode acceptEdits */
    D: () => ({ ...base, permissionMode: 'acceptEdits' }),
    /* E：+ tools 白名单（含 mcp 名） */
    E: () => ({ ...base, tools: ['Read', 'Glob', 'Grep', 'mcp__chatscience__kb_search'], allowedTools: ['Read', 'Glob', 'Grep', 'mcp__chatscience__kb_search'] })
  };

  const options = variants[variant] ? variants[variant]() : base;
  const q = mod.query({
    prompt: '请只回复四个字：链路正常',
    options: options
  });
  for await (const msg of q) {
    if (msg.type === 'result') {
      console.log('[' + variant + '] ok=' + !msg.is_error + ' errors=' + JSON.stringify(msg.errors || []) + ' text=' + String(msg.result || '').slice(0, 120));
      break;
    }
  }
  process.exit(0);
})().catch((e) => { console.error('[' + variant + '] ERR: ' + (e && e.message)); process.exit(1); });

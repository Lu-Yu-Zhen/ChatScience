// 实验：push 模式直接使用已注册 BYOK 模型 id（options.model = <byok model id>）
const path = require('path');
const fs = require('fs');
const APP = 'D:/ChatScience/app/dist/ChatScience-win32-x64/resources/app';
const dynamicImport = new Function('s', 'return import(s);');

(async () => {
  const sdk = await dynamicImport('@qodercn-ai/qodercn-agent-sdk');
  const mod = sdk.default || sdk;
  const qoderCfg = JSON.parse(fs.readFileSync(path.join(APP, 'server', 'qoder.json'), 'utf8'));
  const byokModelId = process.argv[2] || 'qwen3.8-flash-pg';
  const q = mod.query({
    prompt: '请只回复四个字：链路正常',
    options: {
      auth: mod.accessToken(qoderCfg.accessToken),
      cwd: path.join(APP, 'data', 'sandbox', 'global', 'work'),
      maxTurns: 4, model: byokModelId, settingSources: [], strictMcpConfig: true
    }
  });
  for await (const msg of q) {
    if (msg.type === 'result') {
      console.log('RESULT ok=' + !msg.is_error + ' errors=' + JSON.stringify(msg.errors || []) + ' text=' + String(msg.result || '').slice(0, 120));
      break;
    }
  }
  process.exit(0);
})().catch((e) => { console.error('ERR: ' + (e && e.message)); process.exit(1); });

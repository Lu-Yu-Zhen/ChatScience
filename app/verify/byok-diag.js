// 诊断：BYOK 组合验证 + 当前配置清单 + （必要时）注册配置
const path = require('path');
const fs = require('fs');
const APP = 'D:/ChatScience/app/dist/ChatScience-win32-x64/resources/app';
const dynamicImport = new Function('s', 'return import(s);');

(async () => {
  const sdk = await dynamicImport('@qodercn-ai/qodercn-agent-sdk');
  const mod = sdk.default || sdk;
  const qoderCfg = JSON.parse(fs.readFileSync(path.join(APP, 'server', 'qoder.json'), 'utf8'));
  const state = JSON.parse(fs.readFileSync(path.join(APP, 'data', 'state.json'), 'utf8'));
  const inst = state.models.find((m) => m.apiKey && String(m.apiKey).length > 10) || state.models[0];
  const apiKey = String(inst.apiKey);
  console.log('用例 provider=bailian model=qwen3.8-max-tp keyLen=' + apiKey.length);

  const q = mod.query({
    prompt: 'ping',
    options: {
      auth: mod.accessToken(qoderCfg.accessToken),
      cwd: path.join(APP, 'data', 'sandbox', 'global', 'work'),
      maxTurns: 1, model: 'lite', settingSources: [], strictMcpConfig: true
    }
  });
  let done = false;
  for await (const msg of q) {
    if (msg.type === 'system' && msg.subtype === 'init' && !done) {
      done = true;
      // 1. 当前 BYOK 配置清单
      try {
        const cfgs = await q.listByokConfigs();
        console.log('BYOK_CONFIGS=' + JSON.stringify(cfgs, null, 1).slice(0, 1500));
      } catch (e) { console.log('LIST_CONFIGS_ERR=' + e.message); }
      // 2. 验证组合
      try {
        const v = await q.validateByokModel({ provider: 'bailian', model: 'qwen3.8-max-tp', api_key: apiKey, style: 'openai' });
        console.log('VALIDATE(bailian/qwen3.8-max-tp)=' + v);
      } catch (e) { console.log('VALIDATE_ERR=' + e.message); }
      break;
    }
  }
  process.exit(0);
})().catch((e) => { console.error('ERR: ' + (e && e.message)); process.exit(1); });

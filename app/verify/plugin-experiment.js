// 诊断：插件结构校验 + 会话内插件清单 + MCP 状态 + 发现的 agents
const dynamicImport = new Function('s', 'return import(s);');
const APP = 'D:/ChatScience/app/dist/ChatScience-win32-x64/resources/app';

(async () => {
  const sdk = await dynamicImport('@qodercn-ai/qodercn-agent-sdk');
  const mod = sdk.default || sdk;
  const PLUG = APP + '/server/plugins';
  const domains = ['research-math', 'research-ai', 'research-robotics'];

  /* 1. 静态校验 */
  for (const d of domains) {
    try {
      const r = await mod.validatePlugin(PLUG + '/' + d);
      console.log('[validate ' + d + '] valid=' + r.valid + (r.errors && r.errors.length ? ' errors=' + JSON.stringify(r.errors) : '') + (r.warnings && r.warnings.length ? ' warn=' + JSON.stringify(r.warnings) : ''));
    } catch (e) { console.log('[validate ' + d + '] EXC: ' + e.message); }
  }

  /* 2. 会话内：加载插件 → init → 清单/状态 */
  const qoderCfg = JSON.parse(require('fs').readFileSync(APP + '/server/qoder.json', 'utf8'));
  const q = mod.query({
    prompt: '请只回复：ok',
    options: {
      auth: mod.accessToken(qoderCfg.accessToken),
      cwd: APP + '/data/sandbox/global/work',
      maxTurns: 1, model: 'qwen3.8-flash-pg', settingSources: [], strictMcpConfig: true,
      plugins: domains.map(function (d) { return { type: 'local', path: PLUG + '/' + d }; })
    }
  });
  for await (const msg of q) {
    if (msg.type === 'system' && msg.subtype === 'init') {
      const ags = (await q.supportedAgents().catch(function (e) { return 'EXC ' + e.message; }));
      console.log('[supportedAgents] ' + JSON.stringify(ags).slice(0, 600));
      const plugins = await q.listPlugins().catch(function (e) { return 'EXC ' + e.message; });
      console.log('[listPlugins] ' + JSON.stringify(plugins).slice(0, 1200));
      const mcp = await q.mcpServerStatus().catch(function (e) { return 'EXC ' + e.message; });
      console.log('[mcpServerStatus] ' + JSON.stringify(mcp).slice(0, 1200));
      break;
    }
  }
  process.exit(0);
})().catch((e) => { console.error('ERR: ' + (e && e.message)); process.exit(1); });

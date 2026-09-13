/* ==================================================================
   ai.ts · AI 流式代理（兼容 OpenAI Chat Completions 协议的上游）
   ================================================================== */
import type {
  ChatRequestFields, ChatStreamEvent, ChatStreamOptions, ChatMessageInput, UpstreamChatBody,
} from '../shared/domain';

export const PROVIDER_URLS: Record<string, string> = {
  deepseek: 'https://api.deepseek.com',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  bailian: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  tokenplan: 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
  ark: 'https://ark.cn-beijing.volces.com/api/v3',
  openrouter: 'https://openrouter.ai/api/v1',
  opencodezen: 'https://opencode.ai/zen/v1',
  opencodego: 'https://opencode.ai/go/v1'
};

/* 前端 PROVIDERS 用的是短 id（zen/go），与后端 key 不一致；归一化失败必须显式报错，
   否则会静默打到百炼域名并返回 401，把用户引向"Key 无效"的错误排查方向 */
export const PROVIDER_ALIASES: Record<string, string> = { zen: 'opencodezen', go: 'opencodego' };

export function resolveProvider(providerId: string | undefined): string {
  const id = (providerId && PROVIDER_ALIASES[providerId]) || providerId || '';
  if (!PROVIDER_URLS[id]) {
    throw new Error('unknown provider "' + providerId + '" (known: ' + Object.keys(PROVIDER_URLS).join(', ') + ')');
  }
  return id;
}

export function pickTemp(t: unknown): number | undefined {
  const n = parseFloat(String(t));
  return (t !== '' && t != null && !isNaN(n)) ? n : undefined;
}

/* 思考开关：按各厂商官方参数注入。
   - 智谱 GLM / 火山方舟 seed 系：body.thinking.type = enabled | disabled
   - 阿里百炼 / Token Plan（qwen3 系）：body.enable_thinking = true|false
   - OpenRouter：开 → reasoning.effort = medium；关 → 不注入（多数模型默认非思考）
   - DeepSeek / OpenCode zen/go：官方无通用思考开关，跳过（reasoner 恒思考）
   注意：本函数只把标记写到传入对象上；chatStream 组装上游 body 时是否携带，
   由调用链路决定（迁移自 ai.js，行为逐行保持）。 */
export function applyThinking(opts: ChatStreamOptions & ChatRequestFields, providerId: string, thinkingOn: boolean): void {
  if (providerId === 'zhipu' || providerId === 'ark') {
    opts.thinking = { type: thinkingOn ? 'enabled' : 'disabled' };
  } else if (providerId === 'bailian' || providerId === 'tokenplan') {
    opts.enable_thinking = !!thinkingOn;
  } else if (providerId === 'openrouter') {
    if (thinkingOn) opts.reasoning = { effort: 'medium' };
  }
  /* 其余厂商不注入，保持官方默认 */
}

/* 按各厂商规范注入联网搜索（依据各官方文档）：
   - DashScope 系（阿里云百炼 / Token Plan）：enable_search（模型按需联网检索）
   - 智谱：tools 中的 web_search 工具
   - OpenRouter：模型名追加 :online
   - DeepSeek / 火山方舟：API 无标准联网开关，跳过 */
export function applyWebSearch(body: UpstreamChatBody, providerId: string): void {
  if (providerId === 'bailian' || providerId === 'tokenplan') {
    /* enable_search：开启联网能力，由模型按需检索（forced_search 会每次强制搜索，首字延迟 +10s 以上） */
    body.enable_search = true;
  } else if (providerId === 'zhipu') {
    body.tools = [{ type: 'web_search', web_search: { enable: true } }];
  } else if (providerId === 'openrouter') {
    if (!/:online$/.test(body.model)) body.model = body.model + ':online';
  }
}

/* 读上游 SSE：按行分帧（处理跨 chunk 的半行），逐条 JSON 回调；遇 [DONE] 结束 */
export async function pumpSse(resp: Response, onJson: (j: Record<string, unknown>) => void): Promise<void> {
  const reader = resp.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf('\n')) > -1) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') return;
      try { onJson(JSON.parse(payload)); } catch (e) { /* 忽略无法解析的行 */ }
    }
  }
}

/* 上游 SSE delta 的宽松形状（各厂商字段名不一） */
interface UpstreamDelta {
  content?: string;
  reasoning?: string;
  reasoning_content?: string;
}
interface UpstreamChunk {
  choices?: { delta?: UpstreamDelta }[];
}

/**
 * 流式对话：逐段回调 onEvent(text)，解析上游 SSE
 * 事件流：{ type:'reasoning'|'content', text }——思考增量来自 delta.reasoning_content（百炼/GLM）或 delta.reasoning（OpenRouter）
 */
export async function chatStream(opts: ChatStreamOptions, onEvent: (ev: ChatStreamEvent) => void): Promise<void> {
  const providerId = resolveProvider(opts.providerId);
  const url = PROVIDER_URLS[providerId] + '/chat/completions';
  const body: UpstreamChatBody = { model: opts.model, messages: opts.messages as ChatMessageInput[], stream: true };
  const temp = pickTemp(opts.temperature);
  if (temp !== undefined) body.temperature = temp;
  if (opts.web) applyWebSearch(body, providerId);
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + opts.apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error('upstream ' + resp.status + ': ' + text.slice(0, 300));
  }
  await pumpSse(resp, function (j) {
    const chunk = j as unknown as UpstreamChunk;
    const choice = chunk.choices && chunk.choices[0];
    const delta = choice && choice.delta;
    if (!delta) return;
    const r = delta.reasoning_content || delta.reasoning;
    if (r) onEvent({ type: 'reasoning', text: r });
    if (delta.content) onEvent({ type: 'content', text: delta.content });
  });
}

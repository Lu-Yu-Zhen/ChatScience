// @ts-nocheck
/* 前端全局脚本层：按字节精确迁移自 JS（见 app/TypeScript迁移说明.md），
   本文件关闭逐行类型检查；环境与第三方库声明见 ambient.d.ts。 */
/* ==================================================================
   10-api.js · 本地后端访问层
   - workFetch：JSON 请求（自动带 Bearer token）
   - workSse：POST + SSE 流式读取（沙箱执行、Agent 运行都走这条）
   - workFetchBlob：带鉴权头下载二进制并转 objectURL
     （<img src> 无法携带 Authorization，直接写 URL 会 401 图裂；
      也不给路由开 ?token= 查询参数——token 会进日志与历史记录）
   后端不可用时（纯浏览器直开、无 token）所有方法给出明确错误，
   由调用方决定降级文案，不静默返回假数据。
   ================================================================== */

function backend() {
  return (typeof window !== 'undefined' && window.CS_BACKEND) ? window.CS_BACKEND : null;
}

function apiAvailable() {
  const b = backend();
  return !!(b && b.base && b.token);
}

function authHeaders(extra) {
  const b = backend();
  const h = { Authorization: 'Bearer ' + (b ? b.token : '') };
  if (extra) Object.keys(extra).forEach(function (k) { h[k] = extra[k]; });
  return h;
}

function apiUrl(p) {
  const b = backend();
  return (b ? b.base : '') + p;
}

class WorkApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = 'WorkApiError';
    this.status = status || 0;
    this.detail = detail || null;
  }
}

async function workFetch(p, opts) {
  const o = opts || {};
  if (!apiAvailable()) throw new WorkApiError(tt('wErrNoBackend'), 0);
  const init = {
    method: o.method || 'GET',
    headers: authHeaders(o.body ? { 'Content-Type': 'application/json' } : null)
  };
  if (o.body !== undefined) init.body = JSON.stringify(o.body);
  if (o.signal) init.signal = o.signal;
  let resp;
  try {
    resp = await fetch(apiUrl(p), init);
  } catch (e) {
    throw new WorkApiError(tt('wErrNetwork') + '：' + e.message, 0);
  }
  const text = await resp.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch (e) { data = { raw: text }; } }
  if (!resp.ok) {
    const msg = (data && (data.error || data.message)) || ('HTTP ' + resp.status);
    throw new WorkApiError(msg, resp.status, data);
  }
  return data;
}

/* POST + SSE：逐条解析 data: {json}，按 evt 字段分派。
   返回 { abort() }；abort 会断开 fetch 并触发 handlers.onAbort。
   注意：正常结束时浏览器也会触发连接关闭，onClose 与 onAbort 要区分开。 */
function workSse(p, body, handlers) {
  const h = handlers || {};
  const ctl = new AbortController();
  let finished = false;

  (async function () {
    if (!apiAvailable()) {
      if (h.onError) h.onError(new WorkApiError(tt('wErrNoBackend'), 0));
      return;
    }
    try {
      const resp = await fetch(apiUrl(p), {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json', Accept: 'text/event-stream' }),
        body: JSON.stringify(body || {}),
        signal: ctl.signal
      });
      if (!resp.ok || !resp.body) {
        const t = await resp.text().catch(function () { return ''; });
        throw new WorkApiError('HTTP ' + resp.status + (t ? ': ' + t.slice(0, 200) : ''), resp.status);
      }
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const r = await reader.read();
        if (r.done) break;
        buf += dec.decode(r.value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n')) > -1) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          let j;
          try { j = JSON.parse(payload); } catch (e) { continue; }
          if (h.onEvent) h.onEvent(j.evt || 'message', j);
        }
      }
      finished = true;
      if (h.onClose) h.onClose();
    } catch (e) {
      if (ctl.signal.aborted) {
        finished = true;
        if (h.onAbort) h.onAbort();
        return;
      }
      finished = true;
      if (h.onError) h.onError(e);
    }
  })();

  return {
    abort: function () { if (!finished) ctl.abort(); },
    get finished() { return finished; }
  };
}

/* 带鉴权下载二进制 → objectURL（调用方负责在不用时 revokeObjectURL） */
async function workFetchBlob(p) {
  if (!apiAvailable()) throw new WorkApiError(tt('wErrNoBackend'), 0);
  const resp = await fetch(apiUrl(p), { headers: authHeaders() });
  if (!resp.ok) throw new WorkApiError('HTTP ' + resp.status, resp.status);
  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}

Work.api = {
  available: apiAvailable,
  backend: backend,
  url: apiUrl,
  fetch: workFetch,
  sse: workSse,
  blob: workFetchBlob,
  Error: WorkApiError
};

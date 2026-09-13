/* ==================================================================
   20-store.js · Work 前端状态与后端注水
   后端 work.json 是唯一事实来源；前端只做缓存 + 局部写回（各页面按需 PUT）。
   ensureReady() 记忆化：首次打开任一 Work 页面才拉 /api/work/bootstrap，
   不在页面加载期就打后端（Work bundle 在桥接脚本之前执行，那时 CS_BACKEND 尚未注入）。
   ================================================================== */

const WorkState = {
  loaded: false,          /* 是否已尝试拉取（无论成败） */
  agents: [],
  skills: {},             /* slug -> { enabled, order } */
  mcpServers: [],
  sandboxPolicy: {},
  runtimes: null,
  runHistory: [],
  /* 沙箱控制台的会话内状态（切页不丢） */
  sandbox: { lang: 'python', code: '', output: '', running: false, result: null, files: null }
};
Work.state = WorkState;

let _readyPromise = null;

function ensureReady(force) {
  if (_readyPromise && !force) return _readyPromise;
  WorkState.loaded = false;
  _readyPromise = Work.api.fetch('/api/work/bootstrap').then(function (d) {
    const w = (d && d.work) || {};
    WorkState.agents = Array.isArray(w.agents) ? w.agents : [];
    WorkState.skills = w.skills && typeof w.skills === 'object' ? w.skills : {};
    WorkState.mcpServers = Array.isArray(w.mcpServers) ? w.mcpServers : [];
    WorkState.runHistory = Array.isArray(w.runHistory) ? w.runHistory : [];
    WorkState.sandboxPolicy = (d && d.sandboxPolicy) || {};
    WorkState.runtimes = (d && d.runtimes) || null;
    WorkState.loaded = true;
    Work.ready = true;
    Work.bootError = null;
    return WorkState;
  }).catch(function (e) {
    WorkState.loaded = true;
    Work.ready = false;
    Work.bootError = e && e.message ? e.message : String(e);
    throw e;
  });
  return _readyPromise;
}

/* 沙箱策略局部写回（PUT 全量，后端做数值兜底） */
async function saveSandboxPolicy(next) {
  const merged = await Work.api.fetch('/api/work/sandbox/policy', { method: 'PUT', body: next });
  WorkState.sandboxPolicy = merged;
  return merged;
}

/* 供桥接脚本 snapshot()/restore() 调用。
   会话与工具轨迹（messages[].calls）本就随 conversations 进快照，这里只补
   Work 自身的界面状态（沙箱控制台等）。截断由桥接 replacer 统一做。 */
function snapshotForBridge() {
  return {
    v: 1,
    sandbox: {
      lang: WorkState.sandbox.lang,
      code: Work.truncate(WorkState.sandbox.code, 20000),
      result: WorkState.sandbox.result ? {
        ok: WorkState.sandbox.result.ok,
        exitCode: WorkState.sandbox.result.exitCode,
        timedOut: WorkState.sandbox.result.timedOut,
        blocked: WorkState.sandbox.result.blocked,
        durationMs: WorkState.sandbox.result.durationMs
      } : null
    }
  };
}
function restoreForBridge(data) {
  if (!data || typeof data !== 'object') return;
  if (data.sandbox) {
    WorkState.sandbox.lang = data.sandbox.lang || 'python';
    WorkState.sandbox.code = data.sandbox.code || '';
    WorkState.sandbox.result = data.sandbox.result || null;
  }
}

Work.store = {
  state: WorkState,
  ready: ensureReady,
  saveSandboxPolicy: saveSandboxPolicy,
  snapshot: snapshotForBridge,
  restore: restoreForBridge
};

// @ts-nocheck
/* 前端全局脚本层：按字节精确迁移自 JS（见 app/TypeScript迁移说明.md），
   本文件关闭逐行类型检查；环境与第三方库声明见 ambient.d.ts。 */
/* ==================================================================
   70-agent-chat.js · Work 会话的 Agent 回合（Qoder Agent SDK 链路）
   WORK_HOOKS.runTurn → Work.runTurn(conv, aiMsg)
   返回 true 表示已接管（Work 会话且绑定了智能体）；否则交回 Chat 链路。
   模型与凭证由后端 qoder.json 决定（SDK 五档模型），前端不感知。
   ================================================================== */

Work.runTurn = function (conv, aiMsg) {
  /* 只接管 Work 会话；agentId 允许为空（下方默认落到内置科研助理） */
  if (!conv || conv.mode !== 'work') return false;

  const msgIndex = conv.messages.length - 1;
  function rowTextEl() {
    const row = msgHost().querySelectorAll('.msg')[msgIndex];
    return row ? row.querySelector('.ai-text') : null;
  }
  /* 后端不可用 / 智能体缺失时的直接报错渲染 */
  function renderErrorNow(text) {
    aiMsg.streaming = false;
    aiMsg.text = text;
    const elx = rowTextEl();
    if (elx) renderAiText(elx, text, false);
    const row = msgHost().querySelectorAll('.msg')[msgIndex];
    const act = row ? row.querySelector('.ai-actions') : null;
    if (act) act.style.visibility = 'visible';
    if (window.csDesktop) window.csDesktop.notify(tt('notifyFail'), Work.truncate(text, 80));
  }

  /* 后端不可用：明确报错而不是静默回落到演示回复（Work 会话不该出现假回答） */
  if (!Work.api.available()) {
    renderErrorNow(tt('wErrNoBackend') + '——' + tt('wNoBackendBody'));
    return true;
  }

  /* 默认智能体：Work 会话未显式绑定时，自动落到内置"科研助理"（@ 可随时切换） */
  if (!conv.agentId && typeof window.defaultAgentId === 'function') {
    var defId = window.defaultAgentId();
    if (defId) conv.agentId = defId;
  }
  const agent = (WorkState.agents || []).find(function (a) { return a.id === conv.agentId; });
  if (!agent) {
    renderErrorNow(tt('wAgentMissing'));
    return true;
  }

  /* 轨迹数据源初始化 */
  aiMsg._pausedByUser = false;
  aiMsg._reasoningOpen = true;   /* 思考过程默认展开（小字），可点击收起 */
  setSendBusy(true, function () { aiMsg._pausedByUser = true; if (aiMsg._run) aiMsg._run.abort(); });
  aiMsg._calls = [];
  aiMsg._reasoning = '';
  aiMsg._reasonings = [];   /* 思考按步骤分段（trace 分组渲染） */
  aiMsg._running = true;
  aiMsg._step = 1;
  aiMsg._t0 = Date.now();
  aiMsg._agentId = agent.id;
  aiMsg.text = '';
  /* 侧栏会话条目：执行中标记（转圈），结束后移除 */
  if (window.csMarkRunning) window.csMarkRunning(conv.id, true);

  let rafPending = false;
  /* 条件置底：仅当消息区已接近底部时跟随滚动；用户上滑阅读则停住不打扰 */
  function stickScroll() {
    const host = msgHost();
    if (!host) return;
    if (host.scrollHeight - host.scrollTop - host.clientHeight < 90) host.scrollTop = host.scrollHeight;
  }
  function requestPaint() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      const elx = rowTextEl();
      if (elx && aiMsg.text) paintStreaming(elx, aiMsg.text);
      stickScroll();
    });
  }

  function finishRun(okFlag, errText) {
    if (typeof setSendBusy === 'function') setSendBusy(false);   /* 恢复发送键 */
    if (window.csMarkRunning) window.csMarkRunning(conv.id, false);   /* 侧栏转圈移除 */
    Work.traceFinish(aiMsg);
    aiMsg.streaming = false;
    const elx = rowTextEl();
    if (elx) renderAiText(elx, aiMsg.text, true);
    const row = msgHost().querySelectorAll('.msg')[msgIndex];
    const act = row ? row.querySelector('.ai-actions') : null;
    if (act) act.style.visibility = 'visible';
    if (window.csDesktop) {
      window.csDesktop.notify(okFlag ? tt('notifyDone') : tt('notifyFail'), Work.truncate(aiMsg.text || errText || '', 80));
    }
    conv.updatedAt = Date.now();
    renderConversations();
  }

  const scopeId = (agent.sandbox && agent.sandbox.scope === 'agent') ? ('conv-' + conv.id) : 'global';

  /* 工作区：会话绑定的 Work 项目带本地文件夹 → Agent 直接在该目录工作；
     否则回落到沙箱工作目录 */
  const proj = (typeof projects !== 'undefined' && conv.projectId)
    ? projects.find(function (p) { return p.id === conv.projectId; }) : null;
  const workspaceRoot = (proj && proj.mode === 'work' && proj.folder) ? proj.folder : null;
  /* 项目记忆：Work 项目下的任务带 projectId——后端据此就绪项目记忆文件夹与
     任务记忆文档，并注册 Stop 记忆决策 hook（模型自主决定是否更新） */
  const memProject = (proj && proj.mode === 'work') ? proj : null;

  /* 语言跟随设置 */
  var lang = (typeof getLang === 'function') ? getLang() : 'zh';
  var langTag = lang === 'en' ? '[Always respond in English.]\n\n' : '[请始终使用中文回答。]\n\n';

  /* 组装本轮输入：正文 + 上下文线索（知识库正文由 kb_search 按需检索）。
     多轮上下文由 SDK 会话 resume 承载（conv.sdkSessionId），不手工拼历史。 */
  function buildPrompt() {
    const userMsgs = conv.messages.filter(function (m) { return m.role === 'user'; });
    const last = userMsgs[userMsgs.length - 1];
    let p = (last && last.text ? last.text : '').trim() || '（无文字输入，请继续）';
    if (last && Array.isArray(last.contexts) && last.contexts.length) {
      p += '\n\n[本轮引用的资料名] ' + last.contexts.join('、') + '（需要内容时用 kb_search 检索）';
    }
    if (conv.docCtx && conv.docCtx.fileName) {
      p = '【文档上下文】《' + conv.docCtx.fileName + '》已加载，优先基于它回答。\n\n' + p;
    }
    p = langTag + p;
    /* / 指定：本轮优先使用的技能与连接器（输入框芯片），拼在最前 */
    if (typeof window.slashPrefix === 'function') {
      var pre = window.slashPrefix();
      if (pre) p = pre + p;
    }
    return p;
  }

  aiMsg._run = Work.api.sse('/api/work/agent/run', {
    agentId: agent.id,
    convId: conv.id,
    scopeId: scopeId,
    resumeSessionId: conv.sdkSessionId || null,
    workspaceRoot: workspaceRoot,
    permissionMode: conv.permissionMode || null,
    projectId: memProject ? memProject.id : null,
    projectName: memProject ? memProject.name : null,
    taskTitle: conv.title || null,
    prompt: buildPrompt()
  }, {
    onEvent: function (evt, d) {
      switch (evt) {
        case 'run_start':
          aiMsg._channel = d.channel;
          Work.traceRefresh(aiMsg);
          break;
        case 'step_start':
          aiMsg._step = d.step;
          Work.traceRefresh(aiMsg);
          break;
        case 'reasoning': {
          /* 思考分段：工具调用之后再次进入思考 = 新步骤开始（步骤号+1），
             思考文本按步骤分段存储（渲染时归组到对应步骤之下） */
          if ((aiMsg._calls || []).length > 0 && !aiMsg._inReasoning) {
            aiMsg._step = (aiMsg._step || 1) + 1;
            aiMsg._inReasoning = true;
          }
          aiMsg._reasonings = aiMsg._reasonings || [];
          aiMsg._reasonings[aiMsg._step - 1] = (aiMsg._reasonings[aiMsg._step - 1] || '') + (d.delta || '');
          aiMsg._reasoning = (aiMsg._reasoning || '') + (d.delta || '');
          if (aiMsg._reasoningOpen) Work.traceRefresh(aiMsg);
          break;
        }
        case 'delta':
          aiMsg.text = (aiMsg.text || '') + (d.delta || '');
          requestPaint();
          break;
        case 'tool_start': {
          /* 子智能体统一显示英文 id（任务页面）：Agent 委派解析目标 id；
             子智能体内部工具调用（parentToolUseId 指向该次委派）带 id 前缀 */
          let dispName = d.name;
          aiMsg._subAgentByCall = aiMsg._subAgentByCall || {};
          if (d.name === 'Agent') {
            let sid = '';
            try { const ao = JSON.parse(d.args || '{}'); sid = ao.subagent_type || ao.agent_id || ao.agent || ''; } catch (e) { /* 参数解析失败按原名显示 */ }
            dispName = 'Agent → ' + (sid || 'subagent');
            aiMsg._subAgentByCall[d.callId] = sid || 'subagent';
          } else if (d.parentToolUseId && aiMsg._subAgentByCall[d.parentToolUseId]) {
            dispName = aiMsg._subAgentByCall[d.parentToolUseId] + ' · ' + d.name;
          }
          aiMsg._inReasoning = false;   /* 离开思考阶段：下一次思考将开启新步骤 */
          aiMsg._calls.push({
            callId: d.callId, name: dispName, args: d.args, state: 'running', _open: false, step: d.step || aiMsg._step || 1
          });
          Work.traceRefresh(aiMsg);
          break;
        }
        case 'tool_end': {
          const c = aiMsg._calls.find(function (x) { return x.callId === d.callId; });
          if (c) {
            c.state = d.ok ? 'ok' : 'error';
            c.durationMs = d.durationMs;
            c.result = d.result;
            c.error = d.error;
            if (c.state === 'error') c._open = true;   /* 出错自动展开，方便定位 */
          }
          Work.traceRefresh(aiMsg);
          break;
        }
        case 'notice':
          if (d.code === 'tools_truncated' || d.code === 'mcp_not_connected' || d.code === 'no_tool_calls') {
            Work.toast(tt('wNotice') + '：' + d.message);
          }
          break;
        case 'run_result': {
          const r = (d && d.result) || {};
          if (r.sessionId) conv.sdkSessionId = r.sessionId;   /* 多轮续接：下一轮带 resume */
          if (r.text) aiMsg.text = r.text;
          aiMsg._metrics = r.metrics || null;
          if (r.aborted) {
            aiMsg.text = (aiMsg.text || '') + '\n\n[' + tt('wAborted') + ']';
            finishRun(false);
          } else if (r.ok) {
            finishRun(true);
          } else {
            /* 具体错误透传：后端把上游失败（鉴权/配额/参数）放 errors[] 数组，
               必须原样展示给用户，不能用「没有给出回答」掩盖真实原因 */
            const detail = r.error || (Array.isArray(r.errors) && r.errors.length ? r.errors.join('；') : '') || tt('wAgentEmpty');
            aiMsg.text = (aiMsg.text || '') + '\n\n【' + tt('notifyFail') + '】' + detail;
            finishRun(false, detail);
          }
          break;
        }
        case 'aborted':
          aiMsg.text = (aiMsg.text || '') + '\n\n[' + tt('wAborted') + ']';
          finishRun(false);
          break;
        case 'error':
          aiMsg.text = (aiMsg.text || '') + '\n\n【' + tt('notifyFail') + '】' + (d.message || '');
          if (d.fatal) finishRun(false, d.message);
          else Work.traceRefresh(aiMsg);
          break;
        default:
          break;
      }
    },
    onClose: function () {
      /* 正常结束由 run_result 处理；这里只兜底"流断开但没收到结束事件" */
      if (aiMsg._running) {
        aiMsg.text = (aiMsg.text || '') + '\n\n[' + tt('wStreamLost') + ']';
        finishRun(false);
      }
    },
    onAbort: function () {
      if (typeof setSendBusy === 'function') setSendBusy(false);
      aiMsg.text = (aiMsg.text || '') + '\n\n[' + tt('wAborted') + ']';
      finishRun(false);
    },
    onError: function (e) {
      if (typeof setSendBusy === 'function') setSendBusy(false);
      /* 用户主动暂停后 SDK 可能抛出内部错误（如 state is not defined），按已暂停呈现 */
      if (aiMsg._pausedByUser) {
        aiMsg.text = (aiMsg.text || '') + '\n\n[' + tt('wAborted') + ']';
        finishRun(false);
        return;
      }
      aiMsg.text = (aiMsg.text || '') + '\n\n【' + tt('notifyFail') + '】' + e.message;
      finishRun(false, e.message);
    }
  });

  return true;   /* 已接管 */
};

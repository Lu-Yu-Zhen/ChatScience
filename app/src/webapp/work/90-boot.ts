// @ts-nocheck
/* 前端全局脚本层：按字节精确迁移自 JS（见 app/TypeScript迁移说明.md），
   本文件关闭逐行类型检查；环境与第三方库声明见 ambient.d.ts。 */
/* ==================================================================
   90-boot.js · 装配：把各页面与侧栏注册进主脚本的 WORK_HOOKS
   必须是 bundle 最后一个文件：此时 WORK_I18N 与各页面构建器都已初始化。
   ================================================================== */

/* 1. 词条并入主脚本 i18n（主脚本缺 key 时 applyLang 静默跳过，t() 不会报错；
      Work 内部统一走 tt()，缺词条只会 warn 不会白屏） */
(function () {
  if (typeof i18n === 'object' && i18n) {
    if (i18n.zh) Object.assign(i18n.zh, WORK_I18N.zh);
    if (i18n.en) Object.assign(i18n.en, WORK_I18N.en);
  } else {
    console.warn('[work] 主脚本 i18n 不可用，Work 词条未注入');
  }
})();

/* 2. 页面注册：页面模块只需 Work.pages.<key> = builder，这里统一挂到主脚本 */
Object.keys(Work.pages).forEach(function (key) {
  WORK_HOOKS.pages['work-' + key] = Work.pages[key];
});

/* 3. Work 侧栏入口（基础三项——新建任务/创建项目/知识和数据库——由主脚本提供） */
const _SIDEBAR = [
  { id: 'agentsBtn', page: 'agents', iconPath: Work.ICONS.agent, key: 'wAgents' },
  { id: 'skillsBtn', page: 'skills', iconPath: Work.ICONS.layers, key: 'wSkills' },
  { id: 'mcpBtn', page: 'mcp', iconPath: Work.ICONS.plug, key: 'wMcp' },
  { id: 'sandboxBtn', page: 'sandbox', iconPath: Work.ICONS.box, key: 'wSandbox' },
  { id: 'notebookBtn', page: 'notebook', iconPath: Work.ICONS.book, key: 'wNotebook' },
  { id: 'runBtn', page: 'run', iconPath: Work.ICONS.terminal, key: 'wRun' }
];

WORK_HOOKS.sidebarItems = function () {
  return _SIDEBAR.map(function (s) {
    return {
      id: s.id,
      icon: s.iconPath,
      label: tt(s.key),
      action: function () { openWorkPage('work-' + s.page); }
    };
  });
};

/* 4. Work 欢迎页 pills：动态展示智能体（P6 完成后）+ 沙箱 / 技能入口 */
WORK_HOOKS.emptyStatePills = function (mode) {
  const pills = [];
  const agents = (WorkState.agents || []).slice(0, 2);
  agents.forEach(function (a) {
    pills.push({
      label: a.name || 'Agent',
      bg: 'rgba(124, 58, 237, 0.10)', color: '#7C3AED',
      icon: Work.ICONS.agent,
      action: function () {
        if (Work.Agents && typeof Work.Agents.startConversation === 'function') Work.Agents.startConversation(a);
        else openWorkPage('work-agents');
      }
    });
  });
  pills.push({
    key: 'wSandbox', bg: 'rgba(22, 163, 74, 0.10)', color: '#16A34A',
    icon: Work.ICONS.box,
    action: function () { openWorkPage('work-sandbox'); }
  });
  if (agents.length < 2) {
    pills.push({
      key: 'wAgents', bg: 'rgba(37, 99, 235, 0.10)', color: '#2563EB',
      icon: Work.ICONS.plus,
      action: function () { openWorkPage('work-agents'); }
    });
  }
  return pills;
};

/* 5. 会话行 meta：显示所属智能体名 */
WORK_HOOKS.convBadge = function (conv) {
  if (!conv || !conv.agentId) return null;
  const a = (WorkState.agents || []).find(function (x) { return x.id === conv.agentId; });
  return a ? a.name : null;
};

/* 6. Agent 回合接管（70-agent-chat.js 定义 Work.runTurn；未定义前 Work 会话
      回落到 Chat 的真实流式链路，不阻塞使用） */
WORK_HOOKS.runTurn = function (conv, aiMsg) {
  if (typeof Work.runTurn !== 'function') return false;
  return Work.runTurn(conv, aiMsg) === true;
};

/* 7. 工具调用轨迹（60-trace.js 定义；未定义时返回 null，不插节点） */
WORK_HOOKS.messageRowExtra = function (m, idx) {
  if (typeof Work.renderTrace !== 'function') return null;
  return Work.renderTrace(m, idx);
};

/* 7b. 知识库文件索引推送：addFilesToKb 读入文件后触发（文本提取复用主脚本
   readerDocText 的 pdf.js / mammoth / SheetJS 解析结果，后端不重复解析二进制） */
WORK_HOOKS.afterKbFileAdd = function (kbId, entry) {
  if (!entry || entry.data == null) return;
  if (typeof readerDocText !== 'function') return;
  try {
    readerDocText(entry, entry.kind).then(function (text) {
      if (!text || !text.trim()) return;
      return Work.api.fetch('/api/work/kb/index', {
        method: 'POST',
        body: { kbId: kbId, fileName: entry.name, text: String(text).slice(0, 2000000) }
      });
    }).then(function (r) {
      if (r && r.chunks) console.log('[kb index] ' + entry.name + ': ' + r.chunks + ' chunks');
    }).catch(function (e) {
      console.warn('[kb index] ' + entry.name + ' 索引失败（kb_search 将不可用该文件）:', e.message);
    });
  } catch (e) { console.warn('[kb index] failed:', e); }
};

/* 8. 桥接 boot() 会调用（在 Work 页面注册之后，时序正确） */
Work.boot = function () {
  /* 预热：bootstrap（智能体 → 欢迎页 pills / 会话徽标 / @ 面板）+ 技能与连接器清单（/ 面板数据源）。
     失败不阻塞——首次打开 Work 页面时 ensureReady 会重试。 */
  Work.store.ready().then(function () {
    if (typeof renderConversations === 'function') renderConversations();
    return Promise.all([
      Work.api.fetch('/api/work/skills').then(function (d) {
        WorkState.skillsList = (d && d.skills) || [];
        WorkState.skills = (d && d.states) || WorkState.skills;
      }).catch(function () { }),
      Work.api.fetch('/api/work/mcp/servers').then(function (d) {
        WorkState.mcpList = (d && d.servers) || [];
      }).catch(function () { })
    ]);
  }).catch(function (e) {
    console.warn('[work] bootstrap 预热失败（首次打开 Work 页面时会重试）:', e.message);
  });
};

/* ==================================================================
   qoder.ts · Work 模式底座：Qoder Agent SDK 封装
   - Agent 循环、工具调用、MCP 客户端、模型管理全部交给 SDK，不自研
   - 沙箱边界层：cwd 指到沙箱工作目录；canUseTool 拦高危 Bash 与越界写
   - 科研扩展：in-process MCP server（arxiv / fetch / web / kb / note / run_code）
     ——这些是 SDK 原生没有、ChatScience 补上的能力
   - 多轮：SDK 原生 resume（conv.sdkSessionId），不手工拼历史

   诚实边界（与 policy.ts 一致）：
   - canUseTool 对 Bash 的拦截是命令文本静态扫描，可被绕过；cwd 隔离依赖 SDK
     自身的目录约束。需要硬隔离的执行走 run_code（独立进程沙箱）。
   - settingSources:[] + strictMcpConfig:true 是隔离的关键：否则 SDK 会继承本机
     qoderclicn 的全部用户配置（包括几百个 MCP 工具），沙箱形同虚设。

   类型：全部走 shared/qoder-sdk 重导出的官方 SDK 类型（Options / SDKMessage /
   CanUseTool / PermissionResult / AgentDefinition / McpServerConfig 等）。
   ================================================================== */
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import * as policyMod from './policy';
import * as research from './research';
import * as sciTools from './sci-tools';
import { buildDomainServer } from './domain-tools';
import { AuditLog, auditArgsSummary, auditDetail, type AuditEntry } from './audit';
import { gitPrefsPrompt } from './userdata';
import {
  loadSdk,
  type Options,
  type Query,
  type CanUseTool,
  type CanUseToolOptions,
  type CallToolResult,
  type McpServerConfig,
  type PermissionMode,
  type SDKMessage,
  type AccessTokenInput,
  type AgentDefinition,
  type HookCallback,
  type HookInput,
  type HookJSONOutput,
  type ModelPolicyProvider,
  type ModelPolicyContext,
  type ModelPolicyResult,
} from '../shared/qoder-sdk';
import {
  asPermissionMode,
  type AgentDefRecord, type ByokModelInfo, type DomainPluginInfo, type QoderApi, type QoderConfigFile, type QoderDeps,
  type ScienceToolCtx, type SkillInfo, type SubagentRecord, type WorkRunEventName, type WorkRunEventHandler,
  type WorkRunEventData, type WorkTurnParams, type WorkTurnResult,
} from '../shared/domain';

const MODEL_OUT_CAP = 8000;   /* 工具结果回灌给模型的最大字符数 */

/* SDK 消息 content 块的宽松形状（线路协议；工具调用/结果处理只关心这些字段，
   断言收窄不校验运行时缺省，与 JS 版行为一致） */
interface AnyContentBlock {
  type: string;
  id: string;
  name: string;
  input?: unknown;
  text?: string;
  tool_use_id: string;
  content?: unknown;
  is_error?: boolean;
}

function cap(s: unknown, n?: number): string {
  const str = typeof s === 'string' ? s : JSON.stringify(s, null, 1);
  if (str.length <= (n || MODEL_OUT_CAP)) return str;
  return str.slice(0, (n || MODEL_OUT_CAP)) + '\n…[已截断，完整内容请分段读取]…';
}
function truncateStr(s: unknown, n: number): string {
  s = String(s === undefined || s === null ? '' : s);
  return (s as string).length > n ? (s as string).slice(0, n) + '…' : (s as string);
}

/* SDK 内建工具白名单（科研 Agent 的合理全集；init 实测可用名）。
   'Agent' 是子智能体委派工具（04 策划案 E 组）：主会话 tools 含 Agent 才能委派
   options.agents 注册的子智能体；子智能体自身 tools 一律不含 Agent（不可嵌套）。
   仅 agent-orchestrator 配置了 Agent；其余智能体经白名单过滤后仍不可见该工具。 */
export const SDK_BUILTIN_DEFAULT = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'WebFetch', 'WebSearch', 'NotebookEdit', 'Agent'] as const;
export const PERMISSION_MODES = ['default', 'acceptEdits', 'auto', 'plan', 'dontAsk'] as const;

/* 内置智能体（首次启动播种进 work.json；用户可编辑可删除）
   agent-orchestrator：墨道主智能体（E2）——三职责：任务拆解分派 / 结果汇总判定 /
   异常重规划。tools 必须含 Agent 才能委派；七类科研子智能体经 options.agents 注册。 */
export const BUILTIN_AGENTS: AgentDefRecord[] = [
  {
    id: 'agent-orchestrator', name: '墨道', role: 'orchestrator', builtin: true,
    description: '复杂科研任务的编排入口：拆解任务并按需委派文献/实验/仿真/数据/写作/评审/归档子智能体，汇总结果后交付。简单问题直接回答，不拉起子智能体。',
    systemPrompt: [
      '你是「墨道」主智能体：唯一有权调度子智能体的角色。',
      '# 三职责',
      '1. 意图识别与动态路由：判断任务属简单/中度/复杂，绝不机械地为每个任务都拉起全部子智能体。',
      '2. 结果汇总与判定：收集子智能体产出，交叉核对后统一交付；发现缺口时补充委派或自行补齐。',
      '3. 异常处理与重规划：子智能体失败或结果不可信时，调整任务描述重新委派，或换路径完成。',
      '# 三分支路由策略',
      '- 简单任务（解释概念、一句话问答）：直接回答，不调用任何子智能体。',
      '- 中度任务（查几篇文献、算一组数据）：只调用一个或少数几个子智能体。',
      '- 复杂任务（设计实验、仿真、分析数据、写稿评审）：串联多个子智能体，按依赖顺序分派。',
      '- 混合任务（先仿真再写汇报）：先科研子智能体产出，再自行汇总成稿。',
      '# 委派纪律',
      '- 每次委派把「当前任务 + 必要材料片段」写进委派提示词；子智能体看不到你们的完整对话。',
      '- 子智能体之间不能互相调度；所有汇总、裁定由你完成。',
      '- 委派前说明为什么选这个子智能体；结果带回后注明来自哪个子智能体。'
    ].join('\n'),
    modelKey: 'byok', permissionMode: 'acceptEdits', maxTurns: 200,
    tools: { sdk: ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'Agent'], builtin: ['science'], scienceTools: ['kb_search', 'note_write', 'doi_cite', 'keyword_expand', 'figure_caption'] },
    skills: ['research-decompose', 'academic-writing', 'experiment-log'],
    sandbox: { scope: 'global' }
  },
  {
    id: 'agent-discuss', name: '墨析', role: 'research', builtin: true,
    description: '仅对话（只读）：读你的代码与文档，讨论思路、答疑、审阅方案，不改动任何文件。',
    systemPrompt: '你是一位科研探讨伙伴。只读取与分析，绝不修改文件；回答先给结论再给依据；引用用户文件时注明文件名与大致位置。',
    modelKey: 'byok', permissionMode: 'default', maxTurns: 16,
    tools: { sdk: ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch'], builtin: ['science'], scienceTools: ['arxiv_search', 'fetch_url', 'web_search', 'kb_search'] },
    skills: ['paper-deep-read', 'formula-derivation', 'model-arch-analysis', 'lit-review'],
    sandbox: { scope: 'global' }
  }
];

/* ---------------- 墨道七类科研子智能体（04 策划案 E1 / 4.4 路径 B） ----------------
   经 options.agents 注册给主智能体（agent-orchestrator）委派，不进 UI 切换器。
   硬性约束（SDK 委派机制）：
   - description 写「何时用我」——模型据此路由，是分派质量的第一等指标；
   - tools 一律不含 Agent（子智能体不可嵌套派生）；
   - maxTurns 必设（防失控第一道闸）；
   - mcpServers: ['chatscience'] 复用主会话的 in-process 科研 server（字符串引用形式）；
   - skills 预加载专属技能集；model 'inherit' 继承主会话模型。
   七类 ↔ 已实现技能/工具映射依据策划案 4.4 路径 A 映射表。 */
interface SubagentSpec {
  id: string; name: string; whenToUse: string; prompt: string;
  sdkTools: string[]; scienceTools: string[]; skills: string[];
  maxTurns: number; permissionMode: 'default' | 'acceptEdits';
}

const SUBAGENT_SPECS: SubagentSpec[] = [
  {
    id: 'sub-lit-review', name: '文献调研',
    whenToUse: '当任务需要检索文献、调研某方向的研究现状、对比方法、找研究空白或核实论文声称时用我。只读检索，不改文件。',
    prompt: '你是文献调研子智能体。多轮检索（同义词/缩写全称都试）→ 去重建候选清单 → 按方法/数据/结论聚类 → 产出对比表与研究空白。每条引用给 arXiv id 与链接；区分「论文声称」与「你核实过的」；检索式写明（可复现）。用 note_write 记录关键结论。',
    sdkTools: ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch'],
    scienceTools: ['arxiv_search', 'fetch_url', 'web_search', 'kb_search', 'doi_cite', 'keyword_expand'],
    skills: ['lit-review', 'paper-deep-read', 'research-decompose'],
    maxTurns: 14, permissionMode: 'default'
  },
  {
    id: 'sub-experiment-design', name: '实验设计',
    whenToUse: '当任务需要设计实验方案、消融矩阵、假设生成、变量梳理（混杂/中介/调节）或统计效能考量时用我。产出设计文档，不执行训练。',
    prompt: '你是实验设计子智能体。先明确假设与验证目标；单变量原则设计消融矩阵；梳理因果变量（混杂/中介/调节）；每组实验给 seed 数与统计效力说明；用 note_write 产出设计文档（实验矩阵表：编号/变动因子/取值/seed/预算/预期回答的问题）。',
    sdkTools: ['Read', 'Write', 'Glob'],
    scienceTools: ['kb_search', 'note_write'],
    skills: ['ablation-design', 'experiment-log', 'causal-variables', 'stats-interpretation'],
    maxTurns: 10, permissionMode: 'default'
  },
  {
    id: 'sub-simulation', name: '实验仿真',
    whenToUse: '当任务需要写代码跑仿真/训练、复现模型、验证数值假设时用我。在沙箱里实际执行，小样本先验证再放大。',
    prompt: '你是实验仿真子智能体。先校验仿真假设（边界条件、量纲、收敛判据）再动手；严格「小样本先验证再放大」；run_code 在沙箱执行（matplotlib Agg，图存 out/）；不收敛/发散时按症状诊断（尖峰/平台/震荡/NaN）；每阶段用 note_write 记录配置与结果。',
    sdkTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
    scienceTools: ['run_code', 'note_write', 'kb_search'],
    skills: ['mindspore-repro', 'simulation-assumption', 'loss-curve-analysis'],
    maxTurns: 16, permissionMode: 'acceptEdits'
  },
  {
    id: 'sub-data-analysis', name: '数据分析',
    whenToUse: '当任务需要处理实验数据、统计检验、分组对比、画出版级图表或诊断训练曲线时用我。用数据说话，结论附数值证据。',
    prompt: '你是数据分析子智能体。先看数据（shape/缺失/分布）再下结论；统计方法与数据性质匹配（正态性/方差齐性先查，小样本用非参数检验）；结论附效应量与置信区间，不只给 p 值；相关不等于因果，边界明确标注；图表同时导出 PDF 与 PNG 到 out/。',
    sdkTools: ['Read', 'Write', 'Glob', 'Bash'],
    scienceTools: ['run_code', 'note_write', 'kb_search', 'unit_convert'],
    skills: ['data-analysis', 'figure-plot', 'stats-interpretation', 'loss-curve-analysis'],
    maxTurns: 14, permissionMode: 'acceptEdits'
  },
  {
    id: 'sub-writing', name: '文稿撰写',
    whenToUse: '当任务需要撰写/改写论文章节、按 IMRaD 组织内容、生成引用与图表注、中英学术改写时用我。',
    prompt: '你是文稿撰写子智能体。按 IMRaD 范式组织；学术语言（先结论后展开，避免口语与营销腔）；术语全文一致，缩写首次定义；公式用 LaTeX（latex_check 自检后再交付）；引用用 doi_cite 生成 BibTeX 与 GB/T 7714；图表注用 figure_caption 规范生成；成稿用 Write 落盘（Markdown）。',
    sdkTools: ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
    scienceTools: ['kb_search', 'note_write', 'latex_check', 'doi_cite', 'figure_caption'],
    skills: ['academic-writing', 'thesis-audit', 'formula-derivation'],
    maxTurns: 14, permissionMode: 'acceptEdits'
  },
  {
    id: 'sub-review', name: '结果评审',
    whenToUse: '当任务需要评审论文/方案/实验结果：论点与证据匹配、引用核验、逻辑与统计审慎审查、给出结构化评分与缺陷清单时用我。只读评审，不改动被审对象。',
    prompt: '你是结果评审子智能体（审辨环节）。只读分析，绝不修改文件。评审产出四件套：① 多维评分（1-10：创新性/严谨性/证据强度/表述清晰度）② 缺陷清单（位置/问题类型/原文摘录/修改建议/严重度高中低）③ 论点-证据匹配检查（关键声明是否有对应数据/引用支撑）④ 统计与因果审慎（p 值解读、样本量、混杂变量）。结论区分「已核实」与「存疑」。',
    sdkTools: ['Read', 'Glob', 'Grep'],
    scienceTools: ['kb_search', 'latex_check'],
    skills: ['thesis-audit', 'stats-interpretation', 'causal-variables'],
    maxTurns: 10, permissionMode: 'default'
  },
  {
    id: 'sub-archive', name: '资料归档',
    whenToUse: '当任务需要把实验配置、结果、文献清单、研究笔记分类归档、提取知识片段或生成项目快照文档时用我。',
    prompt: '你是资料归档子智能体。把材料按「实验记录/文献笔记/数据说明/结论摘要」分类；每条归档条目给来源与位置；知识片段提取成可复用的短条目（一段一主题）；用 note_write 分条落盘（用户笔记本页立即可见）；输出归档清单（条目/类别/来源/位置）。',
    sdkTools: ['Read', 'Write', 'Glob'],
    scienceTools: ['note_write', 'kb_search'],
    skills: ['experiment-log', 'paper-deep-read'],
    maxTurns: 10, permissionMode: 'acceptEdits'
  }
];

/* 转换为 SDK AgentDefinition（description=whenToUse，路由依据；tools 不含 Agent）。
   定义来源：work.json subagents 分区（内建播种 + 用户经管理页添加/编辑）。
   model：官方文档明确 'inherit' 为合法取值（跟随主会话模型，含 BYOK CustomModel
   路由）；子智能体不可嵌套派生，tools 一律不含 Agent。 */
function buildSubagentDefinitions(subagents: SubagentRecord[]): Record<string, AgentDefinition> {
  const defs: Record<string, AgentDefinition> = {};
  (subagents || []).forEach(function (s) {
    const tools: string[] = (s.sdkTools || []).slice();
    (s.scienceTools || []).forEach(function (t) { tools.push('mcp__chatscience__' + t); });
    const def: AgentDefinition = {
      description: String(s.whenToUse || s.name || ''),
      prompt: String(s.prompt || ''),
      tools: tools,
      model: s.model || 'inherit',
      maxTurns: Number(s.maxTurns) || 12,
      permissionMode: asPermissionMode(s.permissionMode, 'default'),
      mcpServers: ['chatscience'],
      skills: s.skills || []
    };
    defs[s.id] = def;
  });
  return defs;
}

function readConfig(appRoot: string): QoderConfigFile {
  try { return JSON.parse(fs.readFileSync(path.join(appRoot, 'server', 'qoder.json'), 'utf8')) as QoderConfigFile || {}; }
  catch (e) { return {}; }
}

/* ---------------- in-process 科研工具 server ---------------- */

/* SDK tool() 的 handler 返回 CallToolResult：{ content:[{type:'text',text}], isError? } */
function mcpResult(value: unknown): CallToolResult {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 1);
  return { content: [{ type: 'text', text: cap(text) }] } as CallToolResult;
}
/* A3 统一错误结构：MCP 约定返回 isError:true 而非抛异常（抛异常破坏协议链路）。
   错误文本带【结构化头】——工具名/错误类型/可重试性——模型据此决定重试或换路。 */
function mcpError(toolName: string, errType: string, msg: string, retryable: boolean): CallToolResult {
  const head = '[工具错误] tool=' + toolName + ' type=' + errType + ' retryable=' + (retryable ? 'yes' : 'no');
  return { isError: true, content: [{ type: 'text', text: head + '\n' + String(msg) }] } as CallToolResult;
}

/* ---------------- A1/A2：MCP 工具守卫（超时 + 熔断） ----------------
   04 策划案 A1：为每个 MCP 调用设独立超时，超时归入工具错误而非中断整个 turn。
   A2：连续失败 N 次后短暂熔断该工具，返回明确错误而非反复重试。
   验收方法（策划案 13.2）：故障注入验证降级表现。 */
const TOOL_TIMEOUT_MS = 30000;   /* 单次科研工具调用上限（沙箱 run_code 有自己的超时，不受此限） */
const BREAKER_THRESHOLD = 3;     /* 连续失败次数阈值 */
const BREAKER_COOLDOWN_MS = 60000; /* 熔断冷却窗口 */

interface ToolGuardState {
  consecutiveFailures: number;
  openUntil: number;
  lastError: string;
}

/* guard(toolName, isSandboxed, handler, timeoutMsOverride?)：超时与熔断都发生在
   handler 之外，对 handler 透明；run_code 走沙箱自身超时（policy.timeoutMs），
   不套 30s 短超时。timeoutMsOverride 仅供单测注入短超时，生产不传。 */
function guardTool(toolName: string, state: ToolGuardState, skipTimeout: boolean, handler: (args: any) => Promise<CallToolResult>, timeoutMsOverride?: number): (args: any) => Promise<CallToolResult> {
  return async function (args: any): Promise<CallToolResult> {
    const now = Date.now();
    if (state.openUntil > now) {
      const waitSec = Math.ceil((state.openUntil - now) / 1000);
      return mcpError(toolName, 'circuit-open', '该工具连续失败 ' + state.consecutiveFailures + ' 次已熔断，' + waitSec + 's 后自动恢复。上次错误：' + state.lastError + '。请勿立即重试——先调整参数或换其他方式。', false);
    }
    const limit = timeoutMsOverride || TOOL_TIMEOUT_MS;
    const invoke = handler(args);
    let result: CallToolResult;
    if (skipTimeout) {
      result = await invoke;   /* 沙箱执行：由沙箱策略负责超时强杀 */
    } else {
      let timedOut = false;
      result = await Promise.race([
        invoke,
        new Promise<CallToolResult>(function (resolve) {
          setTimeout(function () { timedOut = true; resolve(mcpError(toolName, 'timeout', '工具调用超过 ' + limit + 'ms 上限被中止（A1 超时保护）。可拆小任务重试或改用其他工具。', true)); }, limit);
        })
      ]);
      if (timedOut) {
        state.consecutiveFailures++;
        state.lastError = 'timeout ' + limit + 'ms';
        if (state.consecutiveFailures >= BREAKER_THRESHOLD) state.openUntil = Date.now() + BREAKER_COOLDOWN_MS;
        return result;
      }
    }
    if (result && (result as { isError?: boolean }).isError) {
      state.consecutiveFailures++;
      state.lastError = auditArgsSummary(result).slice(0, 160);
      if (state.consecutiveFailures >= BREAKER_THRESHOLD) {
        state.openUntil = Date.now() + BREAKER_COOLDOWN_MS;
      }
    } else {
      state.consecutiveFailures = 0;
      state.lastError = '';
    }
    return result;
  };
}

/* 单测钩子：验证脚本直调（不改对外行为） */
export const _toolGuardInternals = {
  TOOL_TIMEOUT_MS: TOOL_TIMEOUT_MS,
  BREAKER_THRESHOLD: BREAKER_THRESHOLD,
  BREAKER_COOLDOWN_MS: BREAKER_COOLDOWN_MS,
  newState: function (): ToolGuardState { return { consecutiveFailures: 0, openUntil: 0, lastError: '' }; },
  guardTool: guardTool,
  mcpError: mcpError
};

/* 验证钩子：七类子智能体规格（静态检查用） */
export const _subagentSpecs = SUBAGENT_SPECS;

export function buildScienceServer(sciCtx: ScienceToolCtx, sdk: import('../shared/qoder-sdk').QoderSdkModule): McpServerConfig {
  const { tool, createSdkMcpServer } = sdk;

  /* 每工具独立熔断状态（A2）；run_code 走沙箱自身超时策略，不套 30s 短超时 */
  const mkState = function (): ToolGuardState { return { consecutiveFailures: 0, openUntil: 0, lastError: '' }; };
  const stateArxiv = mkState(), stateFetch = mkState(), stateWeb = mkState();
  const stateKb = mkState(), stateNote = mkState(), stateRun = mkState();
  const stateDoi = mkState(), stateLatex = mkState(), stateUnit = mkState();
  const stateName = mkState(), stateCaption = mkState(), stateKw = mkState();

  const arxivSearch = tool(
    'arxiv_search',
    '检索 arXiv 论文（官方 API，免 key），返回标题、作者、摘要、arXiv id 与 PDF 链接。适合文献初筛与找复现目标。',
    { query: z.string().describe('关键词，多个词按 AND 组合'), maxResults: z.number().int().min(1).max(20).optional().describe('默认 5') },
    guardTool('arxiv_search', stateArxiv, false, async function (args) {
      try { return mcpResult(await research.arxivSearch(args)); }
      catch (e) { return mcpError('arxiv_search', 'network', (e as Error).message, true); }
    }),
    { annotations: { readOnlyHint: true } }
  );

  const fetchUrl = tool(
    'fetch_url',
    '抓取 http/https 网页并返回剥掉 HTML 的正文（截断）。用于核对检索结果原文。不支持 PDF——已导入知识库的论文请用 kb_search。',
    { url: z.string().describe('完整 URL'), maxChars: z.number().int().optional().describe('默认 12000') },
    guardTool('fetch_url', stateFetch, false, async function (args) {
      try { return mcpResult(await research.fetchUrl(args)); }
      catch (e) { return mcpError('fetch_url', 'network', (e as Error).message, true); }
    }),
    { annotations: { readOnlyHint: true } }
  );

  const webSearch = tool(
    'web_search',
    '联网检索（无 key 公开端点）。已知脆弱点：依赖第三方 HTML 解析，可能失效或质量有限；重要结论务必用 fetch_url 核对原文。',
    { query: z.string() },
    guardTool('web_search', stateWeb, false, async function (args) {
      try { return mcpResult(await research.webSearch(args)); }
      catch (e) { return mcpError('web_search', 'network', (e as Error).message, true); }
    }),
    { annotations: { readOnlyHint: true } }
  );

  const kbSearch = tool(
    'kb_search',
    '本地知识库 BM25 词法检索（不是语义检索），返回带 score 的段落。仅命中已建立索引的文件；若提示"尚未索引"，请告知用户在知识与数据库页重新导入文件。',
    {
      query: z.string(),
      kbId: z.string().optional().describe('限定某个知识库'),
      topK: z.number().int().optional().describe('默认 5')
    },
    guardTool('kb_search', stateKb, false, async function (args) {
      try {
        if (!sciCtx.kb) return mcpError('kb_search', 'unavailable', '知识库检索模块不可用', false);
        return mcpResult(await Promise.resolve(sciCtx.kb.search(args)));
      } catch (e) { return mcpError('kb_search', 'internal', (e as Error).message, true); }
    }),
    { annotations: { readOnlyHint: true } }
  );

  const noteWrite = tool(
    'note_write',
    '写入或更新一条实验笔记（与用户在笔记本页看到的是同一份）。记录实验配置、结果与结论。传 noteId 即更新。',
    { noteId: z.string().optional(), title: z.string().describe('笔记标题'), content: z.string().describe('Markdown 正文') },
    guardTool('note_write', stateNote, false, async function (args) {
      try {
        const rec = sciCtx.notes.upsert({
          id: args.noteId, title: args.title, content: args.content,
          source: 'agent', convId: sciCtx.convId || null
        });
        return mcpResult({ noteId: rec.id, title: rec.title, updatedAt: rec.updatedAt, hint: '用户可在 笔记本 页看到这条笔记' });
      } catch (e) { return mcpError('note_write', 'internal', (e as Error).message, true); }
    })
  );

  const runCode = tool(
    'run_code',
    '在独立沙箱进程里执行一段代码（python/node/shell），比直接用 Bash 更隔离：独立工作目录、超时强杀进程树、输出截断、破坏性命令静态拦截。'
    + 'matplotlib 已配置 Agg 后端，图片保存到 out/ 下会自动回传。返回 stdout/stderr 与产物列表。优先小样本验证再放大。',
    {
      lang: z.string().optional().describe('python | node | shell，默认 python'),
      code: z.string().describe('完整代码'),
      timeoutMs: z.number().int().optional().describe('覆盖默认超时')
    },
    guardTool('run_code', stateRun, true, async function (args) {
      try {
        const r = await sciCtx.sandbox.execCode({
          scopeId: sciCtx.scopeId, cwd: sciCtx.workspaceRoot || undefined, lang: args.lang || 'python', code: String(args.code || ''),
          policyOverride: args.timeoutMs ? { timeoutMs: args.timeoutMs } : undefined,
          onEvent: sciCtx.onToolStream ? function (kind, delta) { sciCtx.onToolStream!(kind, delta); } : null
        });
        return mcpResult({
          ok: r.ok, exitCode: r.exitCode, timedOut: r.timedOut, blocked: r.blocked, blockReason: r.blockReason,
          stdout: truncateStr(r.stdout, 6000), stderr: truncateStr(r.stderr, 4000),
          durationMs: r.durationMs,
          files: (r.files || []).map(function (f) { return { relPath: f.relPath, size: f.size, isImage: f.isImage, inlined: !!f.dataUrl }; })
        });
      } catch (e) { return mcpError('run_code', 'sandbox', (e as Error).message, true); }
    })
  );

  /* ---------------- C1：六个自定义科研工具（纯本地计算为主） ---------------- */

  const doiCite = tool(
    'doi_cite',
    'DOI 生成学术引用：BibTeX 与 GB/T 7714 双格式。可传入完整 meta（纯本地生成）；只给 DOI 时联网取官方元数据（失败返回待补全模板并如实标注，不伪造）。校验 DOI 语法。',
    {
      doi: z.string().optional().describe('如 10.1234/abc.def'),
      meta: z.object({
        title: z.string().optional(), authors: z.array(z.string()).optional(),
        year: z.union([z.number(), z.string()]).optional(), journal: z.string().optional(),
        volume: z.string().optional(), issue: z.string().optional(), pages: z.string().optional(), publisher: z.string().optional()
      }).optional().describe('直接给元数据则完全本地'),
      style: z.enum(['bibtex', 'gbt7714', 'both']).optional().describe('默认 both')
    },
    guardTool('doi_cite', stateDoi, false, async function (args) {
      try { return mcpResult(await sciTools.doiCite(args)); }
      catch (e) { return mcpError('doi_cite', 'internal', (e as Error).message, true); }
    }),
    { annotations: { readOnlyHint: true, openWorldHint: true } }
  );

  const latexCheck = tool(
    'latex_check',
    'LaTeX 公式校验（纯本地）：花括号/数学定界符/\\left-\\right 配对、\\begin-\\end 环境配对、未知命令提示（白名单比对）。交付论文公式前自检用。',
    { latex: z.string().describe('待检查的 LaTeX 片段（可多行）') },
    guardTool('latex_check', stateLatex, false, async function (args) {
      try { return mcpResult(sciTools.latexCheck(args)); }
      catch (e) { return mcpError('latex_check', 'internal', (e as Error).message, false); }
    }),
    { annotations: { readOnlyHint: true } }
  );

  const unitConvert = tool(
    'unit_convert',
    '科研单位换算（纯本地）：长度/质量/时间/能量/压力/数据/力/功率/角度线性因子换算，温度四制式（°C/°F/K/°R）。用于把论文单位换成本项目常用单位。',
    { value: z.number(), from: z.string().describe('源单位，如 MPa'), to: z.string().describe('目标单位，如 atm') },
    guardTool('unit_convert', stateUnit, false, async function (args) {
      try { return mcpResult(sciTools.unitConvert(args)); }
      catch (e) { return mcpError('unit_convert', 'internal', (e as Error).message, false); }
    }),
    { annotations: { readOnlyHint: true } }
  );

  const nameNormalize = tool(
    'name_normalize',
    '变量与文件命名规范化（纯本地）：snake_case/camelCase/PascalCase/kebab-case/安全文件名/LaTeX 变量六种风格互转，跨平台安全的文件名建议。',
    { name: z.string(), style: z.enum(['snake_case', 'camelCase', 'PascalCase', 'kebab-case', 'filename', 'latex-var']).optional().describe('默认 snake_case') },
    guardTool('name_normalize', stateName, false, async function (args) {
      try { return mcpResult(sciTools.nameNormalize(args)); }
      catch (e) { return mcpError('name_normalize', 'internal', (e as Error).message, false); }
    }),
    { annotations: { readOnlyHint: true } }
  );

  const figureCaption = tool(
    'figure_caption',
    '学术图表注生成（纯本地）：按「图/表编号 + 内容 + 方法/数据集 + 误差条 + 显著性标注 + 核心观察」规范生成中英文图注/表注，附自检清单。',
    {
      kind: z.enum(['figure', 'table']),
      what: z.string().describe('一句话说明图/表展示什么'),
      method: z.string().optional(), dataset: z.string().optional(),
      metricNames: z.array(z.string()).optional(),
      hasErrorBars: z.boolean().optional(),
      significance: z.string().optional().describe('如 "* p<0.05, ** p<0.01"'),
      highlight: z.string().optional(),
      lang: z.enum(['zh', 'en']).optional()
    },
    guardTool('figure_caption', stateCaption, false, async function (args) {
      try { return mcpResult(sciTools.figureCaption(args)); }
      catch (e) { return mcpError('figure_caption', 'internal', (e as Error).message, false); }
    }),
    { annotations: { readOnlyHint: true } }
  );

  const keywordExpand = tool(
    'keyword_expand',
    '研究关键词与同义词扩展（纯本地）：大模型/具身智能高频词内置同义表 + 单复数/连字符形态变体，生成 arXiv 可用的布尔检索式。文献检索前先用它扩词。',
    { keywords: z.array(z.string()).describe('关键词列表'), maxPerTerm: z.number().int().optional().describe('每词最多扩展数，默认 6') },
    guardTool('keyword_expand', stateKw, false, async function (args) {
      try { return mcpResult(sciTools.keywordExpand(args)); }
      catch (e) { return mcpError('keyword_expand', 'internal', (e as Error).message, false); }
    }),
    { annotations: { readOnlyHint: true } }
  );

  return createSdkMcpServer({
    name: 'chatscience',
    tools: [arxivSearch, fetchUrl, webSearch, kbSearch, noteWrite, runCode,
      doiCite, latexCheck, unitConvert, nameNormalize, figureCaption, keywordExpand]
  });
}

/* canUseTool 沙箱策略：deny 的原因会回给模型，模型通常下一轮自行调整。
   B6/D3：options.agentID 标识「本次工具调用由哪个子智能体发起」——在权限层按
   agentID 落审计，即是「主智能体唯一网关」语义的最小落地（网关审计点）。
   audit 参数可选（sdk-verify.js 以三参调用本函数，行为不变）。 */
export function makeCanUseTool(cwd: string, policy: Partial<import('../shared/domain').SandboxPolicy>, log: (line: string) => void, audit?: AuditLog): CanUseTool {
  return async function (toolName, input, options) {
    const agentId = (options && options.agentID) || null;
    try {
      if (toolName === 'Bash') {
        const scan = policyMod.scanCode(String((input && input.command) || ''), policy);
        if (scan.blocked) {
          log('canUseTool deny Bash' + (agentId ? ' [agent:' + agentId + ']' : '') + ': ' + scan.reason);
          if (audit) audit.append({ ts: new Date().toISOString(), event: 'permission_denied', tool: toolName, toolUseId: options && options.toolUseID, agentId: agentId, argsSummary: auditArgsSummary(input), resultStatus: 'denied', detail: auditDetail(scan.reason) });
          return { behavior: 'deny', message: '已拦截高危命令：' + scan.reason + '（静态拦截，防误操作；如确需执行请换方式）' };
        }
      }
      if (toolName === 'Write' || toolName === 'Edit') {
        const p = String((input && ((input as Record<string, unknown>).file_path || (input as Record<string, unknown>).notebook_path)) || '');
        if (p) {
          try { policyMod.assertInside(cwd, p); }
          catch (e) {
            log('canUseTool deny ' + toolName + (agentId ? ' [agent:' + agentId + ']' : '') + ': ' + (e as Error).message);
            if (audit) audit.append({ ts: new Date().toISOString(), event: 'permission_denied', tool: toolName, toolUseId: options && options.toolUseID, agentId: agentId, argsSummary: auditArgsSummary({ file_path: p }), resultStatus: 'denied', detail: auditDetail((e as Error).message) });
            return { behavior: 'deny', message: '路径超出沙箱工作目录，禁止写入：' + p + '（产物请写到 cwd 内，图片建议 out/ 子目录）' };
          }
        }
      }
      /* B6：放行决策同样留痕（子智能体调用必记，主会话高频只读工具不记避免噪音） */
      if (audit && agentId) {
        audit.append({ ts: new Date().toISOString(), event: 'tool_start', tool: toolName, toolUseId: options && options.toolUseID, agentId: agentId, argsSummary: auditArgsSummary(input), resultStatus: 'ok', detail: 'gateway-allow' });
      }
    } catch (e) {
      log('canUseTool error: ' + (e as Error).message);   /* 守卫自身出错不阻断会话 */
    }
    return { behavior: 'allow', updatedInput: input };
  };
}

/* ---------------- A4：工具审计 Hooks（官方生命周期通道） ----------------
   PreToolUse / PostToolUse / PostToolUseFailure 三事件覆盖「调用前后 + 失败」，
   拿到的是官方标准 Hook 输入结构。审计是旁路：写失败不影响会话。
   SubagentStart/SubagentStop 额外发 notice（E7 可观测性：子智能体活动前端可见）。 */
function makeAuditHooks(audit: AuditLog, emit: (e: 'notice', d: { runId: string; code: string; message: string }) => void, runId: string): Options['hooks'] {
  const asHook = function (fn: (input: HookInput, toolUseID: string | undefined) => HookJSONOutput | Promise<HookJSONOutput>): HookCallback {
    return async function (input, toolUseID) { return fn(input, toolUseID); };
  };
  const toolStartAt: Record<string, number> = {};
  return {
    PreToolUse: [{ hooks: [asHook(function (input, toolUseID) {
      const inp = input as Extract<HookInput, { hook_event_name: 'PreToolUse' }>;
      const toolName = String(inp.tool_name || '');
      toolStartAt[String(toolUseID || toolName)] = Date.now();
      audit.append({ ts: new Date().toISOString(), event: 'tool_start', tool: toolName, toolUseId: toolUseID, argsSummary: auditArgsSummary(inp.tool_input) });
      return {};
    })] }],
    PostToolUse: [{ hooks: [asHook(function (input, toolUseID) {
      const inp = input as Extract<HookInput, { hook_event_name: 'PostToolUse' }>;
      const started = toolStartAt[String(toolUseID || inp.tool_name || '')];
      audit.append({
        ts: new Date().toISOString(), event: 'tool_end', tool: String(inp.tool_name || ''),
        toolUseId: toolUseID,
        durationMs: started ? Date.now() - started : undefined,
        resultStatus: 'ok', argsSummary: auditArgsSummary(inp.tool_input)
      });
      return {};
    })] }],
    PostToolUseFailure: [{ hooks: [asHook(function (input, toolUseID) {
      const inp = input as Extract<HookInput, { hook_event_name: 'PostToolUseFailure' }>;
      audit.append({
        ts: new Date().toISOString(), event: 'tool_error', tool: String(inp.tool_name || ''),
        toolUseId: toolUseID,
        resultStatus: 'error',
        detail: auditDetail((inp as unknown as { error?: string }).error) + (inp.is_interrupt ? ' [用户中断]' : '')
      });
      return {};
    })] }],
    SubagentStart: [{ hooks: [asHook(function (input) {
      const inp = input as Extract<HookInput, { hook_event_name: 'SubagentStart' }>;
      audit.append({ ts: new Date().toISOString(), event: 'subagent', tool: String(inp.agent_type || ''), agentId: String(inp.agent_id || ''), resultStatus: 'ok' });
      emit('notice', { runId: runId, code: 'subagent_start', message: '子智能体启动：' + String(inp.agent_type || inp.agent_id || '') });
      return {};
    })] }],
    SubagentStop: [{ hooks: [asHook(function (input) {
      const inp = input as Extract<HookInput, { hook_event_name: 'SubagentStop' }>;
      audit.append({ ts: new Date().toISOString(), event: 'subagent', agentId: String((inp as unknown as { agent_id?: string }).agent_id || 'stop'), resultStatus: 'ok', detail: 'subagent-stop' });
      emit('notice', { runId: runId, code: 'subagent_stop', message: '子智能体结束：' + String((inp as unknown as { agent_id?: string }).agent_id || '') });
      return {};
    })] }],
    PermissionDenied: [{ hooks: [asHook(function (input) {
      const inp = input as Extract<HookInput, { hook_event_name: 'PermissionDenied' }>;
      audit.append({ ts: new Date().toISOString(), event: 'permission_denied', tool: String((inp as unknown as { tool_name?: string }).tool_name || ''), resultStatus: 'denied', detail: auditDetail((inp as unknown as { reason?: string }).reason) });
      return {};
    })] }]
  };
}

/* ---------------- BYOK-only：所有模型调用一律走用户自有 API Key ----------------
   实测结论（2026-09-15，多轮实验）：
   - 正确用法：options.model 直接填用户已注册的 BYOK 模型 id（如 qwen3.8-flash-pg），
     凭据由 Qoder 服务端持有，模型调用不消耗平台 credits。已实测真实响应成功。
   - per-call CustomModel 注入（resolveModel 返回 {provider, api_key}）会被服务端
     拒绝（"Failed to generate custom pool" / "access token rejected"），不可用。
   - 已注册配置经 q.listByokConfigs() 查询（会话内），启动时查一次缓存；
     bootstrap 暴露给前端，管理页据此列出可绑定的 BYOK 模型。
   - 各模型输入窗口见目录 max_input_tokens（qwen3.8 系 1M、glm5.1 202K、
     glm5 198K、kimi-k2.7-code 256K 等）；已注册配置 contextWindow 可配
     200K/400K/1M。

   2026-09-15 定案：平台订阅档位路由（auto/ultimate/performance/efficient/lite）
   彻底移除——模型调用只走 BYOK 直连。resolveModel 的唯一职责是「锁定」：
   把 SDK 内部所有 purpose（main/plan/task/compact/utility）的模型请求都压回
   绑定的 BYOK 模型，防止任何调用漏进平台订阅通道消耗 credits。 */
function normalizeModelBase(id: string): string {
  return String(id || '').toLowerCase().replace(/-(tp|cp|pg)$/, '').replace(/-0?\d{3,4}$/, '');
}

/* ---------------- 领域插件（科研外挂，2026-09-15） ----------------
   app/server/plugins/<domain>/ 布局：
   .qoder-plugin/plugin.json  声明名/版本/描述
   agents/*.md                领域子智能体（frontmatter: name/description/model/tools，
                              正文=系统提示词）→ 宿主解析后注册进 options.agents（key=plugin:agent），
                              墨道经 Agent 工具委派——不依赖 CLI 侧发现行为
   skills/<name>/SKILL.md     领域技能 → 以 plugin:skill 限定名追加进 options.skills
   commands/*.md              领域命令 → CLI 原生发现（/plugin:cmd）
   .mcp.json                  领域 MCP → CLI 原生加载（tools/mcp-mini.js stdio server）
   启用状态存 work.json domainPlugins：未记录=启用，显式 false=关闭。 */
function parseAgentMd(file: string): { name: string; description: string; model: string; tools: string[]; prompt: string } | null {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
    if (!m) return null;
    const fm: Record<string, string> = {};
    m[1].split(/\r?\n/).forEach(function (line) {
      const kv = /^([A-Za-z_-]+)\s*:\s*(.*)$/.exec(line.trim());
      if (kv) fm[kv[1].toLowerCase()] = kv[2].trim().replace(/^['"]|['"]$/g, '');
    });
    if (!fm.name) return null;
    return {
      name: fm.name,
      description: fm.description || '',
      model: fm.model || 'inherit',
      tools: fm.tools ? fm.tools.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [],
      prompt: (m[2] || '').trim()
    };
  } catch (e) { return null; }
}

export function makeModelResolver(byokModelId: string, audit?: AuditLog): ModelPolicyProvider {
  return function (context: ModelPolicyContext): ModelPolicyResult {
    if (audit) audit.append({ ts: new Date().toISOString(), event: 'model_policy', tool: String(context.agentType || ''), agentId: context.agentId || null, argsSummary: 'purpose=' + String(context.purpose || 'main'), resultStatus: 'ok', detail: 'byok=' + byokModelId });
    return { model: byokModelId };
  };
}

/* ---------------- 会话运行 ---------------- */

export function createQoder(appRoot: string, ctx: QoderDeps): QoderApi {
  const log = ctx.log;
  const cfg = readConfig(appRoot);
  const auditLog = new AuditLog(appRoot);
  const BUILTIN_SKILL_PLUGIN = path.join(appRoot, 'server', 'skills-plugin');
  const USER_SKILL_PLUGIN = path.join(appRoot, 'data', 'skills-plugin');

  /* 播种子智能体到 work.json subagents 分区：builtin 查漏补齐（代码新增的子智能体）。
     已存在的定义不做字段跟随刷新——用户经管理页的编辑是最终事实（可编辑承诺）。 */
  (function () {
    ctx.store.update('subagents', function (list) {
      const arr = Array.isArray(list) ? list : [];
      let changed = false;
      SUBAGENT_SPECS.forEach(function (s) {
        const hit = arr.find(function (a) { return a.id === s.id; });
        if (!hit) {
          const rec = JSON.parse(JSON.stringify(s)) as SubagentRecord;
          rec.builtin = true;
          arr.push(rec);
          changed = true;
        }
      });
      return changed ? arr : undefined;
    }).catch(function (e) { log('seed subagents failed: ' + (e as Error).message); });
  })();

  /* 子智能体注册表：builtin 七类 + 用户自定义（管理页添加），均不可删除 */
  function listSubagents(): SubagentRecord[] {
    return ctx.store.section('subagents') || [];
  }

  /* 领域插件清单：扫描 app/server/plugins/（内置）与 app/data/plugins/（用户上传），
     启用状态读 work.json domainPlugins；用户目录中与内置同名的插件跳过（保护内置）。 */
  const PLUGINS_DIR = path.join(appRoot, 'server', 'plugins');
  const USER_PLUGINS_DIR = path.join(appRoot, 'data', 'plugins');
  function listDomainPlugins(): DomainPluginInfo[] {
    const out: DomainPluginInfo[] = [];
    const st = (ctx.store.section('domainPlugins') || {}) as Record<string, boolean>;
    const scanRoot = function (root: string, skipBuiltin: boolean) {
      try {
        fs.readdirSync(root, { withFileTypes: true }).forEach(function (d) {
        if (!d.isDirectory()) return;
        if (skipBuiltin && out.some(function (p) { return p.key === d.name; })) return;
        const dir = path.join(root, d.name);
        let meta: Record<string, unknown> = {};
        try { meta = JSON.parse(fs.readFileSync(path.join(dir, '.qoder-plugin', 'plugin.json'), 'utf8')) || {}; } catch (e) { /* 损坏 manifest 按目录名继续 */ }
        const agents: string[] = [];
        const agentsDir = path.join(dir, 'agents');
        if (fs.existsSync(agentsDir)) {
          fs.readdirSync(agentsDir).forEach(function (f) { if (/\.md$/.test(f)) agents.push(f.replace(/\.md$/, '')); });
        }
        const skills: string[] = [];
        const skillsDir = path.join(dir, 'skills');
        if (fs.existsSync(skillsDir)) {
          fs.readdirSync(skillsDir, { withFileTypes: true }).forEach(function (s) { if (s.isDirectory()) skills.push(s.name); });
        }
        const commands: string[] = [];
        const cmdDir = path.join(dir, 'commands');
        if (fs.existsSync(cmdDir)) {
          fs.readdirSync(cmdDir).forEach(function (f) { if (/\.md$/.test(f)) commands.push(f.replace(/\.md$/, '')); });
        }
        /* tools.json：本插件 MCP server 的工具清单（精确名进主会话与子智能体白名单） */
        const mcpTools: string[] = [];
        const bareTools: string[] = [];
        let mcpServerKey = '';
        try {
          const tj = JSON.parse(fs.readFileSync(path.join(dir, 'tools.json'), 'utf8'));
          mcpServerKey = String(tj.server || (d.name + '-tools'));
          (Array.isArray(tj.tools) ? tj.tools : []).forEach(function (t: unknown) {
            bareTools.push(String(t));
            mcpTools.push('mcp__' + mcpServerKey + '__' + String(t));
          });
        } catch (e) { /* 无 tools.json：插件不带 MCP 工具白名单（.mcp.json 仍由 CLI 加载） */
        }
        /* 配置：configSchema.json 声明默认值，config.json 覆盖（合并后供工具运行时读取） */
        let schema: Record<string, unknown> | null = null;
        const merged: Record<string, unknown> = {};
        try {
          schema = JSON.parse(fs.readFileSync(path.join(dir, 'configSchema.json'), 'utf8'));
          const props = (schema && (schema as { properties?: Record<string, { default?: unknown }> }).properties) || {};
          Object.keys(props).forEach(function (k) { merged[k] = props[k].default; });
        } catch (e) { /* 无声明 */ }
        try {
          const uc = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));
          Object.assign(merged, uc || {});
        } catch (e) { /* 无用户覆盖 */ }
        out.push({
          key: d.name, dir: dir,
          description: String(meta.description || ''), version: String(meta.version || ''),
          enabled: st[d.name] !== false,
          agents: agents, skills: skills, commands: commands,
          hasMcp: fs.existsSync(path.join(dir, '.mcp.json')),
          mcpTools: mcpTools,
          tools: bareTools,
          config: merged,
          configSchema: schema,
          hasReadme: fs.existsSync(path.join(dir, 'README.md'))
        });
      });
      } catch (e) { /* 该插件根目录不存在：跳过 */ }
    };
    scanRoot(PLUGINS_DIR, false);
    scanRoot(USER_PLUGINS_DIR, true);
    return out;
  }

  /* 用户上传插件（2026-09-16）：写入 data/plugins/<key>/。
     路径白名单：逐段过滤 . / .. ，写入前再次校验必须落在插件根内，防目录穿越。 */
  function createPlugin(key: string, files: Array<{ path: string; content: string }>): { key: string; files: number } {
    const clean = String(key || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (!clean) throw new Error('插件标识非法（仅允许字母数字-_）');
    const list = Array.isArray(files) ? files : [];
    if (!list.length) throw new Error('插件文件为空');
    const root = path.resolve(USER_PLUGINS_DIR, clean);
    let written = 0;
    list.forEach(function (f) {
      const rel = String((f && f.path) || '').replace(/\\/g, '/').split('/').filter(function (seg) {
        return seg && seg !== '.' && seg !== '..';
      }).join(path.sep);
      if (!rel) return;
      const full = path.resolve(root, rel);
      if (full.indexOf(root + path.sep) !== 0) return; /* 越界丢弃 */
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, String(f && f.content != null ? f.content : ''), 'utf8');
      written++;
    });
    if (!written) throw new Error('没有可写入的插件文件');
    return { key: clean, files: written };
  }

  /* BYOK 缓存：启动后异步查一次用户已注册的 BYOK 模型配置（短会话内查询）。
     probe 会话用平台档位 'lite' 仅为控制面引导（BYOK 清单就绪前无模型可用），
     init 后立即中断，不产生业务模型调用；业务调用全部走 BYOK。
     刷新失败记录日志——byokModels 为空时前端不展示 BYOK 选项，业务回合会给出
     「未检测到 API Key 模型」的明确报错（不再回落平台档位）。 */
  let byokCache: ByokModelInfo[] | null = null;
  let byokRefreshing: Promise<void> | null = null;
  function refreshByokCache(): Promise<void> {
    if (byokRefreshing) return byokRefreshing;
    byokRefreshing = (async function () {
      const sdk = await loadSdk();
      const probe = sdk.query({
        prompt: 'ping',
        options: {
          auth: sdk.accessToken(cfg.accessToken as string),
          cwd: path.join(appRoot, 'data', 'sandbox', 'global', 'work'),
          maxTurns: 1, model: 'lite', settingSources: [], strictMcpConfig: true
        }
      });
      for await (const msg of probe) {
        if (msg.type === 'system' && msg.subtype === 'init') {
          const cfgs = (await probe.listByokConfigs()) || [];
          byokCache = cfgs.map(function (c: Record<string, unknown>) {
            return {
              key: String(c.key || ''),
              provider: String(c.provider || ''),
              model: String(c.model || ''),
              displayName: c.displayName ? String(c.displayName) : undefined,
              contextWindow: typeof c.contextWindow === 'number' ? c.contextWindow : undefined,
              maxInputTokens: typeof c.maxInputTokens === 'number' ? c.maxInputTokens : undefined
            };
          });
          log('byok cache refreshed: ' + byokCache.length + ' model(s)');
          break;
        }
      }
    })().catch(function (e) { log('byok cache refresh failed: ' + (e as Error).message + '（下次 bootstrap/回合前会自动重试）'); })
      .finally(function () { byokRefreshing = null; });
    return byokRefreshing;
  }
  refreshByokCache();
  /* bootstrap 等待就绪（带超时）：避免启动早期查询拿到空缓存 */
  async function byokModelsReady(timeoutMs?: number): Promise<ByokModelInfo[] | null> {
    if (byokCache) return byokCache;
    await Promise.race([refreshByokCache(), new Promise(function (r) { setTimeout(r, timeoutMs || 8000); })]);
    return byokCache;
  }

  /* BYOK 模型选择（BYOK-only 语义）：agent.modelKey 精确/模糊匹配已注册清单；
     未绑定/'byok' → 全局默认（清单第一个）。byokCache 为空 → null（调用方报错，
     不再回落平台档位）。 */
  function resolveByokModelId(agentDef: AgentDefRecord): string | null {
    if (!byokCache || !byokCache.length) return null;
    const mk = String(agentDef.modelKey || '');
    if (!mk || mk === 'byok') return byokCache[0].model;
    const exact = byokCache.find(function (m) { return m.model === mk || m.key === mk; });
    if (exact) return exact.model;
    const base = normalizeModelBase(mk);
    const fuzzy = byokCache.find(function (m) { return normalizeModelBase(m.model) === base || m.model.toLowerCase().indexOf(base) === 0; });
    return fuzzy ? fuzzy.model : byokCache[0].model;
  }

  /* 用户技能插件目录按 SDK local plugin 约定初始化，内建技能播种进去（缺哪些补哪些） */
  function ensureSkillPlugin(): string | null {
    try {
      const manifest = path.join(USER_SKILL_PLUGIN, '.qoder-plugin', 'plugin.json');
      if (!fs.existsSync(manifest)) {
        fs.mkdirSync(path.dirname(manifest), { recursive: true });
        fs.writeFileSync(manifest, JSON.stringify({
          name: 'chatscience-skills', version: '1.0.0',
          description: 'ChatScience 科研技能包（内建 + 用户自定义）'
        }, null, 2), 'utf8');
      }
      fs.mkdirSync(path.join(USER_SKILL_PLUGIN, 'skills'), { recursive: true });
      const src = path.join(BUILTIN_SKILL_PLUGIN, 'skills');
      if (fs.existsSync(src)) {
        fs.readdirSync(src, { withFileTypes: true }).forEach(function (d) {
          if (!d.isDirectory()) return;
          const dest = path.join(USER_SKILL_PLUGIN, 'skills', d.name);
          if (!fs.existsSync(dest)) fs.cpSync(path.join(src, d.name), dest, { recursive: true });
        });
      }
      return USER_SKILL_PLUGIN;
    } catch (e) {
      log('skill plugin init failed: ' + (e as Error).message);
      return fs.existsSync(BUILTIN_SKILL_PLUGIN) ? BUILTIN_SKILL_PLUGIN : null;
    }
  }

  /* 已发现的技能清单（供前端展示；以磁盘目录为准） */
  function listSkills(): SkillInfo[] {
    const dir = ensureSkillPlugin();
    const out: SkillInfo[] = [];
    if (!dir) return out;
    const root = path.join(dir, 'skills');
    let entries: fs.Dirent[] = [];
    try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch (e) { return out; }
    entries.forEach(function (d) {
      if (!d.isDirectory()) return;
      const f = path.join(root, d.name, 'SKILL.md');
      if (!fs.existsSync(f)) return;
      const md = fs.readFileSync(f, 'utf8');
      const fm: Record<string, string> = {};
      const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (m) {
        m[1].split(/\r?\n/).forEach(function (line) {
          const kv = line.match(/^([a-zA-Z_-]+)\s*:\s*(.*)$/);
          if (kv) fm[kv[1].trim()] = kv[2].trim().replace(/^["']|["']$/g, '');
        });
      }
      const body = md.replace(/^---\r?\n[\s\S]*?\r?\n---/, '').trim();
      out.push({
        slug: d.name,
        name: fm.name || d.name,
        description: fm.description || '',
        builtin: fs.existsSync(path.join(BUILTIN_SKILL_PLUGIN, 'skills', d.name, 'SKILL.md')),
        chars: body.length, updatedAt: fs.statSync(f).mtimeMs
      });
    });
    return out.sort(function (a, b) { return a.slug.localeCompare(b.slug); });
  }

  function readSkill(slug: string): { slug: string; markdown: string } | null {
    const dir = ensureSkillPlugin();
    const clean = String(slug || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const f = path.join(dir || '', 'skills', clean, 'SKILL.md');
    if (!fs.existsSync(f)) return null;
    return { slug: clean, markdown: fs.readFileSync(f, 'utf8') };
  }

  function writeSkill(slug: string, frontmatter: Record<string, string>, body: string): { slug: string } {
    const dir = ensureSkillPlugin();
    const clean = String(slug || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (!clean) throw new Error('slug 非法（仅允许字母数字-_）');
    const dir2 = path.join(dir || '', 'skills', clean);
    fs.mkdirSync(dir2, { recursive: true });
    const fm = Object.keys(frontmatter || {}).map(function (k) { return k + ': ' + frontmatter[k]; }).join('\n');
    fs.writeFileSync(path.join(dir2, 'SKILL.md'), '---\n' + fm + '\n---\n\n' + String(body || '') + '\n', 'utf8');
    return { slug: clean };
  }

  function deleteSkill(slug: string): { deleted: string } {
    const dir = ensureSkillPlugin();
    const clean = String(slug || '').replace(/[^a-zA-Z0-9_-]/g, '');
    fs.rmSync(path.join(dir || '', 'skills', clean), { recursive: true, force: true });
    return { deleted: clean };
  }

  /**
   * runWorkTurn(params, onEvent, externalSignal)
   * 返回 { ok, text, sessionId, numTurns, durationMs, is_error, errors, toolCalls }
   */
  async function runWorkTurn(params: WorkTurnParams, onEvent?: WorkRunEventHandler, externalSignal?: AbortSignal): Promise<WorkTurnResult> {
    const emit = function <K extends WorkRunEventName>(evt: K, data: WorkRunEventData): void {
      if (onEvent) { try { (onEvent as (e: WorkRunEventName, d: WorkRunEventData) => void)(evt, data); } catch (e) { /* 回调异常不影响主流程 */ } }
    };
    /* SDK 为 ESM：动态加载（Electron 内置 Node 20 无 require(esm)） */
    const sdk = await loadSdk();
    const agentDef = (params.agentDef || {}) as AgentDefRecord;
    const scopeId = params.scopeId || 'global';
    /* 工作区模式：Agent 直接在用户选择的本地文件夹里工作（cwd = 工作区根）；
       否则走沙箱工作目录。ensureScope 返回 {root,work,out,hooks}；cwd 用 .work */
    const workspaceRoot = (params.workspaceRoot && typeof params.workspaceRoot === 'string'
      && path.isAbsolute(params.workspaceRoot)) ? params.workspaceRoot : null;
    let workDir: string;
    if (workspaceRoot) {
      try {
        fs.accessSync(workspaceRoot);           /* 必须真实存在 */
        workDir = path.resolve(workspaceRoot);
      } catch (e) {
        emit('error', { runId: '', message: '工作区不可访问：' + workspaceRoot, fatal: true });
        return { ok: false, error: 'workspace not accessible: ' + workspaceRoot, text: '', toolCalls: 0, durationMs: 0 };
      }
    } else {
      workDir = ctx.sandbox.ensureScope(scopeId).work;
    }
    const policy = ctx.sandbox.policy();
    /* 设置页偏好：记忆 scope 开关 + Git/Worktree 约束（真实消费点，见 options 构建处） */
    const prefs = ctx.store.section('prefs');

    /* --- 工具可见集：SDK 内建（白名单交集）+ 科研工具 + MCP 白名单 ---
       语义：tools.sdk 未设置 = 默认全集；[] = 显式不给任何内建工具（纯 MCP 智能体） */
    const wantSdk = agentDef.tools ? agentDef.tools.sdk : undefined;
    const sdkTools = (Array.isArray(wantSdk))
      ? wantSdk.filter(function (n) { return (SDK_BUILTIN_DEFAULT as readonly string[]).indexOf(n) > -1; })
      : (SDK_BUILTIN_DEFAULT as readonly string[]).slice();
    /* 科研工具（in-process MCP）默认开启；agentDef.tools.builtin 为空数组时关闭 */
    const builtinWanted = (agentDef.tools && agentDef.tools.builtin !== undefined) ? agentDef.tools.builtin : ['science'];
    const sciEnabled = builtinWanted.indexOf('science') > -1;
    const mcpServers: Record<string, McpServerConfig> = {};
    const mcpToolNames: string[] = [];
    if (sciEnabled) {
      mcpServers.chatscience = buildScienceServer({
        sandbox: ctx.sandbox, notes: ctx.notes, kb: ctx.kb, scopeId: scopeId,
        workspaceRoot: workspaceRoot,
        convId: params.convId || null,
        onToolStream: function (kind, delta) { emit('tool_stream', { kind: kind, delta: delta }); }
      }, sdk);
      const allSci = ['arxiv_search', 'fetch_url', 'web_search', 'kb_search', 'note_write', 'run_code',
        'doi_cite', 'latex_check', 'unit_convert', 'name_normalize', 'figure_caption', 'keyword_expand'];
      const subset = (agentDef.tools && agentDef.tools.scienceTools);
      (Array.isArray(subset) && subset.length ? allSci.filter(function (n) { return subset.indexOf(n) > -1; }) : allSci)
        .forEach(function (n) { mcpToolNames.push('mcp__chatscience__' + n); });
    }
    /* 用户配置的外部 MCP 服务器：按智能体白名单透传（配置结构与 SDK McpServerConfig 一致） */
    const wantedMcp = (agentDef.tools && agentDef.tools.mcp) || null;
    const enabledServers = (ctx.store.section('mcpServers') || []).filter(function (s) { return s.enabled !== false; });
    enabledServers.forEach(function (s) {
      if (wantedMcp && !(s.key in wantedMcp)) return;
      const conf = Object.assign({}, s.config);
      if (s.key === 'chatscience') return;
      mcpServers[s.key] = conf;
      if (Array.isArray(s.tools)) {
        s.tools.forEach(function (t) { mcpToolNames.push('mcp__' + s.key + '__' + (typeof t === 'string' ? t : t.name)); });
      } else {
        /* 未枚举工具时按 always_allow 策略放行整个 server（工具名动态发现） */
        mcpToolNames.push('mcp__' + s.key);
      }
    });

    /* --- 技能：SDK local plugin + skills 白名单 --- */
    const pluginDir = ensureSkillPlugin();
    const skillStates = ctx.store.section('skills') || {};
    const discovered = listSkills();
    const enabledSlugs = discovered
      .filter(function (s) { const st = skillStates[s.slug]; return st ? st.enabled !== false : true; })
      .map(function (s) { return s.slug; });
    /* 领域插件（科研外挂）：扫描启用插件——agents 解析为可委派子智能体（key=plugin:agent，
       合并进 subagentDefs），skills 以 plugin:skill 限定名追加进技能白名单，
       目录稍后加进 options.plugins。非编排会话同样能加载插件的 skills/MCP/commands，
       只是没有 Agent 委派工具。 */
    const domainEnabled = listDomainPlugins().filter(function (p) { return p.enabled; });
    const pluginAgentDefs: Record<string, AgentDefinition> = {};
    const pluginSkillNames: string[] = [];
    domainEnabled.forEach(function (p) {
      /* 插件自带 MCP：in-process 注入（.mcp.json 的 stdio server 依赖外部 node 与
         CLI 变量展开，实测未可靠启动；in-process 与 chatscience 同通道，实测可靠）。
         工具清单来自插件 tools.json（精确名 mcp__<server>__<tool>）。 */
      if ((p.mcpTools || []).length) {
        const serverKey = p.mcpTools[0].split('__')[1];
        try {
          mcpServers[serverKey] = buildDomainServer(sdk, serverKey, p.mcpTools.map(function (t) { return t.split('__')[2]; }), p.config);
        } catch (e) { log('domain plugin mcp failed: ' + p.key + ' ' + (e as Error).message); }
      }
      (p.agents || []).forEach(function (a) {
        const def = parseAgentMd(path.join(p.dir, 'agents', a + '.md'));
        if (!def) return;
        const baseTools = def.tools.length ? def.tools : ['Read', 'Glob', 'Grep'];
        const mcpServerKey = (p.mcpTools && p.mcpTools.length) ? p.mcpTools[0].split('__')[1] : (p.key + '-tools');
        pluginAgentDefs[p.key + ':' + def.name] = {
          description: def.description || def.name,
          prompt: def.prompt,
          tools: baseTools.concat(p.mcpTools || []),
          model: def.model || 'inherit',
          maxTurns: 12,
          mcpServers: ['chatscience', mcpServerKey],
          skills: []
        };
      });
      (p.skills || []).forEach(function (s) { pluginSkillNames.push(p.key + ':' + s); });
      /* 插件 MCP 工具对主会话可见（精确名） */
      Array.prototype.push.apply(mcpToolNames, p.mcpTools || []);
    });

    const agentSkills = (agentDef.skills && agentDef.skills.length)
      ? enabledSlugs.filter(function (s: string) { return agentDef.skills!.indexOf(s) > -1; })
      : enabledSlugs;
    /* SDK 规范（options.skills 注释）：技能名匹配 SKILL.md frontmatter name 或目录名。
       09-15 技能改版后 frontmatter name 为中文（如 lit-review→文献综述），CLI 实际按
       frontmatter name 注册——两种形式都进白名单，确保 Skill 工具按任一命名可加载。 */
    const discoveredFm = listSkills();
    const fmName: Record<string, string> = {};
    discoveredFm.forEach(function (s) { fmName[s.slug] = s.name || s.slug; });
    const skillsOption: string[] = [];
    agentSkills.forEach(function (s: string) {
      skillsOption.push('chatscience-skills:' + s);
      if (fmName[s] && fmName[s] !== s) skillsOption.push('chatscience-skills:' + fmName[s]);
    });
    /* 领域插件技能：以 plugin:skill 限定名追加（开关按插件粒度，不按智能体过滤） */
    Array.prototype.push.apply(skillsOption, pluginSkillNames);

    const tools = sdkTools.slice();
    if (skillsOption.length) tools.push('Skill');
    Array.prototype.push.apply(tools, mcpToolNames);

    const ctl = new AbortController();
    const sig = externalSignal || params.signal;
    if (sig) {
      if (sig.aborted) ctl.abort();
      else sig.addEventListener('abort', function () { ctl.abort(); }, { once: true });
    }

    /* Agent 系统提示词：通用执行规范（任务拆解/工具调用/自主决策/错误修正/汇报）+ 智能体专属定位 */
    const agentSystemPrompt = [
      '# 角色',
      '你是 ChatScience Work 模式中的任务执行型 AI Agent。用户下达任务后，你负责规划并实际执行，直到任务完成或明确报告阻塞。',
      '# 工作流程',
      '1. 任务接收：先确认对任务目标的理解；存在关键歧义（目标不清、缺少必要信息、多重解释）时先提问澄清，不擅自假设。',
      '2. 拆解与规划：将任务拆解为有明确完成标准的子步骤，说明每一步的方法与工具；复杂任务先向用户简述计划再执行。',
      '3. 执行：优先调用可用工具实际操作（代码执行、文件读写、知识库检索、技能与 MCP 工具），不用「假设会成功」代替真实执行；每次工具调用前说明目的。',
      '4. 自主决策：计划外情况评估可选路径并说明决策依据；不可逆操作、超出授权范围、方案代价差异巨大时暂停询问。',
      '5. 错误识别与修正：失败不盲目重试同一操作——分析原因（参数错误/环境缺失/前提不成立），调整方案后重试；连续两次同类失败换思路并如实报告。',
      '6. 进度与汇报：长任务在阶段性节点简报进展（已完成/下一步）；完成后总结：结果、关键产物位置、验证方式、遗留事项与建议。',
      '# 执行原则',
      '- 安全边界：严格遵守沙箱策略与路径白名单；高危命令执行前说明影响；被策略拦截时理解原因并调整方案，不绕过安全机制。',
      '- 最小副作用：只修改与任务相关的文件与状态；能移动备份的不直接删除。',
      '- 结果可验证：关键产出必须实际读回验证（如写文件后读回确认），不以「应该成功了」为结论。',
      '- 诚实汇报：不夸大完成度；失败的尝试如实计入总结。',
      agentDef.systemPrompt ? '# 本智能体的专属定位\n' + String(agentDef.systemPrompt) : ''
    ].filter(Boolean).join('\n\n');

    /* --- 墨道主智能体调度（E2/E3）---
       主会话委派前提（SDK 机制）：tools 含 Agent 工具 + options.agents 注册子智能体。
       七类科研子智能体仅注册给主智能体；其余智能体行为完全不变。 */
    const isOrchestrator = agentDef.id === 'agent-orchestrator'
      || (Array.isArray(wantSdk) && wantSdk.indexOf('Agent') > -1);
    const subagentDefs = isOrchestrator ? buildSubagentDefinitions(listSubagents()) : null;
    if (subagentDefs && Object.keys(pluginAgentDefs).length) Object.assign(subagentDefs, pluginAgentDefs);

    /* BYOK-only：模型调用一律走用户自有 API Key（已注册 BYOK 模型）。
       先等缓存尽力就绪（启动早期未完成查询时最多等 8s），仍无可用模型则明确报错——
       绝不回落平台订阅档位（credits 通道）。 */
    await byokModelsReady(8000);
    const byokModelId = resolveByokModelId(agentDef);
    if (!byokModelId) {
      const msg = '未检测到已注册的 API Key 模型：请在 Qoder 客户端「设置 → 模型」配置自带模型（BYOK）后重启本应用。Work 模式不再使用平台订阅额度。';
      emit('error', { runId: '', message: msg, fatal: true });
      return { ok: false, error: msg, text: '', toolCalls: 0, durationMs: 0 };
    }

    const options: Options = {
      auth: sdk.accessToken(cfg.accessToken as string),
      cwd: workDir,
      /* 官方推荐（system-prompt 文档）：preset+append 保留 CLI 预设的工具规范、
         任务规划与安全约束，仅追加业务规则；完全替换会连带丢失这些行为。
         Git/Worktree 偏好（设置页）一并注入，作为墨道 git 行为约束。 */
      systemPrompt: { type: 'preset', preset: 'qodercli', append: agentSystemPrompt + gitPrefsPrompt(prefs) },
      /* BYOK 直连：options.model = 已注册 BYOK 模型 id（凭据存 Qoder 服务端） */
      model: byokModelId,
      /* 权限模式：请求覆盖 > 智能体定义 > 全局配置 > default（SDK 五档） */
      permissionMode: PERMISSION_MODES.indexOf(params.permissionMode as typeof PERMISSION_MODES[number]) > -1
        ? asPermissionMode(params.permissionMode)
        : (PERMISSION_MODES.indexOf(agentDef.permissionMode as typeof PERMISSION_MODES[number]) > -1
          ? asPermissionMode(agentDef.permissionMode)
          : asPermissionMode(cfg.permissionMode, 'default')),
      maxTurns: Math.min(Math.max(parseInt(String(agentDef.maxTurns), 10) || 12, 1), 64),
      /* 沙箱隔离三件套（U8 纪律：零改动） */
      settingSources: [],
      strictMcpConfig: true,
      tools: tools,
      allowedTools: tools.slice(),
      canUseTool: makeCanUseTool(workDir, policy, log, auditLog),
      mcpServers: mcpServers,
      includePartialMessages: true
    };
    /* SDK local plugins：科研技能包 + 启用的领域插件（agents/skills/commands/.mcp.json） */
    const pluginOpts: Array<{ type: 'local'; path: string }> = [];
    if (pluginDir) pluginOpts.push({ type: 'local', path: pluginDir });
    domainEnabled.forEach(function (p) { pluginOpts.push({ type: 'local', path: p.dir }); });
    if (pluginOpts.length) options.plugins = pluginOpts;
    if (skillsOption.length) options.skills = skillsOption;
    if (params.resumeSessionId) options.resume = params.resumeSessionId;
    /* E1：主智能体委派子智能体注册表 */
    if (subagentDefs) options.agents = subagentDefs;
    /* BYOK-only：不设置 resolveModel——实测（2026-09-15 二分实验）设置该回调会把
       会话打回平台额度通道（即使回调恒返回 BYOK 模型 id 也报 credit usage limit）；
       不设置时全 purpose（含子智能体 inherit/压缩/工具调用）均跟随 options.model 的
       BYOK 直连模型。 */
    /* 记忆开关（设置页「记忆行为」）真实生效：SDK MemoryOptions native 模式的
       scope 开关——关闭后本会话不读取也不更新对应作用域的记忆。 */
    options.memory = {
      mode: 'native',
      userScope: prefs.memory.globalOn !== false,
      projectScope: prefs.memory.projectOn !== false
    };
    /* A4：工具调用审计 hooks（旁路，写 data/work-audit.jsonl） */
    const runId = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    options.hooks = makeAuditHooks(auditLog, function (e, d) { emit(e, Object.assign({}, d, { runId: runId })); }, runId) as Options['hooks'];

    if (process.env.CS_DEBUG) {
      console.log('[qoder][debug] cwd=' + workDir);
      console.log('[qoder][debug] options=' + JSON.stringify(Object.assign({}, options, { auth: '<redacted>' })).slice(0, 800));
    }
    emit('run_start', { runId: runId, agentId: agentDef.id, model: options.model, permissionMode: options.permissionMode, tools: tools });

    const toolStartAt: Record<string, number> = {};
    let sessionId: string | null = params.resumeSessionId || null;
    let text = '';
    let toolCalls = 0;
    const t0 = Date.now();

    try {
      const q: Query = sdk.query({ prompt: String(params.prompt || ''), options: options });
      for await (const msg of q) {
        const m: SDKMessage = msg;
        if (ctl.signal.aborted) break;
        if (!sessionId && m.session_id) sessionId = m.session_id;

        if (m.type === 'system' && m.subtype === 'init') {
          emit('notice', {
            runId: runId, code: 'init',
            message: 'SDK ' + m.qodercli_version + ' · 模型 ' + m.model + ' · 权限 ' + m.permissionMode,
            skills: m.skills || [], mcpServers: m.mcp_servers || []
          });
        } else if (m.type === 'stream_event') {
          /* SDK 事件 delta 的字段在 d.ts 中较宽，这里按线路协议形状收窄（行为不变） */
          const d = (m.event && m.event.delta) as { type?: string; text?: string; thinking?: string; partial_json?: string } | undefined;
          if (!d) continue;
          if (d.type === 'text_delta' && d.text) { text += d.text; emit('delta', { runId: runId, delta: d.text }); }
          else if (d.type === 'thinking_delta' && d.thinking) emit('reasoning', { runId: runId, delta: d.thinking });
          else if (d.type === 'input_json_delta') { /* 参数流式：暂不逐帧透传，tool_start 时给全量 */ }
        } else if (m.type === 'assistant') {
          /* N2：parent_tool_use_id 是嵌套时间线的唯一依据（null=主会话；
             非 null=子智能体消息，指向父子间那次 Agent 工具调用）。增量字段，
             前端不读取时行为不变。 */
          const parentToolUseId = (m as unknown as { parent_tool_use_id?: string | null }).parent_tool_use_id ?? null;
          const blocks = ((m.message && m.message.content) || []) as AnyContentBlock[];
          blocks.forEach(function (b) {
            if (b.type !== 'tool_use') return;
            toolCalls++;
            toolStartAt[b.id] = Date.now();
            emit('tool_start', {
              runId: runId, callId: b.id, name: b.name,
              args: truncateStr(JSON.stringify(b.input || {}), 2000),
              parentToolUseId: parentToolUseId
            });
          });
        } else if (m.type === 'user') {
          const blocks = ((m.message && m.message.content) || []) as AnyContentBlock[];
          blocks.forEach(function (b) {
            if (b.type !== 'tool_result') return;
            const dur = toolStartAt[b.tool_use_id] ? Date.now() - toolStartAt[b.tool_use_id] : undefined;
            const txt = typeof b.content === 'string' ? b.content : JSON.stringify(b.content);
            emit('tool_end', {
              runId: runId, callId: b.tool_use_id,
              ok: !b.is_error, durationMs: dur,
              result: truncateStr(txt, 4000),
              error: b.is_error ? truncateStr(txt, 400) : undefined,
              parentToolUseId: (m as unknown as { parent_tool_use_id?: string | null }).parent_tool_use_id ?? null
            });
          });
        } else if (m.type === 'system' && m.subtype === 'permission_denied') {
          emit('tool_end', {
            runId: runId, callId: m.tool_use_id, ok: false,
            error: '权限拒绝：' + (m.message || m.tool_name),
            result: '已被沙箱策略或权限配置拒绝'
          });
        } else if (m.type === 'result') {
          const rm = m as SDKMessage & {
            subtype: string; result?: string; num_turns?: number; duration_ms?: number;
            is_error?: boolean; errors?: string[]; session_id?: string;
          };
          if (rm.subtype === 'success') text = rm.result || text;
          const out: WorkTurnResult = {
            ok: rm.subtype === 'success' && !rm.is_error,
            text: text,
            sessionId: rm.session_id || sessionId,
            numTurns: rm.num_turns,
            durationMs: (rm.duration_ms ?? (Date.now() - t0)) as number,
            toolCalls: toolCalls,
            is_error: !!rm.is_error,
            errors: rm.errors || (rm.is_error && rm.result ? [String(rm.result).slice(0, 300)] : [])
          };
          emit('run_end', { runId: runId, ok: out.ok, text: out.text, metrics: { totalMs: out.durationMs, toolCalls: out.toolCalls, turns: out.numTurns } });
          return out;
        }
      }
      /* 流结束但没有 result 消息（如被 abort） */
      if (ctl.signal.aborted) {
        emit('aborted', { runId: runId });
        return { ok: false, aborted: true, text: text, sessionId: sessionId, toolCalls: toolCalls, durationMs: Date.now() - t0 };
      }
      return { ok: !!text, text: text, sessionId: sessionId, toolCalls: toolCalls, durationMs: Date.now() - t0, errors: ['会话结束但未收到 result 消息'] };
    } catch (e) {
      if (ctl.signal.aborted) {
        emit('aborted', { runId: runId });
        return { ok: false, aborted: true, text: text, sessionId: sessionId, toolCalls: toolCalls, durationMs: Date.now() - t0 };
      }
      log('qoder run failed: ' + (e as Error).message);
      emit('error', { runId: runId, message: (e as Error).message, fatal: true });
      return { ok: false, error: (e as Error).message, text: text, sessionId: sessionId, toolCalls: toolCalls, durationMs: Date.now() - t0 };
    }
  }

  /* 连通性自检：1 回合最小查询（供连接器/设置页"测试"按钮） */
  async function ping(): Promise<{ ok: true; ms: number; reply: string } | { ok: false; ms: number; error: string }> {
    const sdk = await loadSdk();
    const t0 = Date.now();
    try {
      /* BYOK-only：诊断连通性也走用户自有 API Key 模型，不消耗平台订阅 */
      await byokModelsReady(8000);
      const byokModelId = resolveByokModelId({} as AgentDefRecord);
      if (!byokModelId) return { ok: false, ms: Date.now() - t0, error: '未检测到已注册的 API Key 模型（请在 Qoder 配置自带模型后重启）' };
      const dir = ctx.sandbox.ensureScope('global').work;
      const q = sdk.query({
        prompt: '请只回复两个字符：OK',
        options: {
          auth: sdk.accessToken(cfg.accessToken as string), cwd: dir,
          model: byokModelId, maxTurns: 1, permissionMode: 'dontAsk' as PermissionMode,
          settingSources: [], strictMcpConfig: true, tools: [], allowedTools: []
        }
      });
      let reply = '';
      for await (const m of q) {
        if (m.type === 'result') { reply = (m as SDKMessage & { result?: string }).result || ''; break; }
      }
      return { ok: true, ms: Date.now() - t0, reply: String(reply).slice(0, 40) };
    } catch (e) {
      return { ok: false, ms: Date.now() - t0, error: (e as Error).message };
    }
  }

  return {
    runWorkTurn: runWorkTurn,
    listSkills: listSkills,
    readSkill: readSkill,
    writeSkill: writeSkill,
    deleteSkill: deleteSkill,
    ensureSkillPlugin: ensureSkillPlugin,
    ping: ping,
    config: function () { return { model: cfg.model || '', permissionMode: cfg.permissionMode || 'default', hasToken: !!cfg.accessToken }; },
    SDK_BUILTIN_DEFAULT: SDK_BUILTIN_DEFAULT,
    /* 墨道子智能体注册表（诊断/展示用；七类不进 UI 切换器） */
    subagents: function () {
      return SUBAGENT_SPECS.map(function (s) {
        return { id: s.id, name: s.name, description: s.whenToUse, tools: s.sdkTools.concat(s.scienceTools), skills: s.skills, maxTurns: s.maxTurns };
      });
    },
    /* 领域插件（科研外挂）：清单 + 启用开关（未记录默认启用）+ 用户上传 */
    domainPlugins: listDomainPlugins,
    createPlugin: createPlugin,
    setDomainPluginEnabled: function (key: string, enabled: boolean) {
      return ctx.store.update('domainPlugins', function (cur) {
        const obj = Object.assign({}, (cur || {}) as Record<string, boolean>);
        obj[key] = !!enabled;
        return obj;
      }).then(function () { return listDomainPlugins(); });
    },
    /* 用户在 Qoder 注册的 BYOK 模型（启动异步缓存；未就绪返回 null） */
    byokModels: function () { return byokCache; },
    byokModelsReady: byokModelsReady,
    /* A4：审计记录读取（data/work-audit.jsonl 尾部 N 条） */
    readAudit: function (limit?: number) { return auditLog.read(limit || 100); }
  };
}

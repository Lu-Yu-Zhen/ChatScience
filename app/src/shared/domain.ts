/* ==================================================================
   shared/domain.ts · ChatScience 业务域公共类型
   这里是全项目共享的类型词汇表：Work 配置分区、各能力模块对外接口、
   沙箱执行结果、Agent 定义、SSE 事件负载等。
   接口形状与既有 JS 实现逐字段对齐（结构化类型，工厂函数返回值须可赋给对应接口），
   SDK 协议层类型统一从 shared/qoder-sdk 重导出，不在业务代码里散落 import。
   ================================================================== */
import type { ChildProcess } from 'child_process';
import type {
  McpServerConfig,
  PermissionMode,
} from './qoder-sdk';

/* ---------------- 沙箱策略 ---------------- */

export interface SandboxPolicy {
  timeoutMs: number;            /* 单次执行上限 */
  maxOutputBytes: number;       /* stdout / stderr 各自上限 */
  maxConcurrent: number;        /* 全局并发执行数 */
  maxFileSizeMb: number;        /* 单文件写入上限 */
  maxInlineImageBytes: number;  /* ≤该值的图片产物转 base64 内联回传 */
  network: 'open' | 'declared'; /* declared：声明式断网（非硬边界） */
  blockDangerPatterns: boolean;
  blockParentTraversal: boolean;
  blockNetworkImports: boolean;
  autoGcDays: number;
}
export type SandboxPolicyOverride = Partial<SandboxPolicy>;

/* ---------------- 运行时探测（proc） ---------------- */

export interface RuntimeProbe {
  command: string;
  exe: string;
  version?: string;
  raw?: string;
}
export interface RuntimeProbeError {
  key: string;
  tried: string;
  error: string;
}
export interface RuntimesResult {
  at: number;
  platform: string;
  arch: string;
  cpus: number;
  totalMemMb: number;
  runtimes: Record<string, RuntimeProbe>;
  errors: RuntimeProbeError[];
}

/* spawnGuarded 返回的子进程：附加原始命令信息，便于诊断 */
export interface GuardedChild extends ChildProcess {
  _csCmd: string;
  _csArgs: string[];
}

export interface KillInfo {
  killed: boolean;
  reason: string;
  detail?: string;
  error?: string;
}

/* ---------------- 沙箱执行引擎 ---------------- */

export interface ScopeDirs {
  root: string;
  work: string;
  out: string;
  hooks: string;
}

export interface SandboxFileEntry {
  relPath: string;
  size: number;
  mtimeMs: number;
  isImage: boolean;
}

export interface ExecCodeRequest {
  scopeId?: string;
  lang?: string;
  code?: string;
  cwd?: string | null;
  args?: string[];
  policyOverride?: SandboxPolicyOverride;
  /* kind ∈ stdout | stderr | note —— 运行页实时输出 */
  onEvent?: ((kind: string, delta: string) => void) | null;
}

export interface ArtifactFile {
  name: string;
  relPath: string;
  size: number;
  mime: string;
  isImage: boolean;
  dataUrl: string | null;
  scope: string;
  readError?: string;
}

export interface ExecResult {
  ok: boolean;
  exitCode: number | null;
  signal?: string | null;
  timedOut: boolean;
  killedInfo?: KillInfo | null;
  blocked: boolean;
  blockReason?: string;
  stdout: string;
  stdoutCapped?: boolean;
  stderr: string;
  stderrCapped?: boolean;
  durationMs: number;
  files: ArtifactFile[];
  /* 无 Job Object 无法测量，恒为 null——字段留位，不谎报数据 */
  usage: { peakRssKb: number | null };
  networkPolicy?: 'declared-only' | 'open';
  scope?: string;
  diagnostics?: { key: string; error: string }[];
  error?: string;
}

export interface InstallDepsRequest {
  scopeId?: string;
  manager?: string;
  packages?: string[];
}
export interface InstallDepsResult {
  ok: boolean;
  exitCode?: number | null;
  output?: string;
  error?: string;
}

export interface SandboxFileContent {
  relPath: string;
  size: number;
  mime: string;
  isImage: boolean;
  dataUrl: string | null;
  text: string | null;
}

export interface SandboxApi {
  execCode(req: ExecCodeRequest): Promise<ExecResult>;
  installDeps(req: InstallDepsRequest, onEvent?: (kind: string, delta: string) => void): Promise<InstallDepsResult>;
  listFiles(scopeId: string): SandboxFileEntry[];
  readFile(scopeId: string, rel: string, maxBytes?: number): SandboxFileContent;
  writeFile(scopeId: string, rel: string, content: string | Buffer): { relPath: string; size: number };
  deleteFile(scopeId: string, rel: string): { deleted: string };
  readScopeFile(scopeId: string, rel: string): { buffer: Buffer; mime: string; name: string };
  resetWorkspace(scopeId: string): { reset: string };
  gcSandboxes(maxAgeMs?: number): { removed: string[]; pending?: number };
  setPolicy(next: SandboxPolicyOverride): SandboxPolicy;
  getPolicy(): SandboxPolicy;
  detectRuntimes(force?: boolean): RuntimesResult;
  ensureScope(scopeId: string): ScopeDirs;
  stop(): void;
  policy(): SandboxPolicy;
}

/* ---------------- 实验笔记 ---------------- */

export interface NoteCell {
  id: string;
  type: 'markdown' | 'code';
  source: string;
}

export interface NoteRecord {
  id: string;
  title: string;
  content: string;
  source?: string;
  convId?: string | null;
  /* Jupyter 归属：proj:<id> / conv:<id> / null 独立 */
  scopeKey?: string | null;
  cells?: NoteCell[] | null;
  createdAt?: number;
  updatedAt?: number;
}
export type NoteUpsertInput = Partial<NoteRecord>;

export interface NotesApi {
  list(): NoteRecord[];
  get(id: string): NoteRecord | null;
  upsert(note: NoteUpsertInput): NoteRecord;
  remove(id: string): { deleted: string; error?: string };
  dir: string;
}

/* ---------------- 知识库（BM25 词法检索） ---------------- */

export interface KbIndexRequest {
  kbId: string;
  fileName: string;
  text: string;
}
export interface KbIndexResult {
  kbId: string;
  fileName: string;
  chunks: number;
  chars: number;
}
export interface KbStatus {
  totalFiles: number;
  kbs: Record<string, { files: number; chunks: number }>;
}
export interface KbSearchRequest {
  query: string;
  kbId?: string;
  topK?: number;
}
export interface KbSearchHit {
  kbId: string;
  file: string;
  chunkIdx: number;
  score: number;
  text: string;
}
export interface KbSearchResult {
  error?: string;
  hint?: string;
  query?: string;
  kind?: string;
  indexedFiles?: number;
  count?: number;
  results?: KbSearchHit[];
  note?: string;
}

export interface KbApi {
  indexFile(req: KbIndexRequest): KbIndexResult;
  removeFile(kbId: string, fileName: string): { removed: string };
  status(): KbStatus;
  search(req: KbSearchRequest): KbSearchResult;
  dir: string;
}

/* ---------------- 科研检索工具（research） ---------------- */

export interface ArxivPaper {
  arxivId: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  updated: string;
  categories: string[];
  pdf: string;
  absUrl: string;
}
export interface ArxivSearchResult {
  error?: string;
  query?: string;
  count?: number;
  papers?: ArxivPaper[];
  note?: string;
}
export interface FetchUrlResult {
  error?: string;
  url?: string;
  status?: number;
  contentType?: string;
  chars?: number;
  text?: string;
  truncated?: boolean;
}
export interface WebSearchHit {
  title: string;
  url: string;
  snippet: string;
}
export interface WebSearchResult {
  error?: string;
  query?: string;
  count?: number;
  results?: WebSearchHit[];
  note?: string;
}

export interface ResearchApi {
  arxivSearch(args: { query: string; maxResults?: number }): Promise<ArxivSearchResult>;
  fetchUrl(args: { url: string; maxChars?: number }): Promise<FetchUrlResult>;
  webSearch(args: { query: string }): Promise<WebSearchResult>;
  stripHtml(html: string): string;
}

/* ---------------- AI 流式代理（Chat 链路，OpenAI 兼容） ---------------- */

export interface ChatMessageInput {
  role: string;
  content: unknown;
}

export interface ChatStreamOptions {
  providerId?: string;
  model: string;
  apiKey: string;
  messages: ChatMessageInput[];
  temperature?: unknown;
  web?: boolean;
}

/* applyThinking / applyWebSearch 会向上游请求体注入的厂商差异字段 */
export interface ChatRequestFields {
  thinking?: { type: string };
  enable_thinking?: boolean;
  reasoning?: { effort: string };
  enable_search?: boolean;
  tools?: unknown[];
}
export type UpstreamChatBody = ChatRequestFields & {
  model: string;
  messages: ChatMessageInput[];
  stream?: boolean;
  temperature?: number;
};

export type ChatStreamEvent = { type: 'reasoning' | 'content'; text: string };

/* server/config.json（AI 密钥仅存后端） */
export interface AiConfigFile {
  providerId?: string;
  model?: string;
  apiKey?: string;
  note?: string;
}

/* ---------------- Work 配置分区（data/work.json） ---------------- */

export interface AgentToolsSpec {
  /* SDK 内建工具白名单；未设置 = 默认全集，[] = 显式不给任何内建工具 */
  sdk?: string[];
  /* in-process 科研工具开关，['science'] */
  builtin?: string[];
  /* 科研工具子集 */
  scienceTools?: string[];
  /* 外部 MCP 服务器白名单 */
  mcp?: Record<string, unknown>;
}

export interface AgentDefRecord {
  id: string;
  name: string;
  role?: string;
  builtin?: boolean;
  description?: string;
  systemPrompt?: string;
  model?: string;
  thinkingStrength?: string;
  permissionMode?: string;
  maxTurns?: number | string;
  tools?: AgentToolsSpec;
  skills?: string[];
  sandbox?: { scope?: string };
  /* 用户经 UI 编辑产生的其他字段原样透传 */
  [k: string]: unknown;
}

export interface McpServerEntry {
  key: string;
  name?: string;
  type?: string;
  enabled?: boolean;
  /* 结构对齐 SDK McpServerConfig，直接透传 */
  config: McpServerConfig;
  tools?: (string | { name: string })[];
  [k: string]: unknown;
}

export interface SkillState {
  enabled?: boolean;
  order?: number;
}

/* 运行页历史由前端写入，结构宽松 */
export interface RunHistoryItem {
  [k: string]: unknown;
}

export interface WorkState {
  version: number;
  agents: AgentDefRecord[];
  skills: Record<string, SkillState>;
  mcpServers: McpServerEntry[];
  sandboxPolicy: SandboxPolicyOverride;
  modelToolSupport: Record<string, string>;
  runHistory: RunHistoryItem[];
  seeded: boolean;
}
export type WorkSectionName = keyof WorkState;

/* 分区串行化读改写（见 store.ts 注释） */
export interface StoreApi {
  file: string;
  all(): WorkState;
  section<K extends WorkSectionName>(name: K): WorkState[K];
  setSection<K extends WorkSectionName>(name: K, value: WorkState[K]): Promise<boolean>;
  /* fn 返回新值则整分区替换；原地修改后返回 undefined 视为已变更 */
  update<K extends WorkSectionName>(name: K, fn: (cur: WorkState[K]) => WorkState[K] | undefined | void): Promise<boolean>;
  mutate(fn: (state: WorkState) => boolean | undefined | void): Promise<boolean>;
  reload(): WorkState;
}

/* ---------------- Qoder Agent SDK 封装（qoder.ts） ---------------- */

export interface WorkTurnParams {
  agentDef?: AgentDefRecord | null;
  prompt: string;
  resumeSessionId?: string | null;
  convId?: string | null;
  scopeId?: string;
  /* 工作区模式：绝对路径且真实存在时，SDK cwd 与 run_code cwd 都指向它 */
  workspaceRoot?: string | null;
  permissionMode?: string | null;
  signal?: AbortSignal;
}

export interface WorkTurnResult {
  ok: boolean;
  text: string;
  sessionId?: string | null;
  numTurns?: number;
  durationMs: number;
  toolCalls?: number;
  is_error?: boolean;
  errors?: string[];
  aborted?: boolean;
  error?: string;
}

/* runWorkTurn 桥接到前端 SSE 的事件负载 */
export interface WorkRunEventMap {
  run_start: { runId: string; agentId?: string; model?: string; permissionMode?: string; tools: string[] };
  notice: { runId: string; code: string; message: string; skills?: string[]; mcpServers?: { name: string; status: string }[] };
  delta: { runId: string; delta: string };
  reasoning: { runId: string; delta: string };
  tool_start: { runId: string; callId: string; name: string; args: string };
  tool_end: { runId: string; callId: string; ok: boolean; durationMs?: number; result: string; error?: string };
  tool_stream: { kind: string; delta: string };
  error: { runId: string; message: string; fatal?: boolean };
  run_end: { runId: string; ok: boolean; text?: string; metrics?: { totalMs?: number; toolCalls?: number; turns?: number } };
  aborted: { runId: string };
}
export type WorkRunEventName = keyof WorkRunEventMap;
export type WorkRunEventData = WorkRunEventMap[WorkRunEventName];
export type WorkRunEventHandler = (evt: WorkRunEventName, data: WorkRunEventData) => void;

export interface SkillInfo {
  slug: string;
  name: string;
  description: string;
  builtin: boolean;
  chars: number;
  updatedAt: number;
}

export interface QoderConfigFile {
  accessToken?: string;
  model?: string;
  permissionMode?: string;
}

export interface QoderApi {
  runWorkTurn(params: WorkTurnParams, onEvent?: WorkRunEventHandler, externalSignal?: AbortSignal): Promise<WorkTurnResult>;
  listSkills(): SkillInfo[];
  readSkill(slug: string): { slug: string; markdown: string } | null;
  writeSkill(slug: string, frontmatter: Record<string, string>, body: string): { slug: string };
  deleteSkill(slug: string): { deleted: string };
  ensureSkillPlugin(): string | null;
  ping(): Promise<{ ok: true; ms: number; reply: string } | { ok: false; ms: number; error: string }>;
  config(): { model: string; permissionMode: string; hasToken: boolean };
  MODEL_TIERS: readonly string[];
  SDK_BUILTIN_DEFAULT: readonly string[];
}

/* ---------------- 服务端装配上下文（index.ts → routes/qoder） ---------------- */

export interface WorkCtx {
  appRoot: string;
  token: string;
  log: (line: string) => void;
  store: StoreApi;
  sandbox: SandboxApi;
  notes: NotesApi;
  kb: KbApi;
  qoder: QoderApi;
}
/* createQoder 在 ctx.qoder 赋值前调用，收到的是不含自身的依赖 */
export type QoderDeps = Omit<WorkCtx, 'qoder'>;

/* buildScienceServer 的 in-process 科研工具上下文 */
export interface ScienceToolCtx {
  sandbox: SandboxApi;
  notes: NotesApi;
  kb: KbApi | null;
  scopeId: string;
  workspaceRoot: string | null;
  convId: string | null;
  onToolStream?: ((kind: string, delta: string) => void) | null;
}

/* ---------------- preload 桥（渲染进程 window.csDesktop） ---------------- */

export interface CsDesktopBridge {
  version: string;
  platform: string;
  token: string;
  port: string;
  base: string;
  getStateSync(): string | null;
  saveState(json: string): boolean;
  notify(title: string, body: string): void;
  log(line: string): void;
  onTopmostChanged(cb: (v: boolean) => void): void;
  onLeftPanelToggle(cb: () => void): void;
  onMaxChanged(cb: (v: boolean) => void): void;
  winMinimize(): void;
  winMaximizeToggle(): void;
  winClose(): void;
  selectDirectory(): Promise<string | null | { error: string }>;
}

/* ---------------- SDK 五档权限模式的运行时收窄 ---------------- */

const PERMISSION_MODE_VALUES = ['default', 'acceptEdits', 'auto', 'plan', 'dontAsk'] as const;

export function asPermissionMode(v: string | undefined | null, fallback: PermissionMode = 'default'): PermissionMode {
  return (PERMISSION_MODE_VALUES as readonly string[]).indexOf(v || '') > -1 ? (v as PermissionMode) : fallback;
}


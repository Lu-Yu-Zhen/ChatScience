/* ==================================================================
   audit.ts · 工具调用审计日志（04 策划案 A4 / B6）
   - 每次工具调用（PreToolUse → PostToolUse/PostToolUseFailure）落一条
     JSONL 记录到 data/work-audit.jsonl：时间、工具全名、参数摘要、
     结果状态、耗时、发起方（主会话或子智能体 agentID）、权限判定依据。
   - L3 纪律：审计记录禁止包含任何凭据（PAT/token 原文），参数摘要截断。
   - 写入失败不阻断会话（审计是旁路，不是闸门——闸门在 canUseTool）。
   ================================================================== */
import * as fs from 'fs';
import * as path from 'path';

export interface AuditEntry {
  ts: string;
  event: 'tool_start' | 'tool_end' | 'tool_error' | 'permission_denied' | 'subagent' | 'model_policy' | 'memory_decision';
  tool?: string;
  toolUseId?: string;
  callId?: string;
  agentId?: string | null;          /* 子智能体发起时为运行时 agentID；主会话为 null */
  parentToolUseId?: string | null;  /* 子智能体消息指向的父子 Agent 工具调用 ID */
  argsSummary?: string;
  resultStatus?: 'ok' | 'error' | 'denied';
  durationMs?: number;
  detail?: string;
}

const MAX_ARGS_SUMMARY = 240;
const MAX_DETAIL = 600;

export function auditArgsSummary(input: unknown): string {
  let s: string;
  try { s = JSON.stringify(input); } catch (e) { s = String(input); }
  s = String(s || '');
  return s.length > MAX_ARGS_SUMMARY ? s.slice(0, MAX_ARGS_SUMMARY) + '…' : s;
}

export function auditDetail(detail: unknown): string {
  const s = String(detail || '');
  return s.length > MAX_DETAIL ? s.slice(0, MAX_DETAIL) + '…' : s;
}

export class AuditLog {
  private file: string;

  constructor(appRoot: string) {
    this.file = path.join(appRoot, 'data', 'work-audit.jsonl');
  }

  append(entry: AuditEntry): void {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.appendFileSync(this.file, JSON.stringify(entry) + '\n', 'utf8');
    } catch (e) { /* 审计旁路：写失败不影响会话 */ }
  }

  read(limit: number): Array<Record<string, unknown>> {
    try {
      if (!fs.existsSync(this.file)) return [];
      const lines = fs.readFileSync(this.file, 'utf8').split('\n').filter(Boolean);
      return lines.slice(-Math.max(1, Math.min(limit, 1000))).map(function (line) {
        try { return JSON.parse(line) as Record<string, unknown>; }
        catch (e) { return { ts: '', event: 'corrupt', detail: line.slice(0, 120) }; }
      });
    } catch (e) { return []; }
  }
}

/* 单测与验证用：把一条已完成的调用序列汇总成审计断言视角 */
export function summarizeAudit(entries: Array<Record<string, unknown>>): { total: number; byEvent: Record<string, number>; denied: number } {
  const byEvent: Record<string, number> = {};
  let denied = 0;
  entries.forEach(function (e) {
    const ev = String(e.event || 'unknown');
    byEvent[ev] = (byEvent[ev] || 0) + 1;
    if (ev === 'permission_denied' || e.resultStatus === 'denied') denied++;
  });
  return { total: entries.length, byEvent: byEvent, denied: denied };
}

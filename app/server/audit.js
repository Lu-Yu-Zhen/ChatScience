"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
exports.auditArgsSummary = auditArgsSummary;
exports.auditDetail = auditDetail;
exports.summarizeAudit = summarizeAudit;
/* ==================================================================
   audit.ts · 工具调用审计日志（04 策划案 A4 / B6）
   - 每次工具调用（PreToolUse → PostToolUse/PostToolUseFailure）落一条
     JSONL 记录到 data/work-audit.jsonl：时间、工具全名、参数摘要、
     结果状态、耗时、发起方（主会话或子智能体 agentID）、权限判定依据。
   - L3 纪律：审计记录禁止包含任何凭据（PAT/token 原文），参数摘要截断。
   - 写入失败不阻断会话（审计是旁路，不是闸门——闸门在 canUseTool）。
   ================================================================== */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const MAX_ARGS_SUMMARY = 240;
const MAX_DETAIL = 600;
function auditArgsSummary(input) {
    let s;
    try {
        s = JSON.stringify(input);
    }
    catch (e) {
        s = String(input);
    }
    s = String(s || '');
    return s.length > MAX_ARGS_SUMMARY ? s.slice(0, MAX_ARGS_SUMMARY) + '…' : s;
}
function auditDetail(detail) {
    const s = String(detail || '');
    return s.length > MAX_DETAIL ? s.slice(0, MAX_DETAIL) + '…' : s;
}
class AuditLog {
    file;
    constructor(appRoot) {
        this.file = path.join(appRoot, 'data', 'work-audit.jsonl');
    }
    append(entry) {
        try {
            fs.mkdirSync(path.dirname(this.file), { recursive: true });
            fs.appendFileSync(this.file, JSON.stringify(entry) + '\n', 'utf8');
        }
        catch (e) { /* 审计旁路：写失败不影响会话 */ }
    }
    read(limit) {
        try {
            if (!fs.existsSync(this.file))
                return [];
            const lines = fs.readFileSync(this.file, 'utf8').split('\n').filter(Boolean);
            return lines.slice(-Math.max(1, Math.min(limit, 1000))).map(function (line) {
                try {
                    return JSON.parse(line);
                }
                catch (e) {
                    return { ts: '', event: 'corrupt', detail: line.slice(0, 120) };
                }
            });
        }
        catch (e) {
            return [];
        }
    }
}
exports.AuditLog = AuditLog;
/* 单测与验证用：把一条已完成的调用序列汇总成审计断言视角 */
function summarizeAudit(entries) {
    const byEvent = {};
    let denied = 0;
    entries.forEach(function (e) {
        const ev = String(e.event || 'unknown');
        byEvent[ev] = (byEvent[ev] || 0) + 1;
        if (ev === 'permission_denied' || e.resultStatus === 'denied')
            denied++;
    });
    return { total: entries.length, byEvent: byEvent, denied: denied };
}

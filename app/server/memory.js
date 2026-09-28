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
exports.createMemory = createMemory;
/* ==================================================================
   memory.ts · Work 项目记忆（项目记忆文件夹 + 任务记忆文档 + Stop 决策 hook）
   - 目录：data/projects/<projectId>/memory/
       README.md            项目记忆索引（项目信息 / 任务清单 / 项目要点）
       tasks/<taskId>.md    任务记忆文档（每轮对话结束后由模型自主追加）
   - 触发机制（hooks）：SDK Stop 事件在主 Agent 一轮对话结束时触发「记忆更新
     决策」——hook 返回 decision:'block' + reason，把决策指令喂回模型；由模型
     自主判断本轮是否值得写入记忆，不是每轮都更新。stop_hook_active / 单回合
     双保险保证不会循环阻断。
   - 写入口径：模型只能写记忆目录内的文件（canUseTool 的额外可写根），
     不会碰用户工作区与沙箱的其它产物。
   ================================================================== */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const audit_1 = require("./audit");
/* 单条注入提示的任务记忆 / 项目索引截断上限（控制 token 开销） */
const TASK_MEM_CAP = 4000;
const PROJECT_MEM_CAP = 2000;
/* ID 安全化：projectId/taskId 来自前端快照，用作路径段前必须防目录穿越 */
function safeId(raw) {
    const s = String(raw == null ? '' : raw).trim();
    const cleaned = s.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80);
    return cleaned || 'unknown';
}
function tail(text, cap) {
    return text.length > cap ? '…（已截断，仅保留最近 ' + cap + ' 字符）\n' + text.slice(-cap) : text;
}
function nowIso() {
    return new Date().toISOString();
}
function today() {
    return nowIso().slice(0, 10);
}
function createMemory(appRoot, log) {
    /* 绝对化：appRoot 若为相对路径，记忆目录会随进程 cwd 漂移（CLI 按会话 cwd
       解析模型写入时会落错位置）——入口处一次解析，全局只认绝对路径 */
    const root = path.join(path.resolve(appRoot), 'data', 'projects');
    function projectDir(projectId) {
        return path.join(root, safeId(projectId), 'memory');
    }
    function taskPath(projectId, taskId) {
        return path.join(projectDir(projectId), 'tasks', safeId(taskId) + '.md');
    }
    function ensureDir(dir) {
        fs.mkdirSync(path.join(dir, 'tasks'), { recursive: true });
    }
    function ensureProject(projectId, name) {
        const dir = projectDir(projectId);
        ensureDir(dir);
        const readme = path.join(dir, 'README.md');
        let created = false;
        if (!fs.existsSync(readme)) {
            const pname = String(name || '').trim() || safeId(projectId);
            fs.writeFileSync(readme, [
                '# 项目记忆：' + pname,
                '',
                '- 项目 ID：`' + safeId(projectId) + '`',
                '- 创建时间：' + nowIso(),
                '- 记忆目录：`' + dir + '`',
                '',
                '## 任务清单',
                '（本项目的任务记忆文档，随任务创建自动登记）',
                '',
                '## 项目要点',
                '（跨任务的长期结论与决策，由 Agent 在各任务记忆中自主提炼后写入）',
                ''
            ].join('\n'), 'utf8');
            created = true;
            if (log)
                log('memory: project folder created ' + dir);
        }
        return { dir: dir, readme: readme, created: created };
    }
    function ensureTask(projectId, taskId, title, projectName) {
        const dir = ensureProject(projectId, projectName || '').dir;
        const file = taskPath(projectId, taskId);
        if (!fs.existsSync(file)) {
            const t = String(title || '').trim() || '未命名任务';
            fs.writeFileSync(file, [
                '# 任务记忆：' + t,
                '',
                '- 任务 ID：`' + safeId(taskId) + '`',
                '- 创建时间：' + nowIso(),
                '',
                '## 记忆条目',
                '（每轮对话结束后由 Agent 自主决策是否追加；格式：`### 日期` + 要点）',
                ''
            ].join('\n'), 'utf8');
            /* 任务登记进项目索引（幂等） */
            try {
                const readme = path.join(dir, 'README.md');
                const cur = fs.existsSync(readme) ? fs.readFileSync(readme, 'utf8') : '';
                const marker = '`' + safeId(taskId) + '`';
                if (cur.indexOf(marker) === -1) {
                    const line = '- [`' + safeId(taskId) + '`](tasks/' + safeId(taskId) + '.md) ' + t + '（创建于 ' + today() + '）';
                    const anchor = '（本项目的任务记忆文档，随任务创建自动登记）';
                    const next = cur.indexOf(anchor) > -1
                        ? cur.replace(anchor, anchor + '\n' + line)
                        : cur.replace(/\n## 项目要点/, '\n' + line + '\n\n## 项目要点');
                    fs.writeFileSync(readme, next, 'utf8');
                }
            }
            catch (e) { /* 索引登记失败不影响任务记忆本身 */ }
            if (log)
                log('memory: task doc created ' + file);
            return { file: file, created: true };
        }
        return { file: file, created: false };
    }
    function syncTaskTitle(projectId, taskId, title) {
        const file = taskPath(projectId, taskId);
        const t = String(title || '').trim();
        if (!t || !fs.existsSync(file))
            return false;
        try {
            const cur = fs.readFileSync(file, 'utf8');
            const m = /^#\s*任务记忆：(.*)$/m.exec(cur);
            if (!m || m[1].trim() === t)
                return false;
            fs.writeFileSync(file, cur.replace(/^#\s*任务记忆：.*$/m, '# 任务记忆：' + t), 'utf8');
            return true;
        }
        catch (e) {
            return false;
        }
    }
    function readTask(projectId, taskId) {
        const file = taskPath(projectId, taskId);
        try {
            return { exists: true, content: fs.readFileSync(file, 'utf8'), path: file };
        }
        catch (e) {
            return { exists: false, content: '', path: file };
        }
    }
    function readProject(projectId) {
        const dir = projectDir(projectId);
        const readme = path.join(dir, 'README.md');
        let content = '';
        try {
            content = fs.readFileSync(readme, 'utf8');
        }
        catch (e) { /* 不存在 */ }
        let tasks = [];
        try {
            tasks = fs.readdirSync(path.join(dir, 'tasks'))
                .filter(function (f) { return /\.md$/.test(f); })
                .map(function (f) { return f.replace(/\.md$/, ''); });
        }
        catch (e) { /* 目录不存在 */ }
        return { exists: !!content, content: content, path: readme, tasks: tasks };
    }
    function ensureContext(projectId, projectName, taskId, taskTitle) {
        ensureProject(projectId, projectName);
        let taskFile = null;
        let safeTask = null;
        if (taskId) {
            safeTask = safeId(taskId);
            ensureTask(projectId, taskId, taskTitle || '', projectName);
            if (taskTitle)
                syncTaskTitle(projectId, taskId, taskTitle);
            taskFile = taskPath(projectId, taskId);
        }
        return {
            projectId: safeId(projectId),
            projectName: String(projectName || '').trim() || safeId(projectId),
            dir: projectDir(projectId),
            readme: path.join(projectDir(projectId), 'README.md'),
            taskFile: taskFile,
            taskId: safeTask
        };
    }
    /* 系统提示词注入段：机制说明 + 当前记忆内容（截断）。
       每轮 query 都会重建系统提示词，resume 会话也能拿到最新记忆。 */
    function buildPromptSection(ctx) {
        const lines = [
            '# 项目记忆（自动机制）',
            '- 项目记忆目录：`' + ctx.dir + '`（本目录及 tasks/ 子目录是你可以写入的记忆专区）',
            ctx.taskFile ? '- 本任务记忆文件：`' + ctx.taskFile + '`' : '- 本任务尚未创建记忆文档',
            '- 机制：每轮对话结束后，系统会触发一次「记忆更新决策」——由你判断本轮是否产生值得长期记住的信息，值得才写入，不值得则不动。不是每轮都必须更新。',
            '- 值得记：关键决策与依据、重要结果/数据/结论、用户明确的偏好或反馈、错误与教训、稳定事实（路径/配置/版本/种子）。',
            '- 不值得记：寒暄与过程性叙述、一次性且无复用价值的细节、能随时从文件重新获得的信息。',
            '- 写入规范：只用 Edit/Write 修改 `' + ctx.dir + '` 内的文件；任务记忆在「## 记忆条目」下追加「### ' + today() + '」小节，每条一行、不超过 50 字；跨任务的长期结论写入 README.md 的「## 项目要点」。'
        ];
        const task = ctx.taskFile ? readTask(ctx.projectId, ctx.taskId || '') : null;
        if (task && task.exists && task.content.trim()) {
            lines.push('- 当前任务记忆内容（最近 ' + TASK_MEM_CAP + ' 字符）：\n' + tail(task.content, TASK_MEM_CAP));
        }
        else {
            lines.push('- 当前任务记忆内容：（空，尚未写入）');
        }
        const proj = readProject(ctx.projectId);
        if (proj.exists && proj.content.trim()) {
            lines.push('- 项目记忆索引（最近 ' + PROJECT_MEM_CAP + ' 字符）：\n' + tail(proj.content, PROJECT_MEM_CAP));
        }
        return lines.join('\n');
    }
    /* ---------------- Stop 事件：记忆更新决策 hook ----------------
       主 Agent 一轮对话结束（Stop）时必触发（决策 hook 每轮都响）；
       首次触发返回 block + 决策指令，模型自主决定是否写记忆后再次 Stop，
       此时 stop_hook_active 为真（或本回合已阻断过一次）→ 放行。
       hook 自身异常时放行，绝不让记忆机制卡死会话。 */
    function makeStopHook(ctx, audit, emit) {
        let blockedOnce = false;
        const hook = async function (input) {
            try {
                if (input.hook_event_name !== 'Stop')
                    return {};
                const stopInput = input;
                if (stopInput.stop_hook_active || blockedOnce)
                    return {};
                blockedOnce = true;
                audit.append({
                    ts: nowIso(), event: 'memory_decision', tool: 'memory',
                    resultStatus: 'ok', detail: (0, audit_1.auditDetail)('triggered project=' + ctx.projectId + ' task=' + (ctx.taskId || '-'))
                });
                emit('notice', {
                    code: 'memory_decision',
                    message: '本轮结束：已触发记忆更新决策（由模型自主决定是否写入项目记忆）'
                });
                const reason = [
                    '【记忆更新决策】本轮任务对话已结束。请判断本轮是否产生了值得长期记忆的信息：',
                    '- 值得记：关键决策与依据、重要结果/数据/结论、用户明确的偏好或反馈、错误与教训、稳定事实（路径/配置/版本）。',
                    '- 不值得记：寒暄与过程性叙述、一次性无复用价值的细节、能随时从文件重新获得的信息。',
                    ctx.taskFile
                        ? '若值得记：用 Edit 或 Write 更新任务记忆文件 `' + ctx.taskFile + '`——在「## 记忆条目」下追加「### ' + today() + '」小节，每条一行、不超过 50 字；跨任务的长期结论可另写入 `' + ctx.readme + '` 的「## 项目要点」。'
                        : '若值得记：用 Write 在 `' + path.join(ctx.dir, 'tasks') + '` 下创建本任务的记忆文档并在「## 记忆条目」追加要点。',
                    '若不值得记：直接简短回复「无需更新记忆」即可，不要编造内容。',
                    '约束：只允许写 `' + ctx.dir + '` 目录内的文件。'
                ].join('\n');
                return { decision: 'block', reason: reason };
            }
            catch (e) {
                return {}; /* hook 异常不阻断会话 */
            }
        };
        return { Stop: [{ hooks: [hook] }] };
    }
    return {
        projectDir: projectDir,
        taskPath: taskPath,
        ensureProject: ensureProject,
        ensureTask: ensureTask,
        syncTaskTitle: syncTaskTitle,
        readTask: readTask,
        readProject: readProject,
        ensureContext: ensureContext,
        buildPromptSection: buildPromptSection,
        makeStopHook: makeStopHook
    };
}

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
/* ==================================================================
   verify-suite.ts · app/verify 脚本统一入口（可枚举 / 单跑 / 全量）
   编译：tsc -p tsconfig.verify.json → app/verify/verify-suite.js
   用法（在 app/ 目录执行；仓库根等价于 node app/verify/verify-suite.js）：
     node verify/verify-suite.js              列出全部脚本（按层 + 手写/编译判定）
     node verify/verify-suite.js <name> [args…]  运行单个脚本，原样透传其退出码
     node verify/verify-suite.js --all [--timeout 秒]  全量运行（按层顺序，末尾汇总）
   不引入测试框架、不新增 CI：每个脚本仍是独立 node 进程，命令形式复用
   node verify/<name>.js，本入口只做发现与编排。

   手写/编译判定（运行时按文件系统判定，不硬编码名单）：
     app/src/verify/<name>.ts 存在 → 该 .js 由 TS 编译而来，受 typecheck 与
       build:ts 管辖，改它会被下次构建覆盖；
     不存在 → 手写 JS（当前 14 个，清单见根 AGENTS.md），不在 tsc 管辖内。
   本入口只做标识：不移动文件、不删除脚本。

   分层说明：沙箱 / SDK / 技能 / UI 之外，chat-verify、stream-verify、
   noweb-test 三个 Chat 模式 /api/chat 管线脚本不属于上述任何一层，单列
   「Chat 管线」层，避免错分进 SDK 或 UI。
   ================================================================== */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const VERIFY_DIR = __dirname;
const APP_ROOT = path.join(VERIFY_DIR, '..');
const SRC_DIR = path.join(APP_ROOT, 'src', 'verify');
const ENTRY_NAME = 'verify-suite';
const DEFAULT_TIMEOUT_SEC = 300;
const LAYER_ORDER = ['沙箱', 'SDK', '技能', 'UI', 'Chat 管线'];
/* 分层登记表：新脚本若未登记，列表模式会归入「未分层」显式提示，不会静默丢失 */
const SCRIPTS = [
    { layer: '沙箱', name: 'sandbox-verify', desc: '沙箱引擎 18 项：超时强杀/路径守卫/声明式断网/并发信号量' },
    { layer: 'SDK', name: 'sdk-smoke', desc: 'SDK 冒烟：真实 query() 验证 PAT/运行时/流式事件' },
    { layer: 'SDK', name: 'sdk-verify', desc: 'SDK 链路 12 项：工具隔离/科研工具注入/真实回合/resume 回忆' },
    { layer: 'SDK', name: 'agent-verify', desc: '端到端科研任务：run_code→note_write→汇报 + arxiv 检索' },
    { layer: 'SDK', name: 'agent-system-verify', desc: 'Agent 系统 11 项：隔离回归/主智能体/子智能体委派/审计落盘' },
    { layer: 'SDK', name: 'workspace-verify', desc: '工作区模式 5 项：cwd 切换/越界写拦截/用户文件不动' },
    { layer: 'SDK', name: 'memory-verify', desc: '项目记忆 23 项：Stop 决策 hook/任务 md/HTTP 面' },
    { layer: 'SDK', name: 'kb-verify', desc: '知识库 7 项：BM25 排序/Agent 会话内 kb_search 命中' },
    { layer: 'SDK', name: 'ts-migration-smoke', desc: '服务端 API 面冒烟：health/鉴权/bootstrap/skills/沙箱 exec（脚本自起服务）' },
    { layer: 'SDK', name: 'userdata-check', desc: 'server/userdata 单元验证：~/.qoder-cn 记忆扫描 + 安全边界' },
    { layer: 'SDK', name: 'agent-run-diag', desc: '手动复现 Agent 回合失败：起 exe→读 runtime.json→POST agent/run' },
    { layer: 'SDK', name: 'byok-bisect', desc: '二分实验：定位触发 credits 拒绝的 runWorkTurn 附加选项' },
    { layer: 'SDK', name: 'byok-diag', desc: '诊断：BYOK 组合验证 + 当前配置清单' },
    { layer: 'SDK', name: 'byok-experiment', desc: '实验：push 模式直接使用已注册 BYOK 模型 id', usage: '[byokModelId]' },
    { layer: 'SDK', name: 'byok-run-check', desc: '一次性验证：回合 BYOK-only 路由（run_start.model 应为 BYOK 模型 id）' },
    { layer: '技能', name: 'skills-verify', desc: '技能系统 10 项：12 内建技能/自定义技能/启用白名单端到端' },
    { layer: '技能', name: 'plugin-experiment', desc: '诊断：插件结构校验 + 会话内插件清单 + MCP 状态' },
    { layer: 'UI', name: 'exe-verify', desc: '打包版 exe 端到端：HTTP API/CDP UI/重启恢复/沙箱 Agent（需先 node pack.js）' },
    { layer: 'UI', name: 'anim-coord-check', desc: '动画协调性（真实 exe CDP）：侧栏平移/输入框下滑/消息上滑' },
    { layer: 'UI', name: 'cdp-eval', desc: '通用 CDP evaluate 工具', usage: '"<js 表达式>" [--file script.js]' },
    { layer: 'UI', name: 'input-edge-check', desc: '标题栏压缩 + 输入框渐变边框主题适配（真实 exe CDP）' },
    { layer: 'UI', name: 'layout-center-check', desc: '主页面布局：标题栏收窄/初始态居中/发送后输入框下滑' },
    { layer: 'UI', name: 'layout-refine-check', desc: '布局微调：整体上移/分隔线移除/模式切换动画' },
    { layer: 'UI', name: 'settings-e2e', desc: '设置页 CDP 实测：五面板逐节打开 + 真实数据渲染' },
    { layer: 'UI', name: 'settings-geometry', desc: '截真实 exe 设置页（最大化窗口）并打印关键几何数据' },
    { layer: 'Chat 管线', name: 'chat-verify', desc: 'Chat API 10 轮：全文注入/关键词校验/中断恢复' },
    { layer: 'Chat 管线', name: 'stream-verify', desc: 'SSE 分块时序：chunk 到达时刻与累计长度' },
    { layer: 'Chat 管线', name: 'noweb-test', desc: '对照测试：web=false 的 TTFT', usage: '[port] [token]' },
];
function metaFor(name) {
    const found = SCRIPTS.find((item) => item.name === name);
    if (found) {
        return { layer: found.layer, desc: found.desc, ...(found.usage ? { usage: found.usage } : {}) };
    }
    return { layer: '未分层', desc: '（未登记：请在上方 SCRIPTS 补层与说明）' };
}
function originOf(name) {
    return fs.existsSync(path.join(SRC_DIR, `${name}.ts`)) ? 'compiled' : 'handwritten';
}
function listScriptNames() {
    return fs.readdirSync(VERIFY_DIR)
        .filter((file) => file.endsWith('.js'))
        .map((file) => file.slice(0, -3))
        .filter((name) => name !== ENTRY_NAME)
        .sort();
}
function entries() {
    return listScriptNames().map((name) => ({ name, origin: originOf(name), ...metaFor(name) }));
}
function originTag(origin) {
    return origin === 'compiled' ? '[编译]' : '[手写]';
}
function printList() {
    const all = entries();
    const handwritten = all.filter((item) => item.origin === 'handwritten').length;
    console.log(`app/verify 验证脚本 · ${all.length} 个（入口 verify-suite.js 自身不参与运行）`);
    console.log('判定：[编译]=app/src/verify/<name>.ts 经 build:ts 产出，受 typecheck 管辖；'
        + `[手写]=无 TS 镜像的手写 JS，不在 tsc 管辖内（当前 ${handwritten} 个，清单见根 AGENTS.md）`);
    const unlayered = all.filter((item) => item.layer === '未分层');
    for (const layer of LAYER_ORDER) {
        const group = all.filter((item) => item.layer === layer);
        if (group.length === 0)
            continue;
        console.log(`\n${layer} · ${group.length}`);
        for (const item of group) {
            const usage = item.usage ? `  用法：node verify/${item.name}.js ${item.usage}` : '';
            console.log(`  ${(item.name + '.js').padEnd(26)} ${originTag(item.origin)}  ${item.desc}${usage}`);
        }
    }
    if (unlayered.length > 0) {
        console.log(`\n未分层 · ${unlayered.length}（新脚本未登记，请在 SCRIPTS 补层）`);
        for (const item of unlayered) {
            console.log(`  ${(item.name + '.js').padEnd(26)} ${originTag(item.origin)}  ${item.desc}`);
        }
    }
}
function runOne(name, args, timeoutSec) {
    const file = path.join(VERIFY_DIR, `${name}.js`);
    const result = (0, child_process_1.spawnSync)(process.execPath, [file, ...args], {
        cwd: APP_ROOT,
        stdio: 'inherit',
        timeout: timeoutSec > 0 ? timeoutSec * 1000 : undefined,
    });
    if (result.error) {
        console.error(`[verify-suite] 启动失败：${result.error.message}`);
        return { code: 1, timedOut: false };
    }
    if (result.signal) {
        console.error(`[verify-suite] ${name} 被信号终止：${result.signal}`);
        return { code: 1, timedOut: true };
    }
    return { code: result.status ?? 1, timedOut: false };
}
function runAll(timeoutSec) {
    const all = entries();
    let passed = 0;
    const failed = [];
    for (const item of all) {
        console.log(`\n===== [${item.layer}] ${item.name}.js ${originTag(item.origin)} ====`);
        const { code } = runOne(item.name, [], timeoutSec);
        if (code === 0) {
            passed += 1;
            console.log(`[verify-suite] PASS ${item.name} (exit 0)`);
        }
        else {
            failed.push(`${item.name} (exit ${code})`);
            console.log(`[verify-suite] FAIL ${item.name} (exit ${code})`);
        }
    }
    console.log(`\n[verify-suite] 汇总：${passed} 通过 / ${failed.length} 失败 / 共 ${all.length}`);
    if (failed.length > 0) {
        console.log(`[verify-suite] 失败项：${failed.join('，')}`);
        return 1;
    }
    return 0;
}
function main(argv) {
    const args = argv.filter((value) => value !== '--');
    if (args.includes('--all')) {
        const timeoutIndex = args.indexOf('--timeout');
        const timeoutSec = timeoutIndex > -1 ? Number(args[timeoutIndex + 1]) || DEFAULT_TIMEOUT_SEC : DEFAULT_TIMEOUT_SEC;
        return runAll(timeoutSec);
    }
    const nameArg = args.find((value) => !value.startsWith('-'));
    if (!nameArg) {
        printList();
        return 0;
    }
    const name = nameArg.endsWith('.js') ? nameArg.slice(0, -3) : nameArg;
    if (!fs.existsSync(path.join(VERIFY_DIR, `${name}.js`))) {
        console.error(`[verify-suite] 未找到脚本：verify/${name}.js`);
        console.error(`[verify-suite] 可用脚本：${listScriptNames().join(', ')}`);
        return 2;
    }
    const rest = args.slice(args.indexOf(nameArg) + 1);
    return runOne(name, rest, 0).code;
}
process.exit(main(process.argv.slice(2)));

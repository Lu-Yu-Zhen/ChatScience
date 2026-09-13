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
   ChatScience 桌面版构建脚本：内联 Work 模块 + 注入桌面适配层
   用法：node build.js （由 start.bat 自动执行；源码为 src/build.ts，经 tsc 编译）

   产物 renderer/index.html 是单文件，包含三段脚本，顺序不可调换：
     1. 主脚本（源文件 01/主页面.html 内联）
     2. Work 模块 bundle（源目录 01/work/*.js，本脚本内联）
     3. 桌面桥接脚本（本脚本注入）
   顺序原因：Work bundle 要读主脚本的顶层 const（WORK_HOOKS / PROVIDERS / i18n），
   桥接的 boot() 会触发渲染，此时 Work 页面必须已注册进 WORK_HOOKS。 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const SRC = path.join(__dirname, '..', '01', '主页面.html');
const OUT = path.join(__dirname, 'renderer', 'index.html');
const WORK_DIR = path.join(__dirname, '..', '01', 'work');
/* 标记本身 + 其后紧跟的说明注释一起替换掉，产物里不残留源码注释 */
const WORK_MARK = /<!--CS_WORK_MODULES-->\s*(?:<!--[\s\S]*?-->\s*)?/;
const BRIDGE = `
<!--CS_DESKTOP_BRIDGE-->
<script>
/* ===== ChatScience 桌面适配层（build.js 注入） ===== */
(function () {
  'use strict';
  const q = new URLSearchParams(window.location.search || '');
  const urlToken = q.get('token');
  const urlPort = q.get('port');
  const desk = (typeof window.csDesktop !== 'undefined') ? window.csDesktop : null;
  /* Electron：preload 桥；纯浏览器：URL 带 token 即启用（端口缺省用当前 origin） */
  const mode = desk && desk.port ? 'ipc' : (urlToken ? 'http' : null);
  if (!mode) return; /* 纯浏览器：保持演示模式 */

  if (mode === 'ipc') {
    window.CS_BACKEND = { base: 'http://127.0.0.1:' + desk.port, token: desk.token, mode: 'ipc' };
  } else {
    window.CS_BACKEND = { base: urlPort ? ('http://127.0.0.1:' + urlPort) : window.location.origin, token: urlToken, mode: 'http' };
  }
  function apiGetState() {
    if (mode === 'ipc') { const raw = desk.getStateSync(); return Promise.resolve(raw); }
    return fetch(window.CS_BACKEND.base + '/api/state', { headers: { Authorization: 'Bearer ' + window.CS_BACKEND.token } }).then(r => r.text());
  }
  function apiSaveState(snap) {
    if (mode === 'ipc') { desk.saveState(snap); return; }
    fetch(window.CS_BACKEND.base + '/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + window.CS_BACKEND.token },
      body: snap
    }).catch(function () {});
  }

  /* Work 模块由 bundle 挂到 window.CS_WORK；未构建时为空，全部走可选链 */
  function work() { return window.CS_WORK || null; }

  /* 1. 恢复持久化状态（渲染前） */
  apiGetState().then(function (raw) {
    if (!raw) return boot();
    try {
      const st = JSON.parse(raw);
      if (Array.isArray(st.conversations)) { conversations.length = 0; st.conversations.forEach(function (c) { conversations.push(c); }); }
      if (Array.isArray(st.projects)) { projects.length = 0; st.projects.forEach(function (p) { projects.push(p); }); }
      if (st.readThreads && typeof readThreads === 'object') {
        Object.keys(readThreads).forEach(function (k) { delete readThreads[k]; });
        Object.keys(st.readThreads).forEach(function (k) { readThreads[k] = st.readThreads[k]; });
      }
      if (st.papersDbState && typeof papersDbState === 'object') {
        papersDbState.tab = st.papersDbState.tab || papersDbState.tab;
        if (Array.isArray(st.papersDbState.kbs)) papersDbState.kbs = st.papersDbState.kbs;
        if (Array.isArray(st.papersDbState.dbs)) papersDbState.dbs = st.papersDbState.dbs;
      }
      if (st.models) { try { localStorage.setItem('cs-models', JSON.stringify(st.models)); } catch (e) {} }
      if (st.activeModelKey) { activeModelKey = st.activeModelKey; try { localStorage.setItem('cs-active-model', activeModelKey); } catch (e) {} }
      if (st.workUi && work() && work().restore) work().restore(st.workUi);
    } catch (e) { if (desk) desk.log('restore failed: ' + e.message); }
    boot();
  }).catch(function () { boot(); });

  /* 2. 默认模型：阿里云百炼 qwen3.8-flash（key 由后端 config.json 持有） */
  function ensureDefaultModel() {
    try {
      if (!getModels().length) {
        const bailian = PROVIDERS.find(function (p) { return p.id === 'bailian'; });
        const mdl = bailian.models.find(function (m) { return m.id === 'qwen3.8-flash'; });
        const entry = {
          key: 'bailian/qwen3.8-flash/default', providerId: 'bailian', providerName: bailian.name,
          modelId: 'qwen3.8-flash', name: 'Qwen3.8-Flash', ctx: mdl.ctx, ctxTokens: mdl.ctxTokens,
          vision: mdl.vision, web: bailian.webSearch, apiKey: '', temperature: '',
          maxInTokens: mdl.ctxTokens, maxOutTokens: mdl.maxOutTokens
        };
        saveModels([entry]);
        activeModelKey = entry.key;
        try { localStorage.setItem('cs-active-model', activeModelKey); } catch (e) {}
      }
    } catch (e) { if (desk) desk.log('default model failed: ' + e.message); }
  }

  /* 3. 状态即时同步：180ms 差量检测（<200ms），文件二进制与大体积轨迹不落盘
     replacer 规则：
       - data / dataUrl / argsRaw / modelText：整字段剥离（二进制与可再生的原始串）
       - result / reasoning：轨迹内容截断（工具结果可达 8KB，直接进快照会造成写风暴）
     注意不能按字段名截断对话正文 m.text——那会丢用户与模型的回答内容 */
  const SNAP_TRIM_BYTES = 6 * 1024 * 1024;
  let lastSnap = '';
  let saving = false;
  function replacer(k, v) {
    if (k === 'data' || k === 'dataUrl' || k === 'argsRaw' || k === 'modelText') return undefined;
    if (k === 'result' || k === 'reasoning') {
      if (typeof v === 'string' && v.length > 2048) return v.slice(0, 2048) + '…[truncated]';
      return v;
    }
    return v;
  }
  /* 循环引用 / DOM 引用兜底：宁可丢轨迹，也不能让整个快照写失败 */
  function snapshot() {
    const w = work();
    const payload = {
      conversations: conversations,
      projects: projects,
      readThreads: readThreads,
      papersDbState: { tab: papersDbState.tab, kbs: papersDbState.kbs, dbs: papersDbState.dbs, tabState: null },
      models: getModels(),
      activeModelKey: activeModelKey,
      workUi: (w && w.snapshot) ? w.snapshot() : null
    };
    try {
      return JSON.stringify(payload, replacer);
    } catch (e) {
      if (desk) desk.log('snapshot fallback (drop trace): ' + e.message);
      return JSON.stringify(payload, function (k, v) {
        if (k === '_calls' || k === '_traceNode' || k === '_run' || k === '_statusTimer'
          || k === 'data' || k === 'dataUrl' || k === 'argsRaw' || k === 'modelText') return undefined;
        return v;
      });
    }
  }
  function syncTick() {
    if (saving) return;
    try {
      let snap = snapshot();
      /* 轨迹体积失控时降级：只保留最近 3 个会话的完整步骤 */
      if (snap.length > SNAP_TRIM_BYTES) snap = snapshot({ keepSteps: 3 });
      if (snap !== lastSnap) {
        lastSnap = snap;
        saving = true;
        const r = apiSaveState(snap);
        Promise.resolve(r).finally(function () { saving = false; });
      }
    } catch (e) { /* 忽略 */ }
  }

  function boot() {
    ensureDefaultModel();
    refreshModelMenu();
    renderConversations();
    renderProjects();
    /* 恢复历史数据后进入新对话欢迎页（招呼语），历史会话保留在左侧可切换 */
    if (conversations.length) {
      startDraft(null);
    } else {
      renderMessages();
    }
    renderRightPanel();
    renderCtxChips();
    applyLang();
    if (work() && work().boot) { try { work().boot(); } catch (e) { if (desk) desk.log('work boot failed: ' + e.message); } }
    setTimeout(function () { lastSnap = snapshot(); }, 600);
    setInterval(syncTick, 180);
    if (desk && desk.onTopmostChanged) desk.onTopmostChanged(function (v) { showToast(v ? '窗口已置顶' : '已取消置顶'); });
  }
})();
</scr` + `ipt>
`;
/* ---------------- Work 模块 bundle ----------------
   文件名以两位数字前缀排序，lexicographic 排序即执行顺序（跨平台确定）。
   不用 readdirSync 的原始返回顺序——它依赖文件系统，不保证有序。 */
function listWorkFiles() {
    if (!fs.existsSync(WORK_DIR))
        return [];
    return fs.readdirSync(WORK_DIR)
        .filter(function (f) { return /^\d\d-[A-Za-z0-9_-]+\.js$/.test(f); })
        .sort();
}
/* 构建期语法校验：语法错误必须在这里失败，不能让 start.bat 产出一个白屏应用。
   用 node --check 子进程逐文件校验，不在构建进程内编译任何代码。 */
function checkSyntax(files) {
    files.forEach(function (f) {
        const full = path.join(WORK_DIR, f);
        const r = (0, child_process_1.spawnSync)(process.execPath, ['--check', full], { encoding: 'utf8' });
        if (r.status !== 0) {
            throw new Error('[build] work 模块语法错误 ' + f + ':\n' + ((r.stderr || r.stdout) || '').trim());
        }
    });
}
function buildWorkBundle() {
    const files = listWorkFiles();
    if (!files.length)
        return null;
    if (files[0] !== '00-core.js')
        throw new Error('[build] work 模块首个必须是 00-core.js，实际为 ' + files[0]);
    if (files[files.length - 1] !== '90-boot.js')
        throw new Error('[build] work 模块末个必须是 90-boot.js，实际为 ' + files[files.length - 1]);
    checkSyntax(files);
    const parts = files.map(function (f) {
        return '/* ===== 01/work/' + f + ' ===== */\n' + fs.readFileSync(path.join(WORK_DIR, f), 'utf8').trim();
    });
    /* 单个 IIFE：模块间共享顶层 const（Work / WORK_I18N 等），且不污染全局。
       对主脚本全局（WORK_HOOKS / t / chatScroll / getModels）的引用只在函数体内发生，
       因为 bundle 在主脚本之后执行，加载期它们已初始化。 */
    const bundle = "(function () {\n'use strict';\n\n" + parts.join('\n\n') + "\n\n})();";
    checkI18nKeys();
    return { bundle: bundle, files: files };
}
/* zh / en 键集合一致性：缺失键在运行时会让函数型词条 t('x')(...) 直接抛 TypeError。
   80-i18n.js 是纯数据模块（无 DOM 依赖），按 CommonJS 载入以做键集合 diff。 */
function checkI18nKeys() {
    const p = path.join(WORK_DIR, '80-i18n.js');
    if (!fs.existsSync(p))
        return;
    let dict = null;
    try {
        dict = require(p);
    }
    catch (e) {
        console.warn('[build] 80-i18n.js 无法作为 CommonJS 载入，跳过键集合校验: ' + e.message);
        return;
    }
    if (!dict || !dict.zh || !dict.en) {
        console.warn('[build] 80-i18n.js 未导出 {zh,en}，跳过校验');
        return;
    }
    const zh = Object.keys(dict.zh), en = Object.keys(dict.en);
    const onlyZh = zh.filter(function (k) { return en.indexOf(k) === -1; });
    const onlyEn = en.filter(function (k) { return zh.indexOf(k) === -1; });
    if (onlyZh.length)
        console.warn('[build] i18n 缺英文: ' + onlyZh.join(', '));
    if (onlyEn.length)
        console.warn('[build] i18n 缺中文: ' + onlyEn.join(', '));
    /* 函数型词条两侧类型必须一致，否则一侧调用会 TypeError */
    const typeDiff = zh.filter(function (k) {
        return en.indexOf(k) > -1 && typeof dict.zh[k] !== typeof dict.en[k];
    });
    if (typeDiff.length)
        console.warn('[build] i18n 中英类型不一致: ' + typeDiff.join(', '));
    if (!onlyZh.length && !onlyEn.length && !typeDiff.length) {
        console.log('[build] i18n 校验通过，词条 ' + zh.length + ' 条');
    }
}
/* ---------------- 组装 ---------------- */
let html = fs.readFileSync(SRC, 'utf8');
if (html.indexOf('CS_DESKTOP_BRIDGE') > -1)
    throw new Error('[build] 源文件已含桥接标记，疑似把产物当源文件');
if (!WORK_MARK.test(html))
    throw new Error('[build] 源文件缺少 <!--CS_WORK_MODULES--> 注入标记');
const built = buildWorkBundle();
/* 必须用函数式替换：字符串替换会把 $$ / $& / $' / $` 当特殊模式，
   而源文件 KaTeX 定界符配置里就有 '$$'，会把 bundle 改写得面目全非 */
if (built) {
    html = html.replace(WORK_MARK, function () { return '<script>\n' + built.bundle + '\n</scr' + 'ipt>\n\n'; });
}
else {
    /* 没有 work 模块时也要吃掉标记，保证产物不含字面量 */
    html = html.replace(WORK_MARK, '');
    console.warn('[build] 01/work/ 为空或不存在，Work 模式将显示"模块未加载"');
}
/* 桥接插在 </html> 之前（源文件可能没有 </body> 闭合标签） */
if (/<\/html>/i.test(html)) {
    html = html.replace(/<\/html>\s*$/i, function () { return BRIDGE + '</html>\n'; });
}
else {
    html += BRIDGE;
}
/* ---------------- 产物断言：任一失败即非零退出，阻止 start.bat 启动 Electron ---------------- */
function assert(cond, msg) { if (!cond) {
    console.error('[build] 断言失败: ' + msg);
    process.exit(1);
} }
assert(html.indexOf('CS_WORK_MODULES') === -1, '产物仍含 CS_WORK_MODULES 字面标记');
assert(html.split('CS_DESKTOP_BRIDGE').length - 1 === 1, '产物应恰含 1 个 CS_DESKTOP_BRIDGE');
if (built) {
    const iw = html.indexOf(built.bundle), ib = html.indexOf('CS_DESKTOP_BRIDGE');
    assert(iw > -1 && ib > -1 && iw < ib, 'work bundle 必须在桥接脚本之前');
    const im = html.indexOf('id="modeSwitcher"');
    assert(im > -1 && im < iw, 'work bundle 必须在主脚本之后');
}
/* 标题保持纯「ChatScience」（产品要求：不带构建时间） */
assert(html.indexOf('<title>ChatScience</title>') > -1, '源文件标题被改动');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html, 'utf8');
console.log('[build] renderer/index.html 已写出，bytes=' + html.length
    + '，work 模块=' + (built ? built.files.length + ' 个（' + built.files.join(' ') + '）' : '无')
    + '，bridge=ok，断言=通过');

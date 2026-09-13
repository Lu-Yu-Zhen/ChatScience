/* ==================================================================
   policy.js · 沙箱策略与路径守卫

   能力边界（必须如实理解，UI 与验证报告都要声明）：
   - 沙箱**不是**安全边界。代码以当前用户权限在本机执行，没有容器/Job Object，
     因此无法真正阻止它读写本机任意文件、耗尽内存或联网。
   - 本模块的两类防护定位不同：
     · assertInside / sanitizeRelPath —— 作用于**工具级文件 API**（read_file /
       write_file / list_files / 产物下载），这一层是强制有效的。
     · DANGER_PATTERNS —— 对代码文本做静态拦截，属于纵深防御与可审计手段，
       防的是"模型或用户手滑写出破坏性命令"，防不住有意绕过。
   - 唯一不可被沙箱内代码绕过的一层是 spawnGuarded 的 shell:false + argv 数组：
     命令行不经过 shell 解析，代码里的内容不会被当作 shell 元字符执行。
   ================================================================== */
const path = require('path');
const fs = require('fs');
const proc = require('./proc');

const DEFAULT_POLICY = {
  timeoutMs: 120000,          /* 单次执行上限 */
  maxOutputBytes: 262144,     /* stdout / stderr 各自上限（256KB） */
  maxConcurrent: 2,           /* 全局并发执行数 */
  maxFileSizeMb: 20,          /* 单文件写入上限 */
  maxInlineImageBytes: 2097152, /* ≤2MB 的图片产物转 base64 内联回传 */
  network: 'declared',        /* 'open' | 'declared'（声明式断网，见 sandbox.js 说明） */
  blockDangerPatterns: true,
  blockParentTraversal: true, /* 拦截 ../../ 这类两级以上向上穿越 */
  blockNetworkImports: false, /* 静态拦截 import requests/socket 等（默认关，误伤面大） */
  autoGcDays: 7
};

/* ---------------- 路径归一化与守卫 ---------------- */

/* Windows 路径细节：\\?\ 扩展长度前缀、正反斜杠混用、大小写不敏感 */
function normPath(p) {
  let s = String(p || '');
  if (s.startsWith('\\\\?\\')) s = s.slice(4);
  s = s.replace(/\\/g, '/');
  if (proc.IS_WIN) s = s.toLowerCase();
  return s.replace(/\/+$/, '') || (proc.IS_WIN ? s.toLowerCase() : '/');
}

/* target 必须落在 root 内（含 root 自身）。
   前缀比较必须带分隔符：否则 sandbox/global2 会通过 sandbox/global 的检查。 */
function assertInside(root, target) {
  const r = normPath(path.resolve(root));
  const t = normPath(path.resolve(target));
  if (t !== r && !t.startsWith(r + '/')) {
    const e = new Error('path escapes sandbox root: ' + target);
    e.code = 'EPATHOUT';
    throw e;
  }
  /* 封 junction / 符号链接绕过：真实路径也必须仍在 root 内 */
  try {
    const real = normPath(fs.realpathSync.native ? fs.realpathSync.native(target) : fs.realpathSync(target));
    if (real !== r && !real.startsWith(r + '/')) {
      const e = new Error('path resolves outside sandbox via link: ' + target);
      e.code = 'EPATHLINK';
      throw e;
    }
  } catch (e) {
    if (e.code === 'EPATHOUT' || e.code === 'EPATHLINK') throw e;
    /* ENOENT：目标尚不存在（写新文件），父目录已在上面校验过，放行 */
  }
  return path.resolve(target);
}

const ILLEGAL_CHARS = /[<>:"|?*\u0000-\u001F]/;
const RESERVED_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
const MAX_REL_LEN = 240;   /* 留余量规避 Windows 260 路径长度限制 */

/* 校验并归一化沙箱内相对路径；非法则抛 ERELPATH */
function sanitizeRelPath(rel) {
  const raw = String(rel || '').trim();
  if (!raw) throw relErr('空路径');
  if (raw.length > MAX_REL_LEN) throw relErr('路径过长（>' + MAX_REL_LEN + '）');
  if (path.isAbsolute(raw) || /^[a-z]:/i.test(raw) || raw.startsWith('\\\\')) throw relErr('必须是相对路径: ' + raw);
  const segs = raw.split(/[\\/]+/).filter(function (s) { return s.length && s !== '.'; });
  if (!segs.length) throw relErr('空路径');
  for (const s of segs) {
    if (s === '..') throw relErr('不允许向上穿越: ' + raw);
    if (ILLEGAL_CHARS.test(s)) throw relErr('含非法字符: ' + s);
    if (RESERVED_NAMES.test(s.replace(/\.[^.]*$/, ''))) throw relErr('Windows 保留设备名: ' + s);
  }
  return segs.join('/');
}
function relErr(msg) {
  const e = new Error('invalid sandbox path — ' + msg);
  e.code = 'ERELPATH';
  return e;
}

/* ---------------- 危险代码模式 ---------------- */
/* 精确匹配破坏性命令本身，避免误伤科研代码。
   典型反例：裸词 "format" 会命中 Python 的 str.format()，因此这里只匹配
   Windows 的 `format X:` 磁盘格式化命令。 */
const DANGER_PATTERNS = [
  { re: /\brm\s+(?:-[a-zA-Z]+\s+)*-[a-zA-Z]*[rf][a-zA-Z]*\s+(?:\/|~|\$HOME)(?=\s|$|\*|['"`;,)])/, why: 'rm -rf 根/家目录' },
  { re: /\bmkfs(?:\.\w+)?\b/, why: '格式化文件系统 (mkfs)' },
  { re: /\bdd\b[^\n]*\bof=\/dev\//, why: 'dd 直写块设备' },
  { re: />\s*\/dev\/(?:sd|nvme|hd|disk)/, why: '重定向写入块设备' },
  { re: /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:\s*&\s*\}/, why: 'fork 炸弹' },
  { re: /^\s*format(?:\.com)?\s+[a-z]:\s*$/im, why: 'Windows 磁盘格式化 (format X:)' },
  { re: /\breg\s+(?:delete|add)\b/i, why: '修改注册表 (reg delete/add)' },
  { re: /\b(?:shutdown|restart-computer|stop-computer)\b/i, why: '关机/重启命令' },
  { re: /Remove-Item[^\n]*-Recurse[^\n]*-Force[^\n]*[a-z]:[\\/]/i, why: 'PowerShell 递归强删磁盘目录' },
  { re: /\b(?:del|erase)\s+\/[fsq][fsq]*\s+[a-z]:[\\/]/i, why: 'del /f /s /q 磁盘根' },
  { re: /\b(?:rmdir|rd)\s+\/s[^\n]*[a-z]:[\\/](?:windows|program files|users)\b/i, why: '递归删除系统目录' },
  { re: /\bchmod\s+(?:-[a-zA-Z]+\s+)*777\s+\//, why: 'chmod 777 根目录' },
  { re: /shutil\.rmtree\(\s*['"](?:[a-z]:[\\/]?(?:windows|program files|users)?|(?:\/|~))[\\/'"]?/i, why: 'shutil.rmtree 系统/根目录' },
  { re: /\b(?:taskkill|killall)\s+(?:\/im\s+)?(?:explorer|csrss|winlogon|services|svchost|electron)/i, why: '终止系统关键进程' },
  { re: /\bcipher\s+\/w:/i, why: '磁盘擦除 (cipher /w)' },
  { re: /\bvssadmin\s+delete\s+shadows/i, why: '删除卷影副本' }
];

/* 两级以上向上穿越：沙箱内代码正常不需要爬到 app/server 或 app/data 之外，
   而那里放着 config.json（含 API Key）与 state.json。单级 ../ 放行（work→out）。 */
const TRAVERSAL_RE = /(?:\.\.[\\/]\s*){2,}\.\./;

const NET_IMPORT_RE = /^\s*(?:import|from)\s+(requests|urllib(?:3)?|httpx|http\.client|socket|aiohttp|ftplib|smtplib)|require\(\s*['"](https?|net|dgram|dns|tls|axios|node-fetch)['"]\s*\)/;

/* 返回 { blocked: true, reason, hits } 或 { blocked: false, hits: [] } */
function scanCode(code, policy) {
  const src = String(code || '');
  const hits = [];
  if (policy.blockDangerPatterns !== false) {
    for (const p of DANGER_PATTERNS) {
      if (p.re.test(src)) hits.push(p.why);
    }
  }
  if (policy.blockParentTraversal !== false && TRAVERSAL_RE.test(src)) {
    hits.push('路径向上穿越三级以上（沙箱内代码不应访问沙箱外文件）');
  }
  if (policy.blockNetworkImports) {
    const m = src.match(NET_IMPORT_RE);
    if (m) hits.push('断网策略下禁止导入网络库：' + (m[1] || m[2] || 'unknown'));
  }
  if (hits.length) return { blocked: true, reason: hits.join('；'), hits: hits };
  return { blocked: false, hits: [] };
}

/* npm / pip 包名白名单：.cmd 包装需经 cmd.exe，靠这个把 shell 元字符挡在外面 */
const PKG_SPEC_RE = /^(@[a-z0-9-_.~]+\/)?[a-z0-9-_.~]+(?:@(?:[\w.-]+|\^?~?>?=?[\d][\w.*-]*))?$/i;
const PY_PKG_RE = /^[a-z0-9][a-z0-9-_.]*(\[[a-z0-9,_-]+\])?(==?[^\s;]+|>=?[^\s;]+|<=?[^\s;]+|~=[^\s;]+)?$/i;

function isSafePackageSpec(spec, manager) {
  const s = String(spec || '').trim();
  if (!s || s.length > 200) return false;
  if (manager === 'pip' || manager === 'uv') return PY_PKG_RE.test(s);
  return PKG_SPEC_RE.test(s);
}

function mergePolicy(override) {
  const p = Object.assign({}, DEFAULT_POLICY);
  if (override && typeof override === 'object') {
    Object.keys(DEFAULT_POLICY).forEach(function (k) {
      if (override[k] !== undefined && override[k] !== null) p[k] = override[k];
    });
  }
  /* 数值型上下限兜底，防止配置写歪导致挂死或 OOM */
  p.timeoutMs = Math.min(Math.max(parseInt(p.timeoutMs, 10) || DEFAULT_POLICY.timeoutMs, 1000), 900000);
  p.maxOutputBytes = Math.min(Math.max(parseInt(p.maxOutputBytes, 10) || DEFAULT_POLICY.maxOutputBytes, 1024), 8388608);
  p.maxConcurrent = Math.min(Math.max(parseInt(p.maxConcurrent, 10) || DEFAULT_POLICY.maxConcurrent, 1), 8);
  p.maxFileSizeMb = Math.min(Math.max(parseInt(p.maxFileSizeMb, 10) || DEFAULT_POLICY.maxFileSizeMb, 1), 2048);
  return p;
}

module.exports = {
  DEFAULT_POLICY, DANGER_PATTERNS, normPath, assertInside, sanitizeRelPath,
  scanCode, isSafePackageSpec, mergePolicy, MAX_REL_LEN
};

/* ==================================================================
   proc.js · 子进程与运行时管理
   - detectRuntimes()：探测 python / node / uv / npm，带 TTL 缓存
   - resolveExecutable()：Windows 下把裸命令名解析成真实可执行文件路径
   - killTree()：Windows 必须用 taskkill /T /F，child.kill() 杀不掉孙子进程
   - spawnGuarded()：shell:false + argv 数组 + stdin 关闭 + 隐藏窗口
   ================================================================== */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const IS_WIN = process.platform === 'win32';
const RUNTIME_CACHE_TTL = 6 * 60 * 60 * 1000;

/* ---------------- 可执行文件解析 ---------------- */

/* Windows 的 CreateProcess 只认 .exe；npm/uv 之类常是 .cmd 包装，
   裸名 spawn 会 ENOENT。用 where.exe 解析真实路径（短命令，同步可接受）。 */
const exeCache = new Map();
function resolveExecutable(name) {
  if (exeCache.has(name)) return exeCache.get(name);
  let resolved = null;
  try {
    if (IS_WIN) {
      const r = spawnSync('where.exe', [name], { encoding: 'utf8', windowsHide: true, timeout: 8000 });
      if (r.status === 0 && r.stdout) {
        const lines = r.stdout.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
        /* 优先 .exe，其次 .cmd/.bat（后者需经 cmd.exe 执行） */
        resolved = lines.find(function (l) { return /\.exe$/i.test(l); })
          || lines.find(function (l) { return /\.(cmd|bat)$/i.test(l); })
          || lines[0] || null;
      }
    } else {
      const r = spawnSync('/bin/sh', ['-c', 'command -v "$1"', 'sh', name], { encoding: 'utf8', timeout: 8000 });
      if (r.status === 0 && r.stdout) resolved = r.stdout.trim() || null;
    }
  } catch (e) { resolved = null; }
  exeCache.set(name, resolved);
  return resolved;
}

function isScriptWrapper(exePath) {
  return !!exePath && /\.(cmd|bat)$/i.test(exePath);
}

/* ---------------- 运行时探测 ---------------- */

const RUNTIME_PROBES = [
  { key: 'python', names: ['python', 'python3', 'py'], args: ['--version'] },
  { key: 'node', names: ['node'], args: ['--version'] },
  { key: 'uv', names: ['uv'], args: ['--version'] },
  { key: 'npm', names: ['npm'], args: ['--version'] },
  { key: 'pip', names: ['pip', 'pip3'], args: ['--version'] }
];

function probeOne(names, args) {
  for (const name of names) {
    const exe = resolveExecutable(name);
    if (!exe) continue;
    try {
      const r = spawnSync(exe, args, { encoding: 'utf8', windowsHide: true, timeout: 15000, shell: false });
      const out = ((r.stdout || '') + (r.stderr || '')).trim();
      if (r.status === 0 && out) {
        const m = out.match(/(\d+\.\d+(?:\.\d+)?)/);
        return { command: name, exe: exe, version: m ? m[1] : out.split('\n')[0].slice(0, 60), raw: out.split('\n')[0].slice(0, 120) };
      }
    } catch (e) { /* 换下一个候选名 */ }
  }
  return null;
}

/* 探测结果落盘缓存：每次启动都跑 5 个 where.exe + 5 个 --version 会有可感知延迟 */
function detectRuntimes(appRoot, force) {
  const cacheFile = path.join(appRoot, 'data', 'runtimes.json');
  if (!force) {
    try {
      const c = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (c && c.at && (Date.now() - c.at) < RUNTIME_CACHE_TTL && c.runtimes) return c;
    } catch (e) { /* 缓存不可用，重新探测 */ }
  }
  const runtimes = {};
  const errors = [];
  RUNTIME_PROBES.forEach(function (p) {
    const hit = probeOne(p.names, p.args);
    if (hit) runtimes[p.key] = hit;
    else errors.push({ key: p.key, tried: p.names.join(', '), error: 'ENOENT / 未找到可执行文件' });
  });
  const result = {
    at: Date.now(), platform: process.platform, arch: process.arch,
    cpus: os.cpus().length, totalMemMb: Math.round(os.totalmem() / 1048576),
    runtimes: runtimes, errors: errors
  };
  try {
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2), 'utf8');
  } catch (e) { /* 缓存写失败不影响探测结果 */ }
  return result;
}

/* ---------------- 进程树终止 ---------------- */

/* Windows：child.kill() 只杀直接子进程，python 派生的子进程会变孤儿继续跑。
   taskkill /T 按进程树杀，/F 强制。 */
function killTree(pid, reason) {
  if (!pid) return { killed: false, reason: 'no pid' };
  try {
    if (IS_WIN) {
      const r = spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { encoding: 'utf8', windowsHide: true, timeout: 10000 });
      return { killed: r.status === 0, reason: reason || 'killTree', detail: ((r.stdout || '') + (r.stderr || '')).trim().slice(0, 200) };
    }
    /* POSIX：spawn 时用 detached 建了进程组，杀 -pid 即整组 */
    try { process.kill(-pid, 'SIGKILL'); return { killed: true, reason: reason || 'killTree' }; }
    catch (e) { process.kill(pid, 'SIGKILL'); return { killed: true, reason: reason || 'killTree (single)' }; }
  } catch (e) {
    return { killed: false, reason: reason || 'killTree', error: e.message };
  }
}

function isAlive(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return false; }
}

/* ---------------- 受控 spawn ---------------- */

/* cmd.exe 参数转义：仅用于 .cmd/.bat 包装（npm 等）。
   调用方必须先用 isSafePackageSpec 过滤掉 shell 元字符，这里做第二层防护。 */
function quoteCmdArg(a) {
  const s = String(a);
  if (/[&|<>()^%!"/\\\s]/.test(s)) return '"' + s.replace(/(["\\])/g, '^$1') + '"';
  return s;
}

/* shell:false + argv 数组是唯一不可被沙箱内代码绕过的一层；
   stdin 设 ignore 杜绝任何交互式等待（否则只能等超时）；windowsHide 防弹控制台窗口。 */
function spawnGuarded(cmd, args, opts) {
  const o = opts || {};
  const base = {
    cwd: o.cwd,
    env: o.env,
    shell: false,
    windowsHide: true,
    detached: !IS_WIN,          /* POSIX 建进程组，便于整组终止 */
    stdio: ['ignore', 'pipe', 'pipe']
  };
  let realCmd = cmd;
  let realArgs = args.slice();
  if (IS_WIN && isScriptWrapper(cmd)) {
    /* .cmd/.bat 无法直接 CreateProcess，必须经 cmd.exe；参数逐个转义 */
    realCmd = process.env.ComSpec || 'cmd.exe';
    realArgs = ['/d', '/s', '/c', '"' + [cmd].concat(args).map(quoteCmdArg).join(' ') + '"'];
  }
  const child = spawn(realCmd, realArgs, base);
  child._csCmd = cmd;
  child._csArgs = args;
  return child;
}

module.exports = {
  IS_WIN, detectRuntimes, resolveExecutable, isScriptWrapper,
  killTree, isAlive, spawnGuarded, quoteCmdArg
};

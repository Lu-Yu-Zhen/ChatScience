/* userdata 单元验证：真实 ~/.qoder-cn 数据 + 安全边界（不修改任何用户数据，
   删除测试用临时目录模拟）。运行：node verify/userdata-check.js */
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const U = require('../server/userdata');

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  → ' + extra : '')); }
}

console.log('[A] listMemories（真实扫描）');
const m = U.listMemories();
ok('A1 返回结构', m && m.global && Array.isArray(m.projects), JSON.stringify(m).slice(0, 120));
ok('A2 home 指向 .qoder-cn', m.home && m.home.endsWith('.qoder-cn'), m.home);
console.log('    global: count=' + (m.global && m.global.count) + ' updatedAt=' + (m.global && m.global.updatedAt));
ok('A3 全局记忆为真实计数（>0）', m.global.count > 0, 'count=' + m.global.count);
const files = m.global.files.map(f => f.name);
ok('A4 文件清单含 MEMORY.md', files.indexOf('MEMORY.md') > -1, files.join(','));
console.log('    projects: ' + m.projects.length + ' 个（含记忆）');
m.projects.slice(0, 5).forEach(p => console.log('      ' + p.slug + ' count=' + p.count));
ok('A5 项目按 updatedAt 降序', m.projects.every((p, i) => i === 0 || (m.projects[i - 1].updatedAt || 0) >= (p.updatedAt || 0)));

console.log('[B] readUserHooks（settings.json）');
const h = U.readUserHooks();
ok('B1 结构', typeof h.count === 'number' && Array.isArray(h.events));
ok('B2 指向真实 settings.json', h.path.includes('.qoder-cn') && h.path.endsWith('settings.json'), h.path);
ok('B3 当前本机可读', h.exists === true && h.readable === true, JSON.stringify({ exists: h.exists, readable: h.readable, error: h.error }));
console.log('    hooks count=' + h.count + ' events=' + h.events.length + '（本机当前无用户级 hooks → 0 为预期）');

console.log('[C] listWorktrees（真实 git 仓库）');
const w = U.listWorktrees('D:\\ChatScience');
console.log('    repo=D:\\ChatScience isRepo=' + w.isRepo + ' error=' + (w.error || '无') + ' n=' + w.worktrees.length);
ok('C1 仓库可识别或给出明确 error', w.isRepo || (w.error && w.error.length > 0));
if (w.isRepo) {
  ok('C2 主 worktree 在列表首位', w.worktrees.length > 0 && w.worktrees[0].path.length > 0);
}
const wBad = U.listWorktrees('D:\\__不存在的目录__');
ok('C3 不存在目录返回明确 error', !wBad.exists && !!wBad.error, wBad.error);
const wNon = U.listWorktrees(os.tmpdir());
ok('C4 非 git 目录报「不是 Git 仓库」', !wNon.isRepo && /Git/.test(wNon.error || ''), wNon.error);

console.log('[D] gitPrefsPrompt + normalizePrefs');
const prefs = {
  memory: { globalOn: false, projectOn: true },
  git: { prefix: 'feat/', force: true, instr: '使用中文' },
  worktrees: { fetchBeforeCreate: false, autoDelete: true, limit: 20 },
  appearance: { width: 'wide' }
};
const prompt = U.gitPrefsPrompt(prefs);
ok('D1 提示词含分支前缀', prompt.indexOf('feat/') > -1);
ok('D2 提示词含 force-with-lease', prompt.indexOf('--force-with-lease') > -1);
ok('D3 提示词含提交指令', prompt.indexOf('使用中文') > -1);
const merged = U.normalizePrefs({ memory: { globalOn: true }, git: { prefix: 'x/' }, worktrees: { limit: 999 }, appearance: { width: 'huge' } }, prefs);
ok('D4 merge 保留未提及字段', merged.git.force === true && merged.git.instr === '使用中文');
ok('D5 limit 越界被拒（999→保持 20）', merged.worktrees.limit === 20, String(merged.worktrees.limit));
ok('D6 非法 width 被拒', merged.appearance.width === 'wide', merged.appearance.width);
ok('D7 memory 开关可更新', merged.memory.globalOn === true && merged.memory.projectOn === true);

console.log('[E] deleteMemoryScope 安全边界（不碰真实数据，仅校验拒绝路径）');
ok('E1 项目 slug 含路径穿越被拒', U.deleteMemoryScope('project', '..\\evil') !== null);
ok('E2 项目 slug 含分隔符被拒', U.deleteMemoryScope('project', 'a/b') !== null);
ok('E3 不存在的项目返回明确错误', U.deleteMemoryScope('project', '__no_such_slug__') !== null);

console.log('[F] 软删除端到端（临时 HOME，真实 rename）');
const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-memtest-'));
try {
  fs.mkdirSync(path.join(tmpHome, 'memory'), { recursive: true });
  fs.writeFileSync(path.join(tmpHome, 'memory', 'MEMORY.md'), '# t');
  process.env.QODER_HOME = tmpHome;
  const m2 = U.listMemories();
  ok('F1 QODER_HOME 覆盖生效', m2.home === tmpHome, m2.home);
  ok('F2 临时全局记忆计数=1', m2.global.count === 1);
  const err = U.deleteMemoryScope('global');
  ok('F3 软删除成功（返回 null）', err === null, err || '');
  ok('F4 原目录已移除', !fs.existsSync(path.join(tmpHome, 'memory')));
  const trash = fs.readdirSync(os.tmpdir()).filter(n => n.indexOf('chatscience-memory-trash-') === 0);
  ok('F5 内容进入系统临时目录（可找回）', trash.length > 0);
  trash.forEach(n => { try { fs.rmSync(path.join(os.tmpdir(), n), { recursive: true, force: true }); } catch (e) { } });
} finally {
  delete process.env.QODER_HOME;
  try { fs.rmSync(tmpHome, { recursive: true, force: true }); } catch (e) { }
}

console.log('\n结果: ' + pass + ' PASS, ' + fail + ' FAIL');
process.exit(fail ? 1 : 0);

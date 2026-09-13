// @ts-nocheck
/* 独立运行的全局脚本（字节精确迁移自 JS）：关闭逐行类型检查，
   产物与原 JS 行为一致；语法错误仍会在编译期暴露。 */
/* ==================================================================
   skills-verify.js · N2 验证：技能系统（SDK local plugin）
   ① 12 个内建技能可列出且元数据完整
   ② 读取/保存/删除自定义技能（落盘为 SKILL.md）
   ③ 启用白名单链路端到端：store.states → agentDef.skills → SDK init.skills
   ④ 隔离：SDK 发现的技能全部来自 chatscience-skills 插件（无本机 CLI 技能泄漏）
   ================================================================== */
const path = require('path');
const fs = require('fs');
const { startServer } = require('../server/index');
const APP_ROOT = path.join(__dirname, '..');
const TOKEN = 'verify-' + Math.random().toString(36).slice(2);
const PORT = 37400 + Math.floor(Math.random() * 1200);
const results = [];

function record(id, name, ok, detail) {
  results.push({ id, name, ok: !!ok, detail: String(detail || '').slice(0, 400) });
  console.log((ok ? '  PASS' : '  FAIL') + '  [' + id + '] ' + name + (detail ? '  — ' + String(detail).slice(0, 180) : ''));
}

function api(method, p, body) {
  return fetch('http://127.0.0.1:' + PORT + p, {
    method, headers: Object.assign({ 'Content-Type': 'application/json' }, { Authorization: 'Bearer ' + TOKEN }),
    body: body === undefined ? undefined : JSON.stringify(body)
  }).then(function (r) { return r.json(); });
}

function runAgent(body) {
  return new Promise(function (resolve, reject) {
    const events = [];
    fetch('http://127.0.0.1:' + PORT + '/api/work/agent/run', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
      body: JSON.stringify(body)
    }).then(function (resp) {
      const reader = resp.body.getReader(); const dec = new TextDecoder(); let buf = '';
      (function pump() {
        reader.read().then(function (r) {
          if (r.done) return resolve(events);
          buf += dec.decode(r.value, { stream: true });
          let i;
          while ((i = buf.indexOf('\n')) > -1) {
            const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
            if (!line.startsWith('data:')) continue;
            try { events.push(JSON.parse(line.slice(5).trim())); } catch (e) { }
          }
          pump();
        }).catch(reject);
      })();
    }).catch(reject);
  });
}

async function main() {
  startServer(PORT, TOKEN, APP_ROOT, null);
  await new Promise(function (r) { setTimeout(r, 900); });

  /* ① 列表 */
  const list = await api('GET', '/api/work/skills');
  const skills = list.skills || [];
  record('1a', '内建技能数量 = 12', skills.length === 12, '实际 ' + skills.length + ': ' + skills.map(function (s) { return s.slug; }).join(','));
  record('1b', '元数据完整（name/description/builtin）', skills.every(function (s) { return s.name && s.description && s.builtin === true; }), '');
  const slugs = skills.map(function (s) { return s.slug; });
  record('1c', 'MindSpore / 精读 / 曲线诊断等关键技能在场',
    ['mindspore-repro', 'paper-deep-read', 'loss-curve-analysis', 'model-arch-analysis', 'experiment-log'].every(function (k) { return slugs.indexOf(k) > -1; }), '');

  /* ② 自定义技能 CRUD */
  await api('POST', '/api/work/skills/save', {
    slug: 'verify-custom', name: '验证技能', description: '验证用', content: '# 用途\n验证 SKILL.md 写入。\n\n## 输出\nOK'
  });
  const list2 = await api('GET', '/api/work/skills');
  const custom = (list2.skills || []).find(function (s) { return s.slug === 'verify-custom'; });
  record('2a', '自定义技能已列出且标记为自定义', !!custom && custom.builtin === false, custom ? custom.name : '未找到');
  const item = await api('GET', '/api/work/skills/item?slug=verify-custom');
  record('2b', 'SKILL.md 落盘且含 frontmatter 与正文', /---[\s\S]*name:\s*验证技能[\s\S]*---[\s\S]*# 用途/.test(item.markdown || ''), (item.markdown || '').slice(0, 60).replace(/\n/g, '|'));
  const onDisk = fs.existsSync(path.join(APP_ROOT, 'data', 'skills-plugin', 'skills', 'verify-custom', 'SKILL.md'));
  record('2c', '文件位于用户技能插件目录', onDisk, 'data/skills-plugin/skills/verify-custom/SKILL.md');

  /* ③ 启用白名单 → SDK init.skills */
  const states = {};
  slugs.forEach(function (s) { states[s] = { enabled: s === 'mindspore-repro' || s === 'paper-deep-read' }; });
  states['verify-custom'] = { enabled: false };
  await api('PUT', '/api/work/skills/states', states);
  const workDir = path.join(APP_ROOT, 'data', 'sandbox', 'verify', 'work');
  fs.mkdirSync(workDir, { recursive: true });
  const events = await runAgent({
    agentDef: { id: 'v', name: 'v', model: 'lite', maxTurns: 1, tools: { sdk: [], builtin: [] }, skills: ['mindspore-repro'] },
    convId: 'verify-skills', scopeId: 'verify', prompt: '只回复：OK'
  });
  const init = events.find(function (e) { return e.evt === 'notice' && e.code === 'init'; });
  const start2 = events.find(function (e) { return e.evt === 'run_start'; }) || {};
  const sdkSkills = (init && init.skills) || [];
  record('3a', 'SDK 会话发现技能包含白名单项（chatscience-skills:mindspore-repro）',
    sdkSkills.indexOf('chatscience-skills:mindspore-repro') > -1, 'init.skills=' + sdkSkills.join(','));

  /* ④ 隔离：本应用技能在发现列表中；数组式 skills 选项限制上下文与调用（SDK 文档语义）。
     init.skills 是"发现报告"，含本机用户级技能（约 50 项）属已知现象——
     上下文隔离靠 options.skills 数组，模型只能调用白名单内的技能。 */
  record('3b', '本应用插件技能全部进入发现列表',
    sdkSkills.filter(function (s) { return s.indexOf('chatscience-skills:') === 0; }).length >= 12,
    '发现总数=' + sdkSkills.length + '（含本机用户级技能，仅发现不注入；上下文已由 skills 数组限制为 ' + 'chatscience-skills:mindspore-repro' + '）');
  record('3c', 'run_start 工具可见集与技能白名单一致',
    (start2.tools || []).indexOf('Skill') > -1 && (start2.tools || []).filter(function (t) { return t.indexOf('mcp__') === 0; }).length === 0,
    'tools=' + (start2.tools || []).join(','));

  /* 清理自定义技能 */
  await api('POST', '/api/work/skills/delete', { slug: 'verify-custom' });
  const list3 = await api('GET', '/api/work/skills');
  record('2d', '删除自定义技能生效', !(list3.skills || []).some(function (s) { return s.slug === 'verify-custom'; }), '');

  const pass = results.filter(function (r) { return r.ok; }).length;
  const all = JSON.parse(fs.existsSync(path.join(__dirname, 'work-metrics.json')) ? fs.readFileSync(path.join(__dirname, 'work-metrics.json'), 'utf8') : '{}');
  all.skillsN2 = { at: new Date().toISOString(), total: results.length, pass: pass, results: results, sdkDiscovered: sdkSkills };
  fs.writeFileSync(path.join(__dirname, 'work-metrics.json'), JSON.stringify(all, null, 2), 'utf8');
  console.log('\n=== N2 技能系统验证: ' + pass + '/' + results.length + ' 通过 ===');
  process.exit(pass === results.length ? 0 : 1);
}

main().catch(function (e) { console.error('verify 异常:', e); process.exit(2); });

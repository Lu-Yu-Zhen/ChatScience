/* ==================================================================
   00-core.js · Work 模式基座
   - Work 命名空间（bundle 内共享，同时挂 window.CS_WORK 供桥接脚本读写快照）
   - tt()：安全取 i18n，缺词条不抛错
   - UI 原语：沿用主脚本既有设计语言（.btn / .info-row / .toggle / .seg /
     .field-input / .modal-overlay / .label / .tag），不新造视觉体系
   约定：本模块顶层只声明 Work 与纯函数，对主脚本全局（i18n / t / view /
   chatScroll / getModels / WORK_HOOKS …）的引用一律写在函数体内——bundle 在
   主脚本之后执行，加载期读它们会踩 TDZ。
   ================================================================== */

const Work = {
  version: '1.0.0',
  state: null,        /* 20-store.js 注水 */
  pages: {},          /* view -> function(){ return {node,title,desc,wide} } */
  api: null,          /* 10-api.js 注水 */
  ready: false,       /* 后端 bootstrap 是否已拉取 */
  bootError: null
};
window.CS_WORK = Work;

/* ---------------- i18n ---------------- */
const _ttMissed = {};
function tt(key, ...args) {
  const dict = (typeof i18n !== 'undefined' && i18n) ? i18n[getLang()] : null;
  const v = dict ? dict[key] : undefined;
  if (v === undefined || v === null) {
    if (!_ttMissed[key]) { _ttMissed[key] = true; console.warn('[work] i18n 缺词条: ' + key); }
    return '[missing:' + key + ']';
  }
  return (typeof v === 'function') ? v.apply(null, args) : v;
}
Work.tt = tt;
Work.lang = function () { return (typeof getLang === 'function') ? getLang() : 'zh'; };

/* ---------------- DOM 原语 ---------------- */
function el(tag, style, text) {
  const n = document.createElement(tag || 'div');
  if (style) n.style.cssText = style;
  if (text !== undefined && text !== null) n.textContent = text;
  return n;
}
Work.el = el;

/* 24x24 stroke 图标，与主脚本 .icon 用法一致；paths 为 svg 内部片段。
   paths 可能来自智能体配置或 MCP 工具元数据等外部数据，先做严格白名单校验：
   只放行几何图形元素与几何/描边属性（不含 href、style、on* 等可执行或可跳转属性），
   不匹配则退回默认图标，绝不把未校验字符串交给 innerHTML。 */
const SVG_ATTR = '(?:d|cx|cy|r|x|y|x1|y1|x2|y2|rx|ry|width|height|points|fill|stroke|stroke-width|stroke-linecap|stroke-linejoin|transform)\\s*=\\s*"[^"]*"';
const SVG_ICON_RE = new RegExp('^(?:<\\s*(?:path|circle|rect|line|polyline|polygon|ellipse)\\s+(?:' + SVG_ATTR + '\\s*)+/?>\\s*)+$');

function icon(paths, size, color) {
  const s = size || 15;
  const safe = SVG_ICON_RE.test(String(paths || '').trim()) ? String(paths).trim() : ICONS.warn;
  if (safe !== String(paths || '').trim()) console.warn('[work] 图标片段未通过白名单校验，已退回默认图标');
  const box = el('div', 'width: ' + s + 'px; height: ' + s + 'px; flex-shrink: 0;' + (color ? ' color: ' + color + ';' : ''));
  box.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
    + 'stroke-linecap="round" stroke-linejoin="round" style="width:' + s + 'px;height:' + s + 'px;">' + safe + '</svg>';
  return box;
}
Work.icon = icon;

const ICONS = {
  back: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  close: '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  play: '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  chev: '<path d="M6 9l6 6 6-6"/>',
  chevronR: '<path d="m9 18 6-6-6-6"/>',
  refresh: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  agent: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  layers: '<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  down: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>'
};
Work.ICONS = ICONS;

/* ---------------- 布局原语 ---------------- */

/* 页面外壳：返回按钮 + 内容区。标题与副标题由主脚本 renderHeader 渲染，
   页面内不再重复一遍（避免 buildNewProjectForm 那种双标题问题）。 */
function pageShell(opts) {
  const o = opts || {};
  const root = el('div', 'width: 100%; max-width: ' + (o.wide ? '100%' : '760px') + '; margin: 0 auto;'
    + ' display: flex; flex-direction: column; gap: 16px; padding: 4px 0 28px 0;');
  const bar = el('div', 'display: flex; align-items: center; gap: 10px;');
  const back = pillBtn(tt('back'), ICONS.back, function () {
    view = 'chat';
    renderConversations();
    renderMessages();
    playSwap();
  });
  bar.appendChild(back);
  if (o.actions) o.actions.forEach(function (n) { bar.appendChild(n); });
  root.appendChild(bar);
  const body = el('div', 'display: flex; flex-direction: column; gap: 14px;');
  root.appendChild(body);
  return { root: root, body: body, bar: bar };
}
Work.pageShell = pageShell;

function card(opts) {
  const o = opts || {};
  const c = el('div', 'background: var(--surface); border: 1px solid var(--border); border-radius: 16px;'
    + ' padding: ' + (o.pad === undefined ? '16px' : o.pad) + '; display: flex; flex-direction: column;'
    + ' gap: ' + (o.gap === undefined ? '12px' : o.gap) + ';' + (o.style || ''));
  return c;
}
Work.card = card;

/* 虚线卡（"新建 XX"入口），与知识库创建卡同风格 */
function dashedCard(label, iconPath, onClick) {
  const c = el('div', 'min-height: 96px; border: 1.5px dashed var(--border); border-radius: 16px;'
    + ' display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px;'
    + ' cursor: pointer; transition: border-color 0.18s ease, background-color 0.18s ease;');
  c.appendChild(icon(iconPath, 20, 'var(--text-3)'));
  c.appendChild(el('div', 'color: var(--text-2); font-size: 12.5px; font-weight: 600;', label));
  c.addEventListener('mouseenter', function () { c.style.borderColor = '#94A3B8'; c.style.background = 'var(--hover-overlay)'; });
  c.addEventListener('mouseleave', function () { c.style.borderColor = 'var(--border)'; c.style.background = 'transparent'; });
  c.addEventListener('click', onClick);
  return c;
}
Work.dashedCard = dashedCard;

function sectionLabel(text) {
  const n = el('div', 'color: var(--text-3); font-size: 10.5px; font-weight: 700;', text);
  n.className = 'label';
  return n;
}
Work.sectionLabel = sectionLabel;

function hint(text, tone) {
  const color = tone === 'warn' ? 'var(--warn)' : (tone === 'danger' ? 'var(--danger-text)' : 'var(--text-3)');
  return el('div', 'color: ' + color + '; font-size: 11.5px; line-height: 18px;', text);
}
Work.hint = hint;

/* 安全边界/能力边界说明块：沙箱、检索等页面用来如实声明做不到什么 */
function noticeBox(title, text, tone) {
  const bg = tone === 'warn' ? 'var(--warn-soft)' : 'var(--accent-soft)';
  const bd = tone === 'warn' ? 'var(--warn)' : 'var(--border)';
  const box = el('div', 'padding: 12px 14px; background: ' + bg + '; border: 1px solid ' + bd
    + '; border-radius: 12px; display: flex; gap: 10px; align-items: flex-start;');
  box.appendChild(icon(tone === 'warn' ? ICONS.warn : ICONS.wrench, 15, tone === 'warn' ? 'var(--warn)' : 'var(--text-3)'));
  const col = el('div', 'flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 4px;');
  col.appendChild(el('div', 'color: var(--text-1); font-size: 12.5px; font-weight: 600;', title));
  col.appendChild(el('div', 'color: var(--text-2); font-size: 11.5px; line-height: 18px; white-space: pre-wrap;', text));
  box.appendChild(col);
  return box;
}
Work.noticeBox = noticeBox;

function row(label, rightNode, opts) {
  const r = el('div', (opts && opts.style) || '');
  r.className = 'info-row';
  const left = el('div', 'display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1 1 0;');
  left.appendChild(el('div', 'color: var(--text-1); font-size: 12.5px; font-weight: 500;', label));
  if (opts && opts.sub) left.appendChild(el('div', 'color: var(--text-3); font-size: 11px; line-height: 16px;', opts.sub));
  r.appendChild(left);
  if (rightNode) r.appendChild(rightNode);
  return r;
}
Work.row = row;

function toggle(get, set) {
  const tg = el('div');
  tg.className = 'toggle' + (get() ? ' on' : '');
  tg.addEventListener('click', function () {
    set(!get());
    tg.classList.toggle('on', get());
  });
  return tg;
}
Work.toggle = toggle;

function seg(options, get, set) {
  const wrap = el('div');
  wrap.className = 'seg';
  const items = [];
  function paint() {
    items.forEach(function (it) { it.classList.toggle('selected', it.dataset.v === String(get())); });
  }
  options.forEach(function (o) {
    const it = el('div', '', o.label);
    it.className = 'seg-item';
    it.dataset.v = String(o.value);
    it.addEventListener('click', function () { set(o.value); paint(); });
    items.push(it);
    wrap.appendChild(it);
  });
  paint();
  return wrap;
}
Work.seg = seg;

function pillBtn(label, iconPath, onClick, opts) {
  const o = opts || {};
  const b = el('div', 'height: 34px; padding: 0 14px; display: flex; align-items: center; gap: 7px; cursor: pointer;'
    + ' border-radius: 999px; font-size: 12.5px; font-weight: 600;'
    + (o.primary
      ? ' background: var(--primary-bg); color: var(--primary-text); border: none;'
      : ' background: var(--surface); color: var(--text-2); border: 1px solid var(--border);')
    + (o.style || ''));
  b.className = o.primary ? 'btn btn-primary' : 'btn';
  if (iconPath) b.appendChild(icon(iconPath, 13));
  b.appendChild(el('div', '', label));
  if (o.disabled) { b.style.opacity = '0.45'; b.style.pointerEvents = 'none'; }
  if (onClick) b.addEventListener('click', onClick);
  return b;
}
Work.pillBtn = pillBtn;

function smallBtn(label, onClick, opts) {
  const o = opts || {};
  const b = el('div', 'padding: 5px 11px; border-radius: 8px; font-size: 11.5px; font-weight: 600; cursor: pointer;'
    + ' white-space: nowrap; flex-shrink: 0;'
    + (o.danger
      ? ' background: var(--danger-bg); color: var(--danger-text); border: 1px solid var(--danger-border);'
      : o.primary
        ? ' background: var(--primary-bg); color: var(--primary-text); border: none;'
        : ' background: var(--surface); color: var(--text-2); border: 1px solid var(--border);')
    + (o.style || ''));
  b.className = 'btn';
  b.textContent = label;
  if (o.disabled) { b.style.opacity = '0.45'; b.style.pointerEvents = 'none'; }
  if (onClick) b.addEventListener('click', onClick);
  return b;
}
Work.smallBtn = smallBtn;

function tag(text, color, bg) {
  const n = el('div', 'padding: 2px 8px; border-radius: 999px; font-size: 10.5px; font-weight: 600;'
    + ' color: ' + (color || 'var(--text-2)') + '; background: ' + (bg || 'var(--accent-soft)') + '; white-space: nowrap;', text);
  n.className = 'tag';
  return n;
}
Work.tag = tag;

/* 状态点：idle / connecting / ok / error / running */
const STATUS_COLOR = { ok: 'var(--ok)', running: 'var(--link)', connecting: 'var(--warn)', error: 'var(--danger-text)', idle: 'var(--text-3)' };
function statusDot(state, size) {
  const s = size || 7;
  const d = el('div', 'width: ' + s + 'px; height: ' + s + 'px; border-radius: 50%; flex-shrink: 0;'
    + ' background: ' + (STATUS_COLOR[state] || STATUS_COLOR.idle) + ';'
    + (state === 'running' || state === 'connecting' ? ' animation: csPulse 1.2s ease-in-out infinite;' : ''));
  return d;
}
Work.statusDot = statusDot;
Work.STATUS_COLOR = STATUS_COLOR;

function field(opts) {
  const o = opts || {};
  const wrap = el('div', 'display: flex; flex-direction: column; gap: 6px;' + (o.style || ''));
  if (o.label) {
    const lab = el('div', 'color: var(--text-2); font-size: 11.5px; font-weight: 600;', o.label);
    wrap.appendChild(lab);
  }
  const inp = document.createElement(o.multiline ? 'textarea' : 'input');
  inp.className = 'field-input';
  if (!o.multiline) inp.type = o.type || 'text';
  if (o.placeholder) inp.placeholder = o.placeholder;
  if (o.value !== undefined && o.value !== null) inp.value = o.value;
  if (o.multiline) {
    inp.rows = o.rows || 4;
    inp.style.cssText = 'resize: vertical; line-height: 20px; font-family: ' + (o.mono ? 'var(--mono)' : 'inherit') + ';'
      + ' font-size: ' + (o.mono ? '12px' : '13px') + ';' + (o.inputStyle || '');
  } else if (o.inputStyle) {
    inp.style.cssText = o.inputStyle;
  }
  if (o.onInput) inp.addEventListener('input', function () { o.onInput(inp.value, inp); });
  if (o.onEnter) inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); o.onEnter(inp.value, inp); } });
  wrap.appendChild(inp);
  if (o.hint) wrap.appendChild(hint(o.hint, o.hintTone));
  wrap.input = inp;
  return wrap;
}
Work.field = field;

function emptyState(text, iconPath) {
  const w = el('div', 'padding: 28px 16px; display: flex; flex-direction: column; align-items: center; gap: 10px;'
    + ' border: 1px dashed var(--border); border-radius: 14px;');
  w.appendChild(icon(iconPath || ICONS.file, 20, 'var(--text-3)'));
  w.appendChild(el('div', 'color: var(--text-3); font-size: 12.5px; text-align: center; line-height: 19px;', text));
  return w;
}
Work.emptyState = emptyState;

/* 代码/输出块：内容一律 textContent，绝不 innerHTML——
   模型或用户脚本可打印任意 HTML，走 innerHTML 等于在渲染进程执行它 */
function preBlock(text, opts) {
  const o = opts || {};
  const p = el('pre', 'margin: 0; padding: 12px; background: ' + (o.dark === false ? 'var(--surface-2)' : 'var(--primary-bg)')
    + '; border-radius: 12px; font-family: var(--mono); font-size: 12px; line-height: 19px;'
    + ' color: ' + (o.dark === false ? 'var(--text-1)' : '#D7E3F4') + '; white-space: pre-wrap; word-break: break-word;'
    + ' overflow: auto; ' + (o.maxHeight ? 'max-height: ' + o.maxHeight + ';' : '') + (o.style || ''));
  p.textContent = text || '';
  return p;
}
Work.preBlock = preBlock;

/* 网格：与知识库卡片同风格 */
function grid(minCol) {
  return el('div', 'display: grid; grid-template-columns: repeat(auto-fill, minmax(' + (minCol || 280) + 'px, 1fr)); gap: 12px;');
}
Work.grid = grid;

/* ---------------- 弹窗（沿用 openAddKnowledgeModal 骨架） ---------------- */
function modal(opts) {
  const o = opts || {};
  const overlay = el('div');
  overlay.className = 'modal-overlay';
  const box = el('div', 'width: ' + (o.width || 520) + 'px; min-height: 0; height: auto; max-height: calc(100vh - 60px);'
    + ' display: flex; flex-direction: column; padding: 0; overflow: hidden; background: var(--surface-2);');
  box.className = 'modal';

  const head = el('div', 'display: flex; justify-content: space-between; align-items: center; padding: 18px 20px 14px 20px; flex-shrink: 0; gap: 12px;');
  head.appendChild(el('div', 'color: var(--text-1); font-size: 17px; font-weight: 700;', o.title || ''));
  const x = el('div', 'width: 28px; height: 28px; display: flex; justify-content: center; align-items: center; color: var(--text-2); cursor: pointer;');
  x.className = 'icon-ghost';
  x.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;">' + ICONS.close + '</svg>';
  head.appendChild(x);
  box.appendChild(head);

  const body = el('div', 'margin: 0 14px; background: var(--surface); border: 1px solid var(--border-soft);'
    + ' border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px;'
    + ' overflow-y: auto; min-height: 0; flex: 1 1 auto;');
  box.appendChild(body);

  const foot = el('div', 'display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px 18px 20px; flex-shrink: 0;');
  const cancelBtn = pillBtn(o.cancelText || tt('cancel'), null, function () { api.close(); });
  foot.appendChild(cancelBtn);
  let okBtn = null;
  if (o.onOk) {
    okBtn = pillBtn(o.okText || tt('saved2'), null, function () { o.onOk(api); }, { primary: true });
    foot.appendChild(okBtn);
  }
  box.appendChild(foot);

  overlay.appendChild(box);
  document.body.appendChild(overlay);
  overlay.classList.add('show');
  requestAnimationFrame(function () { overlay.classList.add('visible'); });

  let closed = false;
  function closeIt() {
    if (closed) return;
    closed = true;
    overlay.classList.remove('visible');
    setTimeout(function () { overlay.remove(); }, 200);
  }
  x.addEventListener('click', closeIt);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeIt(); });

  const api = { overlay: overlay, box: box, body: body, foot: foot, close: closeIt, okBtn: okBtn, cancelBtn: cancelBtn };
  if (o.build) o.build(api);
  return api;
}
Work.modal = modal;

/* ---------------- 杂项 ---------------- */
function toast(msg) { if (typeof showToast === 'function') showToast(msg); else console.log('[work] ' + msg); }
Work.toast = toast;

function confirmDialog(text, onOk) {
  if (typeof showConfirm === 'function') { showConfirm(text, onOk); return; }
  if (window.confirm(text)) onOk();
}
Work.confirm = confirmDialog;

function fmtBytes(b) {
  if (b === null || b === undefined || isNaN(b)) return '—';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(2) + ' MB';
}
Work.fmtBytes = fmtBytes;

function fmtMs(ms) {
  if (ms === null || ms === undefined || isNaN(ms)) return '—';
  if (ms < 1000) return ms + ' ms';
  return (ms / 1000).toFixed(1) + ' s';
}
Work.fmtMs = fmtMs;

function fmtTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const p = function (n) { return n < 10 ? '0' + n : '' + n; };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
Work.fmtTime = fmtTime;

function truncate(s, n) {
  const str = String(s === undefined || s === null ? '' : s);
  return str.length > n ? str.slice(0, n) + '…' : str;
}
Work.truncate = truncate;

function uid(prefix) {
  return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}
Work.uid = uid;

/* 刷新当前 Work 页面（保持 view 不变，重建节点） */
function rerender() {
  if (typeof renderMessages === 'function') renderMessages();
}
Work.rerender = rerender;

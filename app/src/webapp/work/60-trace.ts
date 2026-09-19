// @ts-nocheck
/* 前端全局脚本层：按字节精确迁移自 JS（见 app/TypeScript迁移说明.md），
   本文件关闭逐行类型检查；环境与第三方库声明见 ambient.d.ts。 */
/* ==================================================================
   60-trace.js · Agent 工作流程时间线（Qoder 式）
   设计：左侧 1px 竖向导轨 + 节点圆点；每个工具调用是一个条目
   （等宽工具名 + 单行摘要 + 右对齐灰耗时），点击展开输入/响应（等宽 pre，
   缩进对齐导轨）。步骤之间用小灰标签分隔。顶部完成汇总条（步骤/工具次数/
   耗时，弱灰非彩色）。无卡片边框堆砌、无彩色 tag。
   数据源：aiMsg._calls / _reasoning / _running / _step（唯一事实）。
   ================================================================== */

function callStateColor(c) {
  if (c.state === 'running') return 'running';
  if (c.state === 'error') return 'error';
  return 'ok';
}

function traceNodeDot(state) {
  const d = Work.el('div', 'position: absolute; left: -3.5px; top: 7px; width: 6px; height: 6px;'
    + ' border-radius: 50%; flex-shrink: 0;'
    + ' background: ' + (state === 'running' ? 'var(--link)' : state === 'error' ? 'var(--danger-text)' : 'var(--text-3)') + ';'
    + (state === 'running' ? ' animation: csPulse 1.2s ease-in-out infinite;' : ''));
  return d;
}

function tracePre(label, text) {
  const box = Work.el('div', 'display: flex; flex-direction: column; gap: 4px;');
  box.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10px; font-weight: 700;'
    + ' letter-spacing: 0.06em; text-transform: uppercase;', label));
  box.appendChild(Work.preBlock(text, { dark: false, maxHeight: '220px' }));
  return box;
}

function traceEntry(c) {
  const state = callStateColor(c);
  const entry = Work.el('div', 'position: relative; padding-left: 16px; border-left: 1px solid var(--border);'
    + ' padding-bottom: 10px;');
  entry.appendChild(traceNodeDot(state));

  /* 头部：工具名 + 耗时 */
  const head = Work.el('div', 'display: flex; align-items: center; gap: 8px; cursor: pointer;'
    + ' border-radius: 6px; padding: 2px 4px; margin-left: -4px; transition: background-color 0.15s ease;');
  if (state === 'running') {
    var sp = Work.el('div', 'width: 12px; height: 12px; color: var(--link); flex-shrink: 0; animation: csSpin 0.9s linear infinite;');
    sp.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" style="width:12px;height:12px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
    head.appendChild(sp);
  }
  head.setAttribute('tabindex', '0');
  head.setAttribute('role', 'button');
  head.addEventListener('mouseenter', function () { head.style.backgroundColor = 'var(--hover-overlay)'; });
  head.addEventListener('mouseleave', function () { head.style.backgroundColor = 'transparent'; });
  const name = Work.el('div', 'color: var(--text-1); font-size: 12px; font-weight: 600; font-family: var(--mono);'
    + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', c.name || 'tool');
  head.appendChild(name);
  if (c.error) head.appendChild(Work.el('div', 'color: var(--danger-text); font-size: 10.5px; flex-shrink: 0;', 'error'));
  head.appendChild(Work.el('div', 'flex: 1 1 0;'));
  if (c.durationMs !== undefined) {
    head.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px; font-family: var(--mono); flex-shrink: 0;', Work.fmtMs(c.durationMs)));
  }
  const chev = Work.el('div', 'width: 11px; height: 11px; color: var(--text-3); flex-shrink: 0;'
    + ' transition: transform 0.2s ease;' + (c._open ? ' transform: rotate(90deg);' : ''));
  chev.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;"><path d="m9 18 6-6-6-6"/></svg>';
  head.appendChild(chev);
  entry.appendChild(head);

  /* 单行摘要 */
  const summary = argSummaryLine(c);
  if (summary) entry.appendChild(Work.el('div', 'color: var(--text-3); font-size: 11px; margin: 2px 0 0 4px;'
    + ' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;', summary));

  /* 展开区：输入 / 响应 */
  const body = Work.el('div', 'display: ' + (c._open ? 'flex' : 'none') + '; flex-direction: column; gap: 8px;'
    + ' margin: 6px 0 0 4px; padding: 10px; background: var(--surface-2); border-radius: 8px;');
  if (c.args) body.appendChild(tracePre('输入', c.args));
  if (c.error) body.appendChild(tracePre('错误', c.error));
  else if (c.result) body.appendChild(tracePre('响应', c.result));
  entry.appendChild(body);

  function toggle() {
    c._open = !c._open;
    body.style.display = c._open ? 'flex' : 'none';
    chev.style.transform = c._open ? 'rotate(90deg)' : 'rotate(0deg)';
  }
  head.addEventListener('click', toggle);
  head.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
  return entry;
}

function argSummaryLine(c) {
  try {
    const o = typeof c.args === 'string' ? JSON.parse(c.args || '{}') : (c.args || {});
    const keys = Object.keys(o);
    if (!keys.length) return '';
    return keys.map(function (k) {
      let v = o[k];
      if (typeof v === 'string') v = v.replace(/\s+/g, ' ');
      else if (Array.isArray(v)) v = '[' + v.length + ']';
      else if (v && typeof v === 'object') v = '{…}';
      return k + '=' + Work.truncate(String(v), 26);
    }).join('  ');
  } catch (e) {
    return Work.truncate(String(c.args || ''), 60);
  }
}

Work.renderTrace = function (m, idx) {
  void idx;
  const calls = (m && m._calls) || [];
  const hasReasoning = !!(m && m._reasoning);
  if (!calls.length && !hasReasoning && !(m && m._running)) return null;

  const wrap = Work.el('div', 'display: flex; flex-direction: column; gap: 0; min-width: 0; width: 100%;');

  /* 顶部完成汇总条（弱灰，非彩色） */
  if (!m._running && calls.length) {
    const steps = new Set(calls.map(function (c) { return c.step || 1; })).size || 1;
    const total = calls.reduce(function (s, c) { return s + (c.durationMs || 0); }, 0);
    wrap.appendChild(Work.el('div', 'color: var(--text-3); font-size: 11px; margin-bottom: 8px;',
      tt('wTraceSummary')
        .replace('{s}', String(steps))
        .replace('{n}', String(calls.length))
        .replace('{t}', Work.fmtMs(total))));
  }

  /* 思考按步骤分段（工具后再次思考 = 新步骤）；无分段数据时回落到全量 */
  const reasonings = (m._reasonings && m._reasonings.length) ? m._reasonings : (m._reasoning ? [m._reasoning] : []);

  /* 组内思考折叠块（默认展开，独立收起） */
  function buildReasoningBlock(step) {
    const rText = reasonings[step - 1] || '';
    if (!rText) return [];
    if (!m._stepReasonOpen) m._stepReasonOpen = {};
    if (m._stepReasonOpen[step] === undefined) m._stepReasonOpen[step] = true;
    const rHead = Work.el('div', 'display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 2px 0 2px 16px;');
    rHead.setAttribute('tabindex', '0');
    const rChev = Work.el('div', 'width: 10px; height: 10px; color: var(--text-3); transition: transform 0.2s ease;'
      + (m._stepReasonOpen[step] ? ' transform: rotate(90deg);' : ''));
    rChev.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px;"><path d="m9 18 6-6-6-6"/></svg>';
    rHead.appendChild(rChev);
    rHead.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10.5px; font-weight: 600;', tt('wTraceThinking')));
    const rBody = Work.el('div', 'display: ' + (m._stepReasonOpen[step] ? 'block' : 'none') + '; color: var(--text-3);'
      + ' font-size: 11px; line-height: 17px; white-space: pre-wrap; margin: 2px 0 4px 26px;'
      + ' max-height: 120px; overflow-y: auto;', Work.truncate(rText, 3000));
    function rToggle() {
      m._stepReasonOpen[step] = !m._stepReasonOpen[step];
      rBody.style.display = m._stepReasonOpen[step] ? 'block' : 'none';
      rChev.style.transform = m._stepReasonOpen[step] ? 'rotate(90deg)' : 'rotate(0deg)';
    }
    rHead.addEventListener('click', rToggle);
    rHead.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); rToggle(); } });
    return [rHead, rBody];
  }

  /* 纯思考回合（无任何工具调用）：保持单一思考折叠块 */
  if (!calls.length) {
    const parts = buildReasoningBlock(1);
    parts.forEach(function (p) { wrap.appendChild(p); });
  } else {
    /* 时间线：按 step 分组——每组 = 步骤头 + 该步思考折叠 + 该步工具卡片，
       「思考阶段及其后续工具调用」视觉上归为一组 */
    if (!m._stepOpen) m._stepOpen = {};
    let lastStep = null;
    var stepRows = {};
    calls.forEach(function (c) {
      const step = c.step || 1;
      if (step !== lastStep) {
        lastStep = step;
        if (m._stepOpen[step] === undefined) m._stepOpen[step] = true;
        var head = Work.el('div', 'display: flex; align-items: center; gap: 6px; margin: 8px 0 2px 0; cursor: pointer; width: fit-content;');
        head.setAttribute('tabindex', '0');
        var ch = Work.el('div', 'width: 10px; height: 10px; color: var(--text-3); transition: transform 0.2s ease;'
          + (m._stepOpen[step] ? ' transform: rotate(90deg);' : ''));
        ch.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" style="width:10px;height:10px;"><path d="m9 18 6-6-6-6"/></svg>';
        head.appendChild(ch);
        head.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;',
          tt('wTraceStep') + ' ' + step));
        head.addEventListener('click', function () {
          m._stepOpen[step] = !m._stepOpen[step];
          ch.style.transform = m._stepOpen[step] ? 'rotate(90deg)' : 'rotate(0deg)';
          (stepRows[step] || []).forEach(function (r2) { r2.style.display = m._stepOpen[step] ? '' : 'none'; });
        });
        head.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); head.click(); } });
        wrap.appendChild(head);
        stepRows[step] = [];
        /* 该步骤的思考折叠（组头之下、工具之上） */
        buildReasoningBlock(step).forEach(function (p) {
          wrap.appendChild(p);
          stepRows[step].push(p);
        });
      }
      var entry = traceEntry(c);
      if (!m._stepOpen[step]) entry.style.display = 'none';
      (stepRows[step] || (stepRows[step] = [])).push(entry);
      wrap.appendChild(entry);
    });

    /* 末段思考（最后一轮工具之后、最终回答之前的思考）：追加为新的步骤组 */
    const lastStepN = lastStep || 1;
    const lastReasonIdx = reasonings.length;
    if (lastReasonIdx > lastStepN) {
      const step = lastReasonIdx;
      if (m._stepOpen[step] === undefined) m._stepOpen[step] = true;
      const head = Work.el('div', 'display: flex; align-items: center; gap: 6px; margin: 8px 0 2px 0; cursor: pointer; width: fit-content;');
      head.setAttribute('tabindex', '0');
      const ch = Work.el('div', 'width: 10px; height: 10px; color: var(--text-3); transition: transform 0.2s ease;'
        + (m._stepOpen[step] ? ' transform: rotate(90deg);' : ''));
      ch.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" style="width:10px;height:10px;"><path d="m9 18 6-6-6-6"/></svg>';
      head.appendChild(ch);
      head.appendChild(Work.el('div', 'color: var(--text-3); font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;',
        tt('wTraceStep') + ' ' + step));
      head.addEventListener('click', function () {
        m._stepOpen[step] = !m._stepOpen[step];
        ch.style.transform = m._stepOpen[step] ? 'rotate(90deg)' : 'rotate(0deg)';
      });
      wrap.appendChild(head);
      buildReasoningBlock(step).forEach(function (p) { wrap.appendChild(p); });
    }
  }

  /* 运行中指示（呼吸点） */
  if (m._running) {
    const run = Work.el('div', 'position: relative; padding-left: 16px; border-left: 1px solid var(--border);'
      + ' padding-bottom: 2px; display: flex; align-items: center; gap: 8px;');
    run.appendChild(traceNodeDot('running'));
    var sp2 = Work.el('div', 'width: 12px; height: 12px; color: var(--link); flex-shrink: 0; animation: csSpin 0.9s linear infinite;');
    sp2.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" style="width:12px;height:12px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
    run.appendChild(sp2);
    const label = Work.el('div', 'color: var(--text-2); font-size: 11px; font-variant-numeric: tabular-nums;', '');
    function paint() {
      var ms = Date.now() - (m._t0 || Date.now());
      var secs = (ms / 1000).toFixed(1);
      label.textContent = tt('wTraceRunning') + ' · ' + tt('wTraceStep') + ' ' + (m._step || 1)
        + ' · ' + tt('wTraceTools') + ' ' + calls.length
        + ' · ' + secs + ' s';
    }
    paint();
    if (m._statusRaf) cancelAnimationFrame(m._statusRaf);
    (function loop() {
      if (!m._running) return;
      paint();
      m._statusRaf = requestAnimationFrame(loop);
    })();
    run.appendChild(label);
    wrap.appendChild(run);
  }

  m._traceNode = wrap;
  return wrap;
};

/* SSE 过程中原地刷新（不重建整行）。
   关键边界：首条 AI 消息构建时 _calls 为空、messageRowExtra 返回 null，轨迹容器
   从未挂载——此时必须整行重建把容器补上。SSE 回调是异步的（不在 renderMessages
   调用栈内），可安全同步重渲染；用 _traceRendering 防重入。重建后把 streaming
   消息的当前正文补渲染回去，避免工具执行期间正文消失。 */
let _traceRendering = false;
Work.traceRefresh = function (m) {
  if (!m) return;
  const node = m._traceNode;
  if (!node || !node.isConnected) {
    if (_traceRendering) return;   /* 重入（理论上不会）：交给下一次刷新 */
    _traceRendering = true;
    try {
      renderMessages();
      if (typeof conversations !== 'undefined' && typeof paintStreaming === 'function') {
        conversations.forEach(function (c) {
          (c.messages || []).forEach(function (m2) {
            if (m2 && m2.streaming && m2.text && m2._traceNode && m2._traceNode.isConnected) {
              const row = m2._traceNode.closest('.msg');
              const el = row && row.querySelector('.ai-text');
              if (el) paintStreaming(el, m2.text);
            }
          });
        });
      }
    } finally {
      _traceRendering = false;
    }
    if (typeof window.csStickScroll === 'function') window.csStickScroll(document.getElementById('chatScroll'));
    return;
  }
  const fresh = Work.renderTrace(m);
  if (fresh) node.replaceChildren.apply(node, Array.prototype.slice.call(fresh.childNodes));
  else node.replaceChildren();
  m._traceNode = node;
  /* trace 卡片增减改变消息区高度：同样走条件置底（在底部时跟随，上滑阅读时停住） */
  if (typeof window.csStickScroll === 'function') window.csStickScroll(document.getElementById('chatScroll'));
};

/* 结束时清计时器并刷新节点（移除运行中指示）。
   run_end / error / aborted 三处都必须调用。 */
Work.traceFinish = function (m) {
  if (!m) return;
  if (m._statusTimer) { clearInterval(m._statusTimer); m._statusTimer = null; }
  if (m._statusRaf) { cancelAnimationFrame(m._statusRaf); m._statusRaf = null; }
  m._running = false;
  Work.traceRefresh(m);
};

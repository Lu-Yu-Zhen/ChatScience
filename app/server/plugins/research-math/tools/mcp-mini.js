#!/usr/bin/env node
/* research-math MCP server（stdio，newline-delimited JSON-RPC 2.0）
   工具：arith_eval —— 精确算术表达式求值（四则/幂/常用函数，安全白名单解析） */
'use strict';

const PATHSAFE = /^[\d\s+\-*/().,%^eE]+$|^(sqrt|abs|sin|cos|tan|log|ln|exp|min|max|pow|round|floor|ceil)\s*\(/;

function evaluate(expr) {
  const cleaned = String(expr || '').replace(/,/g, '').replace(/\^/g, '**').trim();
  if (!cleaned) throw new Error('空表达式');
  /* 白名单字符检查：数字、运算符、括号与允许的函数名 */
  if (!/^[0-9+\-*/().\s*]|^(sqrt|abs|sin|cos|tan|log|ln|exp|min|max|pow|round|floor|ceil)/.test(cleaned)) {
    throw new Error('包含不允许的字符');
  }
  const stripped = cleaned.replace(/(sqrt|abs|sin|cos|tan|log|ln|exp|min|max|pow|round|floor|ceil)\s*\(/g, '(').replace(/π|pi/g, String(Math.PI)).replace(/\be\b/g, String(Math.E));
  if (!/^[\d\s+\-*/().]*$/.test(stripped)) throw new Error('表达式包含未允许内容');
  /* 函数求值：先把函数调用替换为计算结果再整体求值 */
  let js = cleaned.replace(/π|pi/g, '(' + Math.PI + ')').replace(/\be\b/g, String(Math.E));
  const fnNames = ['sqrt', 'abs', 'sin', 'cos', 'tan', 'log', 'ln', 'exp', 'min', 'max', 'pow', 'round', 'floor', 'ceil'];
  /* 逐层解析：手动 tokenize + 递归下降（避免 eval） */
  let i = 0;
  function skipWs() { while (i < js.length && /\s/.test(js[i])) i++; }
  function parseExpr() { let v = parseTerm(); for (;;) { skipWs(); const c = js[i]; if (c === '+') { i++; v += parseTerm(); } else if (c === '-') { i++; v -= parseTerm(); } else return v; } }
  function parseTerm() { let v = parseUnary(); for (;;) { skipWs(); const c = js[i]; if (c === '*') { i++; v *= parseUnary(); } else if (c === '/') { i++; const d = parseUnary(); if (d === 0) throw new Error('除以零'); v /= d; } else return v; } }
  function parseUnary() { skipWs(); if (js[i] === '-') { i++; return -parseUnary(); } if (js[i] === '+') { i++; return parseUnary(); } return parsePow(); }
  function parsePow() { const base = parseAtom(); skipWs(); if (js[i] === '*' && js[i + 1] === '*') { i += 2; return Math.pow(base, parseUnary()); } return base; }
  function parseAtom() {
    skipWs();
    if (js[i] === '(') { i++; const v = parseExpr(); skipWs(); if (js[i] !== ')') throw new Error('括号不配对'); i++; return v; }
    for (const fn of fnNames) {
      if (js.startsWith(fn, i)) {
        i += fn.length; skipWs();
        let arg;
        if (js[i] === '(') { i++; arg = parseExpr(); skipWs(); if (js[i] !== ')') throw new Error('括号不配对'); i++; }
        else arg = parseAtom();
        return applyFn(fn, arg);
      }
    }
    const num = /^\d+(\.\d+)?([eE][+-]?\d+)?/.exec(js.slice(i));
    if (!num) throw new Error('无法解析位置 ' + i + ' 附近：' + js.slice(i, i + 12));
    i += num[0].length;
    return parseFloat(num[0]);
  }
  function applyFn(fn, x) {
    switch (fn) {
      case 'sqrt': return Math.sqrt(x);
      case 'abs': return Math.abs(x);
      case 'sin': return Math.sin(x);
      case 'cos': return Math.cos(x);
      case 'tan': return Math.tan(x);
      case 'log': case 'ln': return Math.log(x);
      case 'exp': return Math.exp(x);
      case 'min': return Math.min(x);
      case 'max': return Math.max(x);
      case 'pow': return Math.pow(x, 2);
      case 'round': return Math.round(x);
      case 'floor': return Math.floor(x);
      case 'ceil': return Math.ceil(x);
      default: throw new Error('未知函数 ' + fn);
    }
  }
  /* 多参数函数（min/max/pow）简化处理：逗号按分隔符只在函数调用内支持 */
  const v = parseExpr();
  skipWs();
  if (i < js.length) throw new Error('尾部无法解析：' + js.slice(i, i + 12));
  if (!isFinite(v)) throw new Error('结果非有限数');
  return v;
}

/* min/max/pow 多参版本：逗号分隔——在 parseAtom 的函数分支里上面的实现只支持单参，
   这里在 evaluate 入口预处理 min(a,b)/max(a,b)/pow(a,b) 为嵌套调用之外单独处理。 */
function evaluateFull(expr) {
  const s = String(expr || '');
  const multi = /^(min|max|pow)\s*\((.*)\)\s*$/s.exec(s.replace(/,/g, ',').trim());
  if (multi) {
    const parts = splitTop(s.slice(s.indexOf('(') + 1, s.lastIndexOf(')')));
    if (parts.length >= 2) {
      const nums = parts.map(function (p) { return evaluate(p); });
      if (multi[1] === 'min') return Math.min.apply(null, nums);
      if (multi[1] === 'max') return Math.max.apply(null, nums);
      if (multi[1] === 'pow') return Math.pow(nums[0], nums[1]);
    }
  }
  return evaluate(s);
}
function splitTop(s) {
  const out = []; let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

const TOOLS = [{
  name: 'arith_eval',
  description: '精确算术表达式求值。支持 + - * / ( ) 幂(**或^)、函数 sqrt/abs/sin/cos/tan/log/ln/exp/round/floor/ceil、常量 pi/π/e。用于交叉核对不等式与恒等式（代入特殊值）。',
  inputSchema: {
    type: 'object',
    properties: { expr: { type: 'string', description: '算术表达式，如 (1+1e-9)==1 的数值验证请直接给出两侧表达式' } },
    required: ['expr']
  }
}];

function callTool(name, args) {
  if (name !== 'arith_eval') throw new Error('未知工具 ' + name);
  const v = evaluateFull(args && args.expr);
  return { ok: true, value: v, repr: repr(v) };
}
function repr(v) {
  if (Number.isInteger(v)) return String(v);
  if (Math.abs(v) < 1e-15 || Math.abs(v) > 1e15) return v.toExponential(12);
  return String(parseFloat(v.toPrecision(14)));
}

/* ---------------- stdio JSON-RPC loop ---------------- */
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (chunk) {
  buf += chunk;
  let idx;
  while ((idx = buf.indexOf('\n')) > -1) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    let msg; try { msg = JSON.parse(line); } catch (e) { continue; }
    handle(msg);
  }
});
process.stdin.on('end', function () { process.exit(0); });

function handle(msg) {
  if (msg.jsonrpc !== '2.0' && msg.id === undefined) return;
  const respond = function (result) {
    if (msg.id === undefined) return;
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: result }) + '\n');
  };
  const fail = function (code, message) {
    if (msg.id === undefined) return;
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, error: { code: code, message: message } }) + '\n');
  };
  try {
    if (msg.method === 'initialize') {
      respond({ protocolVersion: (msg.params && msg.params.protocolVersion) || '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'research-math-tools', version: '1.0.0' } });
    } else if (msg.method === 'tools/list') {
      respond({ tools: TOOLS });
    } else if (msg.method === 'tools/call') {
      const name = msg.params && msg.params.name;
      const args = (msg.params && msg.params.arguments) || {};
      try {
        const out = callTool(name, args);
        respond({ content: [{ type: 'text', text: JSON.stringify(out) }], isError: false });
      } catch (e) {
        respond({ content: [{ type: 'text', text: 'error: ' + e.message }], isError: true });
      }
    } else if (msg.method === 'ping') {
      respond({});
    } else if (/^notifications\//.test(msg.method)) {
      /* 通知：不回包 */
    } else {
      fail(-32601, 'method not found: ' + msg.method);
    }
  } catch (e) { fail(-32603, e.message); }
}

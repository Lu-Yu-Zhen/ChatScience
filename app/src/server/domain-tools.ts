/* ==================================================================
   domain-tools.ts · 领域插件的 in-process MCP 工具实现
   背景：插件 .mcp.json 的 stdio server 依赖外部 node 运行时与 CLI 变量展开，
   实测未可靠启动；改为宿主 in-process 注册（与 chatscience 同通道，实测可靠）。
   插件目录的 tools.json 声明 server 名与工具清单（宿主按名构建并挂白名单），
   configSchema.json/config.json 提供领域默认参数（buildDomainServer 的 cfg 注入）。
   ================================================================== */
import { z } from 'zod';
import type { McpServerConfig } from '../shared/qoder-sdk';

type SdkModule = import('../shared/qoder-sdk').QoderSdkModule;
type Cfg = Record<string, unknown>;
function num(v: unknown, fallback: number): number { const n = Number(v); return isFinite(n) ? n : fallback; }
function ok(v: unknown) { return { content: [{ type: 'text' as const, text: JSON.stringify(v) }], isError: false as const }; }
function fail(e: unknown) { return { content: [{ type: 'text' as const, text: 'error: ' + (e as Error).message }], isError: true as const }; }

/* ================ research-math ================ */

/* 精确分数（BigInt）：frac_eval / matrix_det 共用 */
interface Frac { n: bigint; d: bigint }
function gcdBig(a: bigint, b: bigint): bigint { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { const t = a % b; a = b; b = t; } return a || 1n; }
function mkFrac(n: bigint, d: bigint): Frac {
  if (d === 0n) throw new Error('分母为零');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcdBig(n, d);
  return { n: n / g, d: d / g };
}
function parseFracToken(s: string): Frac {
  const t = s.trim();
  const m = /^(-?\d+)\/(\d+)$/.exec(t);
  if (m) return mkFrac(BigInt(m[1]), BigInt(m[2]));
  if (/^-?\d+$/.test(t)) return mkFrac(BigInt(t), 1n);
  const dm = /^(-?\d+)\.(\d+)$/.exec(t);
  if (dm) return mkFrac(BigInt(dm[1] + dm[2]), 10n ** BigInt(dm[2].length) * (dm[1].startsWith('-') ? -1n : 1n));
  throw new Error('无法解析数字: ' + s);
}
function fAdd(a: Frac, b: Frac): Frac { return mkFrac(a.n * b.d + b.n * a.d, a.d * b.d); }
function fSub(a: Frac, b: Frac): Frac { return mkFrac(a.n * b.d - b.n * a.d, a.d * b.d); }
function fMul(a: Frac, b: Frac): Frac { return mkFrac(a.n * b.n, a.d * b.d); }
function fDiv(a: Frac, b: Frac): Frac { if (b.n === 0n) throw new Error('除以零'); return mkFrac(a.n * b.d, a.d * b.n); }
function fPow(a: Frac, e: number): Frac {
  if (!Number.isInteger(e)) throw new Error('分数幂仅支持整数指数');
  const abs = e < 0 ? -e : e;
  let r = mkFrac(1n, 1n);
  for (let i = 0; i < abs; i++) r = fMul(r, a);
  return e < 0 ? mkFrac(r.d, r.n) : r;
}
function fracEvalExpr(expr: string): { fraction: string; decimal: string; mixed?: string } {
  const js = String(expr || '').replace(/\^/g, '**').replace(/π|pi/gi, '3.141592653589793 /*非精确*/');
  if (js.indexOf('/*非精确*/') > -1) throw new Error('分数求值不含 π/pi（无理数），请改用 arith_eval');
  let i = 0;
  function skipWs() { while (i < js.length && /\s/.test(js[i])) i++; }
  function parseExpr(): Frac { let v = parseTerm(); for (;;) { skipWs(); const c = js[i]; if (c === '+') { i++; v = fAdd(v, parseTerm()); } else if (c === '-') { i++; v = fSub(v, parseTerm()); } else return v; } }
  function parseTerm(): Frac { let v = parsePow(); for (;;) { skipWs(); const c = js[i]; if (c === '*') { i++; v = fMul(v, parsePow()); } else if (c === '/') { i++; v = fDiv(v, parsePow()); } else return v; } }
  function parsePow(): Frac { const b = parseAtom(); skipWs(); if (js[i] === '*' && js[i + 1] === '*') { i += 2; skipWs(); const e = parseAtom(); if (e.d !== 1n) throw new Error('分数幂仅支持整数指数'); return fPow(b, Number(e.n)); } return b; }
  function parseAtom(): Frac {
    skipWs();
    if (js[i] === '(') { i++; const v = parseExpr(); skipWs(); if (js[i] !== ')') throw new Error('括号不配对'); i++; return v; }
    if (js[i] === '-') { i++; const v = parseAtom(); return { n: -v.n, d: v.d }; }
    if (js[i] === '+') { i++; return parseAtom(); }
    const tok = /^(\d+(?:\.\d+)?(?:\/\d+)?)/.exec(js.slice(i));
    if (!tok) throw new Error('无法解析位置 ' + i + ' 附近：' + js.slice(i, i + 12));
    i += tok[0].length;
    return parseFracToken(tok[0]);
  }
  const v = parseExpr();
  skipWs();
  if (i < js.length) throw new Error('尾部无法解析：' + js.slice(i, i + 12));
  /* decimal：长除法取 decimal_digits 位 */
  const digits = 12;
  let neg = v.n < 0n;
  let an = neg ? -v.n : v.n;
  const intPart = an / v.d;
  let rem = an % v.d;
  let dec = '';
  for (let k = 0; k < digits && rem !== 0n; k++) { rem *= 10n; dec += (rem / v.d).toString(); rem = rem % v.d; }
  let mixed: string | undefined;
  if (v.d !== 1n && an > v.d) mixed = (neg ? '-' : '') + intPart.toString() + ' 又 ' + (an - intPart * v.d) + '/' + v.d;
  return {
    fraction: v.d === 1n ? v.n.toString() : (neg ? '-' : '') + an.toString() + '/' + v.d.toString(),
    decimal: (neg && intPart === 0n ? '-' : '') + intPart.toString() + (dec ? '.' + dec : '') + (rem !== 0n ? '…' : ''),
    mixed: mixed
  };
}

function fracEval(args: { expr: string }) {
  const r = fracEvalExpr(args.expr);
  return Object.assign({ ok: true }, r);
}

/* matrix_det：分数高斯消元（≤8×8），精确行列式/秩 */
function matrixDet(args: { matrix: (number | string)[][] }) {
  const m = args.matrix;
  if (!Array.isArray(m) || !m.length || m.length > 8) throw new Error('matrix 需为 1~8 行的二维数组');
  const n = m.length;
  const rows: Frac[][] = m.map(function (row) {
    if (!Array.isArray(row) || row.length !== n) throw new Error('需为 ' + n + '×' + n + ' 方阵');
    return row.map(function (x) { return parseFracToken(String(x)); });
  });
  let det = mkFrac(1n, 1n);
  let rank = 0;
  const steps: string[] = [];
  for (let col = 0; col < n; col++) {
    let piv = -1;
    for (let r = rank; r < n; r++) { if (rows[r][col].n !== 0n) { piv = r; break; } }
    if (piv === -1) continue;
    if (piv !== rank) { const t = rows[piv]; rows[piv] = rows[rank]; rows[rank] = t; det = mkFrac(-det.n, det.d); steps.push('交换 R' + piv + '↔R' + rank); }
    det = fMul(det, rows[rank][col]);
    for (let r = rank + 1; r < n; r++) {
      if (rows[r][col].n === 0n) continue;
      const f = fDiv(rows[r][col], rows[rank][col]);
      for (let c = col; c < n; c++) rows[r][c] = fSub(rows[r][c], fMul(f, rows[rank][c]));
      steps.push('R' + r + ' -= ' + fracStr(f) + '×R' + rank);
    }
    rank++;
  }
  if (rank < n) det = mkFrac(0n, 1n);
  return { ok: true, determinant: fracStr(det), numeric: Number(BigInt(det.n)) / Number(BigInt(det.d)), rank: rank, invertible: rank === n && det.n !== 0n, elimination: steps };
}
function fracStr(f: Frac): string { return f.d === 1n ? f.n.toString() : f.n.toString() + '/' + f.d.toString(); }

/* ================ research-ai ================ */

function tokenBudget(args: { datasetTokens: number; batchSize?: number; seqLen?: number; epochs?: number; tokensPerSeq?: number; throughputTokensPerSec?: number }, cfg: Cfg) {
  const datasetTokens = Number(args.datasetTokens);
  if (!(datasetTokens > 0)) throw new Error('datasetTokens 必须为正数');
  const seqLen = Math.max(1, num(args.seqLen, num(cfg.default_seq_len, 2048)));
  const batch = Math.max(1, num(args.batchSize, 8));
  const epochs = Math.max(1, num(args.epochs, 1));
  const tps = num(args.throughputTokensPerSec, num(cfg.default_throughput_tps, 30000));
  const stepsPerEpoch = Math.ceil(datasetTokens / (batch * seqLen));
  const totalTokens = datasetTokens * epochs;
  const totalSteps = stepsPerEpoch * epochs;
  const hours = totalTokens / tps / 3600;
  return {
    ok: true,
    datasetTokens: datasetTokens,
    tokensPerSeq: seqLen,
    batchSize: batch,
    seqsPerStep: batch,
    tokensPerStep: batch * seqLen,
    stepsPerEpoch: stepsPerEpoch,
    totalTokens: totalTokens,
    totalSteps: totalSteps,
    estHours: Number(hours.toFixed(1)),
    estDays: Number((hours / 24).toFixed(2)),
    assumptions: '吞吐按 ' + tps + ' tokens/s（A100 级 bf16 经验值）；实际受数据加载/ checkpoint 影响 ±30%'
  };
}

/* data_profile：CSV / JSONL 数据画像（前 5000 行） */
function dataProfile(args: { text: string; format?: string }) {
  const text = String(args.text || '').trim();
  if (!text) throw new Error('text 为空');
  const fmt = String(args.format || 'auto').toLowerCase();
  const lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
  let isJsonl = fmt === 'jsonl';
  if (fmt === 'auto') {
    isJsonl = lines[0].trim()[0] === '{';
  }
  const MAX = 5000;
  const sample = lines.slice(0, MAX);
  const fields: string[] = [];
  const stat: Record<string, { types: Record<string, number>; missing: number; min?: number; max?: number; sum?: number; n?: number; top?: Record<string, number> }> = {};
  function ensure(f: string) { if (!stat[f]) { stat[f] = { types: {}, missing: 0, top: {} }; if (fields.indexOf(f) === -1) fields.push(f); } }
  function typeOf(v: unknown): string { if (v === null || v === undefined || v === '') return 'missing'; if (typeof v === 'number' || (!isNaN(Number(v)) && String(v).trim() !== '')) return 'number'; if (typeof v === 'boolean' || v === 'true' || v === 'false') return 'bool'; return 'string'; }
  function acc(f: string, raw: unknown) {
    ensure(f);
    const st = stat[f];
    const t = typeOf(raw);
    st.types[t] = (st.types[t] || 0) + 1;
    if (t === 'missing') { st.missing++; return; }
    if (t === 'number') { const x = Number(raw); st.min = st.min === undefined ? x : Math.min(st.min, x); st.max = st.max === undefined ? x : Math.max(st.max, x); st.sum = (st.sum || 0) + x; st.n = (st.n || 0) + 1; }
    if (t === 'string' || t === 'bool') { const sv = String(raw); st.top![sv] = (st.top![sv] || 0) + 1; }
  }
  if (isJsonl) {
    sample.forEach(function (line) {
      try {
        const obj = JSON.parse(line);
        Object.keys(obj).forEach(function (k) { acc(k, obj[k]); });
      } catch (e) { acc('<parse_error>', line.slice(0, 30)); }
    });
  } else {
    const delim = (sample[0].match(/\t/g) || []).length > (sample[0].match(/,/g) || []).length ? '\t' : ',';
    const header = sample[0].split(delim).map(function (s) { return s.trim().replace(/^"|"$/g, ''); });
    header.forEach(ensure);
    sample.slice(1).forEach(function (line) {
      const cols = line.split(delim);
      header.forEach(function (h, idx) { acc(h, cols[idx] === undefined ? '' : cols[idx].trim().replace(/^"|"$/g, '')); });
    });
  }
  const out: Record<string, unknown> = {
    ok: true,
    format: isJsonl ? 'jsonl' : 'csv/tsv',
    sampledLines: sample.length,
    totalLines: lines.length,
    truncated: lines.length > MAX,
    fields: fields.map(function (f) {
      const st = stat[f];
      const total = sample.length;
      const types = Object.keys(st.types).sort(function (a, b) { return st.types[b] - st.types[a]; }).map(function (t) { return t + ':' + st.types[t]; }).join('/');
      const col: Record<string, unknown> = { field: f, types: types, missingPct: Number((st.missing / total * 100).toFixed(1)) };
      if (st.n) { col.min = st.min; col.max = st.max; col.mean = Number((st.sum! / st.n).toFixed(4)); }
      if (st.top && Object.keys(st.top).length && Object.keys(st.top).length <= 12) {
        col.frequent = Object.keys(st.top).sort(function (a, b) { return st.top![b] - st.top![a]; }).slice(0, 3).map(function (v) { return v + '(' + st.top![v] + ')'; });
      }
      return col;
    })
  };
  return out;
}

/* ================ research-robotics ================ */

function torqueEstimate(a: { massKg: number; armM: number; joints?: number; dynamicFactor?: number; ratedNm?: number }, cfg: Cfg) {
  const G = 9.81;
  const massKg = Number(a.massKg);
  const armM = Number(a.armM);
  if (!(massKg > 0)) throw new Error('massKg 必须为正数');
  if (!(armM >= 0)) throw new Error('armM 不能为负');
  const joints = Math.max(1, Math.min(12, Number(a.joints || 1)));
  const dynamicFactor = num(a.dynamicFactor, num(cfg.default_dynamic_factor, 1.5));
  const safety = num(cfg.safety_margin, 2.0);
  const gravityTorque = massKg * G * armM;
  const peak = gravityTorque * dynamicFactor;
  const rated = Number(a.ratedNm || 0);
  const out: Record<string, unknown> = {
    ok: true,
    gravityTorqueNm: Number(gravityTorque.toFixed(2)),
    peakEstimateNm: Number(peak.toFixed(2)),
    perJointShareNm: Number((peak / joints).toFixed(2)),
    recommendedRatedNm: Number((peak / joints * safety).toFixed(2)),
    inputs: '质量 ' + massKg + 'kg × 力臂 ' + armM + 'm × g=' + G + '，动态系数 ' + dynamicFactor + '（安全系数 ' + safety + '），均摊到 ' + joints + ' 个关节'
  };
  if (rated > 0) {
    out.ratedNm = rated;
    out.marginRatio = Number((rated / (peak / joints)).toFixed(2));
    out.verdict = (out.marginRatio as number) >= safety ? '裕度充足（≥' + safety + ' 倍）' : ((out.marginRatio as number) >= 1.5 ? '可用但偏紧，建议实测验证' : '不足：需更大减速比/更高规格执行器/减载');
  } else {
    out.note = '提供 ratedNm（电机额定力矩）可计算裕度系数';
  }
  return out;
}

/* urdf_check：URDF XML 结构核查（正则解析，聚焦高频错误） */
function urdfCheck(args: { urdf: string }) {
  const u = String(args.urdf || '');
  if (!u.trim()) throw new Error('urdf 为空');
  const problems: Array<{ level: string; where: string; msg: string }> = [];
  const linkRe = /<link\s+name="([^"]+)"([\s\S]*?)<\/link>/g;
  const links: Record<string, { hasInertial: boolean; mass?: number; inertia?: Record<string, number> }> = {};
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(u))) {
    const name = m[1];
    const body = m[2];
    const hasInertial = /<inertial>/.test(body);
    const item: { hasInertial: boolean; mass?: number; inertia?: Record<string, number> } = { hasInertial: hasInertial };
    const massM = /<mass\s+value="([^"]+)"/.exec(body);
    if (massM) item.mass = Number(massM[1]);
    const inertia: Record<string, number> = {};
    ['ixx', 'ixy', 'ixz', 'iyy', 'iyz', 'izz'].forEach(function (k) {
      const km = new RegExp(k + '="([^"]+)"').exec(body);
      if (km) inertia[k] = Number(km[1]);
    });
    if (Object.keys(inertia).length) item.inertia = inertia;
    links[name] = item;
  }
  if (!Object.keys(links).length) throw new Error('未解析到任何 <link>：检查是否为合法 URDF 片段');
  Object.keys(links).forEach(function (name) {
    const L = links[name];
    if (!L.hasInertial && !/base|world|footprint/i.test(name)) problems.push({ level: 'fatal', where: 'link ' + name, msg: '缺少 <inertial>：仿真按零质量处理，动力学易发散' });
    if (L.mass !== undefined && L.mass <= 0) problems.push({ level: 'fatal', where: 'link ' + name, msg: 'mass=' + L.mass + ' ≤ 0' });
    if (L.inertia && L.inertia.ixx !== undefined) {
      const i = L.inertia;
      if (i.ixx + i.iyy < i.izz || i.ixx + i.izz < i.iyy || i.iyy + i.izz < i.ixx) problems.push({ level: 'fatal', where: 'link ' + name, msg: '惯性张量违反三角不等式（物理不合理）' });
      if (i.ixx <= 0 || i.iyy <= 0 || i.izz <= 0) problems.push({ level: 'fatal', where: 'link ' + name, msg: '主惯量为非正值' });
    }
  });
  const jointRe = /<joint\s+name="([^"]+)"\s+type="([^"]+)"([\s\S]*?)<\/joint>/g;
  const children: Record<string, string> = {};
  const types: Record<string, string> = {};
  while ((m = jointRe.exec(u))) {
    const jn = m[1], jt = m[2], body = m[3];
    types[jn] = jt;
    const pm = /<parent\s+link="([^"]+)"/.exec(body);
    const cm = /<child\s+link="([^"]+)"/.exec(body);
    if (!pm || !cm) { problems.push({ level: 'fatal', where: 'joint ' + jn, msg: '缺少 parent/child 声明' }); continue; }
    if (children[cm[1]]) problems.push({ level: 'fatal', where: 'joint ' + jn, msg: 'child link "' + cm[1] + '" 已被 joint ' + children[cm[1]] + ' 占用（URDF 必须是树）' });
    children[cm[1]] = jn;
    if (!links[pm[1]]) problems.push({ level: 'fatal', where: 'joint ' + jn, msg: 'parent link "' + pm[1] + '" 未定义' });
    if (!links[cm[1]]) problems.push({ level: 'fatal', where: 'joint ' + jn, msg: 'child link "' + cm[1] + '" 未定义' });
    if (['revolute', 'prismatic', 'continuous'].indexOf(jt) > -1 && !/<limit/.test(body)) problems.push({ level: 'warn', where: 'joint ' + jn, msg: '运动关节缺 <limit>（effort/velocity 上限）——Gazebo/MuJoCo 行为未定义' });
    if (['fixed', 'floating', 'planar'].indexOf(jt) === -1) problems.push({ level: 'warn', where: 'joint ' + jn, msg: '未知关节类型 "' + jt + '"' });
  }
  Object.keys(links).forEach(function (name) {
    if (!children[name] && !/base|world|footprint/i.test(name)) problems.push({ level: 'warn', where: 'link ' + name, msg: '没有任何 joint 以它为 child（孤立连杆或应作为根）' });
  });
  const fatal = problems.filter(function (p) { return p.level === 'fatal'; });
  return {
    ok: true,
    links: Object.keys(links).length,
    joints: Object.keys(types).length,
    rootCandidate: Object.keys(links).filter(function (n) { return !children[n]; }),
    problemCount: problems.length,
    fatalCount: fatal.length,
    problems: problems.slice(0, 40),
    note: '正则级解析（聚焦高频错误）；完整语义校验请配合 check_urdf 工具'
  };
}

/* dh_transform：标准 DH 表 → 逐关节齐次变换与末端位姿 */
function dhTransform(args: { dh: number[][]; unit?: string }) {
  const rows = args.dh;
  if (!Array.isArray(rows) || !rows.length || rows.length > 6) throw new Error('dh 需为 1~6 行的 [theta, d, a, alpha] 数组');
  const deg = String(args.unit || 'rad').toLowerCase() === 'deg';
  const toRad = function (x: number) { return deg ? x * Math.PI / 180 : x; };
  /* 4×4 齐次矩阵相乘（A·B） */
  const matMul = function (A: number[][], B: number[][]): number[][] {
    const out: number[][] = [];
    for (let i = 0; i < 4; i++) {
      out.push([0, 0, 0, 0]);
      for (let j = 0; j < 4; j++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += A[i][k] * B[k][j];
        out[i][j] = Number(s.toFixed(6));
      }
    }
    return out;
  };
  /* T 为累积位姿：从基座开始逐行右乘单关节变换；perJoint 仍存单关节矩阵。
     曾经这里把 T 直接覆盖为单关节矩阵，多关节时末端位姿只等于最后一行——已修。 */
  let T: number[][] = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
  const per: string[] = [];
  rows.forEach(function (r, idx) {
    if (!Array.isArray(r) || r.length !== 4) throw new Error('第 ' + (idx + 1) + ' 行需为 [theta, d, a, alpha]');
    const th = toRad(Number(r[0])), d = Number(r[1]), a = Number(r[2]), al = toRad(Number(r[3]));
    const ct = Math.cos(th), st = Math.sin(th), ca = Math.cos(al), sa = Math.sin(al);
    /* 标准 DH：T_i = Rz(θ)·Tz(d)·Tx(a)·Rx(α)。
       曾经这里把矩阵按 [ct·ca, -st, ct·sa; …; -sa, 0, ca] 手工拼装，等价于把
       扭转角 α 作用到了 Y 轴（Ry）而非 X 轴（Rx）——与注释公式不符，α≠0 时
       单关节旋转即错，多关节累积后位置与姿态全错。现按公式连乘的标准结果：
         [[ cθ,        -sθ·cα,        sθ·sα,       a·cθ ],
          [ sθ,         cθ·cα,       -cθ·sα,       a·sθ ],
          [ 0,          sα,           cα,          d    ],
          [ 0,          0,            0,           1    ]] */
    const Ti = [
      [ct, -st * ca, st * sa, a * ct],
      [st, ct * ca, -ct * sa, a * st],
      [0, sa, ca, d],
      [0, 0, 0, 1]
    ].map(function (row) { return row.map(function (x) { return Number(x.toFixed(6)); }); });
    T = matMul(T, Ti);
    per.push('T' + (idx + 1) + '=[' + Ti.map(function (row) { return row.join(' '); }).join(' | ') + ']');
  });
  const px = T[0][3], py = T[1][3], pz = T[2][3];
  /* ZYX 欧拉（RPY）反解。万向锁（pitch=±90°）处 R[2][1]=R[2][2]=0，
     atan2(0,0)=0 会给出不能重建原矩阵的 (0,±90,0)——按常规约定取 roll=0，
     yaw 由矩阵元素解算：sp=∓1 且 r=0 时 R[0][1]=-sin(yaw)、R[1][1]=cos(yaw)。 */
  const r2d = 180 / Math.PI;
  const pitch = Math.asin(Math.max(-1, Math.min(1, -T[2][0])));
  let roll: number, yaw: number;
  if (Math.abs(T[2][0]) > 0.999999) {
    roll = 0;
    yaw = Math.atan2(-T[0][1], T[1][1]);
  } else {
    roll = Math.atan2(T[2][1], T[2][2]);
    yaw = Math.atan2(T[1][0], T[0][0]);
  }
  return {
    ok: true,
    convention: '标准 DH：T=Rz(θ)Tz(d)Tx(a)Rx(α)' + (deg ? '，角度输入已按度转弧度' : ''),
    perJoint: per,
    endEffector: { position: [px, py, pz], rpyDeg: [Number((roll * r2d).toFixed(2)), Number((pitch * r2d).toFixed(2)), Number((yaw * r2d).toFixed(2))] }
  };
}

/* ================ in-process server 构建 ================ */
export function buildDomainServer(sdk: SdkModule, serverKey: string, toolNames: string[], cfg?: Cfg): McpServerConfig {
  const c = cfg || {};
  const { tool, createSdkMcpServer } = sdk;
  const all: Record<string, unknown> = {
    /* ---- research-math ---- */
    arith_eval: tool(
      'arith_eval',
      '精确算术表达式求值（双精度浮点）。支持 + - * / ( ) 幂(**或^)、函数 sqrt/abs/sin/cos/tan/log/ln/exp/round/floor/ceil、常量 pi/π/e。需要精确分数/无浮点误差时改用 frac_eval。',
      { expr: z.string().describe('算术表达式，如 sqrt(2)**2-2') },
      async function (args) {
        try {
          const js = String((args as { expr: string }).expr || '').replace(/\^/g, '**').replace(/π|pi/gi, '(' + Math.PI + ')').replace(/\be\b/g, String(Math.E));
          let i = 0;
          const FN = ['sqrt', 'abs', 'sin', 'cos', 'tan', 'log', 'ln', 'exp', 'round', 'floor', 'ceil'];
          function ws() { while (i < js.length && /\s/.test(js[i])) i++; }
          function ex(): number { let v = tm(); for (;;) { ws(); const c = js[i]; if (c === '+') { i++; v += tm(); } else if (c === '-') { i++; v -= tm(); } else return v; } }
          function tm(): number { let v = un(); for (;;) { ws(); const c = js[i]; if (c === '*') { i++; if (js[i] === '*') { i++; v = Math.pow(v, un()); } else v *= un(); } else if (c === '/') { i++; const d = un(); if (d === 0) throw new Error('除以零'); v /= d; } else return v; } }
          function un(): number { ws(); if (js[i] === '-') { i++; return -un(); } if (js[i] === '+') { i++; return un(); } return at(); }
          function pw(b: number): number { ws(); if (js[i] === '*' && js[i + 1] === '*') { i += 2; return Math.pow(b, un()); } return b; }
          function at(): number {
            ws();
            if (js[i] === '(') { i++; const v = ex(); ws(); if (js[i] !== ')') throw new Error('括号不配对'); i++; return pw(v); }
            for (const f of FN) {
              if (js.startsWith(f, i)) { i += f.length; ws(); if (js[i] !== '(') throw new Error(f + ' 需要括号'); i++; const a = ex(); ws(); if (js[i] !== ')') throw new Error('括号不配对'); i++; return pw(applyFn(f, a)); }
            }
            const m = /^\d+(\.\d+)?([eE][+-]?\d+)?/.exec(js.slice(i));
            if (!m) throw new Error('无法解析：' + js.slice(i, i + 12));
            i += m[0].length;
            return pw(parseFloat(m[0]));
          }
          function applyFn(f: string, x: number): number { return ({ sqrt: Math.sqrt, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log, ln: Math.log, exp: Math.exp, round: Math.round, floor: Math.floor, ceil: Math.ceil } as Record<string, (x: number) => number>)[f](x); }
          const v = ex();
          ws();
          if (i < js.length) throw new Error('尾部无法解析：' + js.slice(i, i + 12));
          if (!isFinite(v)) throw new Error('结果非有限数');
          const repr = Number.isInteger(v) ? String(v) : (Math.abs(v) < 1e-15 || Math.abs(v) > 1e15 ? v.toExponential(12) : String(parseFloat(v.toPrecision(14))));
          return ok({ ok: true, value: v, repr: repr });
        } catch (e) { return fail(e); }
      },
      { annotations: { readOnlyHint: true } }
    ),
    frac_eval: tool(
      'frac_eval',
      '精确有理数运算（BigInt 分数，无浮点误差）。支持整数/小数/分数 a/b、+ - * / ( )、整数次幂 **。用于恒等式验证、比例计算、需要「精确等于」结论的场合。不支持无理数（π/√）与函数。',
      { expr: z.string().describe('分数表达式，如 (3/4 + 1/6) * 2 或 7/8 或 0.125' ) },
      async function (args) { try { return ok(fracEval(args as { expr: string })); } catch (e) { return fail(e); } },
      { annotations: { readOnlyHint: true } }
    ),
    matrix_det: tool(
      'matrix_det',
      '小方阵（≤8×8）精确行列式/秩/可逆性判定：分数高斯消元（无浮点误差），整数或分数元素。适合符号性结论（det 是否为零、矩阵是否可逆）。',
      { matrix: z.array(z.array(z.union([z.number(), z.string()]))).describe('二维方阵，元素为数字或 "a/b" 分数字符串') },
      async function (args) { try { return ok(matrixDet(args as { matrix: (number | string)[][] })); } catch (e) { return fail(e); } },
      { annotations: { readOnlyHint: true } }
    ),
    /* ---- research-ai ---- */
    gpu_mem_estimate: tool(
      'gpu_mem_estimate',
      '估算模型训练/推理所需显存：按参数量、精度、批次、序列长度给出权重/梯度/优化器状态/KV cache 分解与单卡放几张的建议。默认值可被插件 config.json 覆盖。',
      {
        paramsB: z.number().describe('参数量（十亿），如 7'),
        precision: z.string().optional().describe('fp32/bf16/fp16/int8/int4，默认 bf16'),
        batch: z.number().optional().describe('batch size，默认 1'),
        seqLen: z.number().optional().describe('序列长度，默认取插件配置'),
        hidden: z.number().optional().describe('隐藏维度，默认取插件配置'),
        mode: z.string().optional().describe('train 或 infer，默认 train'),
        trainableB: z.number().optional().describe('可训练参数量（十亿），微调场景给（如 LoRA 0.1）；缺省=全量')
      },
      async function (args) {
        try {
          const a = args as { paramsB: number; precision?: string; batch?: number; seqLen?: number; hidden?: number; mode?: string; trainableB?: number };
          const paramsB = Number(a.paramsB);
          const precision = String(a.precision || 'bf16');
          const batch = Math.max(1, num(a.batch, 1));
          const seqLen = Math.max(1, num(a.seqLen, num(c.default_seq_len, 2048)));
          const hidden = Math.max(1, num(a.hidden, num(c.default_hidden, 4096)));
          const mode = String(a.mode || 'train');
          const bytesPer = ({ fp32: 4, bf16: 2, fp16: 2, int8: 1, int4: 0.5 } as Record<string, number>)[precision];
          if (!bytesPer) throw new Error('precision 支持 fp32/bf16/fp16/int8/int4');
          if (!isFinite(paramsB) || paramsB <= 0) throw new Error('paramsB 必须为正数');
          const gb = 1024 * 1024 * 1024;
          const weightsGb = paramsB * 1e9 * bytesPer / gb;
          let msg: string, totalGb: number;
          if (mode === 'infer') {
            const layers = Math.max(1, Math.round(hidden / 128));
            const kvGb = 2 * layers * seqLen * batch * hidden * bytesPer / gb;
            totalGb = weightsGb + kvGb + 0.5;
            msg = '权重 ' + weightsGb.toFixed(1) + 'GB + KV cache ≈' + kvGb.toFixed(1) + 'GB + 余量 0.5GB';
          } else {
            const trainable = a.trainableB === undefined ? paramsB : Number(a.trainableB);
            const gradGb = trainable * 1e9 * bytesPer / gb;
            const optimGb = trainable * 1e9 * 8 / gb;
            const actGb = batch * seqLen * hidden * bytesPer * 12 / gb;
            totalGb = weightsGb + gradGb + optimGb + actGb;
            msg = '权重 ' + weightsGb.toFixed(1) + ' + 梯度 ' + gradGb.toFixed(1) + ' + Adam 状态 ' + optimGb.toFixed(1) + ' + 激活 ≈' + actGb.toFixed(1) + '（GB，经验估算）';
          }
          const gpu: Record<string, number> = {};
          ([['A100 80G', 80], ['A100 40G', 40], ['RTX 4090 24G', 24], ['RTX 3090 24G', 24]] as Array<[string, number]>).forEach(function (g) { gpu[g[0]] = Math.ceil(totalGb / g[1]); });
          return ok({ ok: true, totalGb: Number(totalGb.toFixed(1)), breakdown: msg, sameBatchAcrossGpus: gpu, note: '训练估算含激活经验系数，多卡并行/ZeRO 会显著改变分布，仅作规划参考' });
        } catch (e) { return fail(e); }
      },
      { annotations: { readOnlyHint: true } }
    ),
    token_budget: tool(
      'token_budget',
      '训练预算估算：数据集 token 量 → 总 token、优化器步数、预计时长（按经验吞吐）。用于实验计划与成本评审。',
      {
        datasetTokens: z.number().describe('数据集总 token 量（估算方法：字符数×0.25 英文 / ×0.6 中文，或用 tokenizer 实测）'),
        batchSize: z.number().optional().describe('batch size（序列条数），默认 8'),
        seqLen: z.number().optional().describe('每条序列长度，默认取插件配置'),
        epochs: z.number().optional().describe('训练轮数，默认 1'),
        throughputTokensPerSec: z.number().optional().describe('训练吞吐（tokens/s），默认取插件配置')
      },
      async function (args) { try { return ok(tokenBudget(args as { datasetTokens: number; batchSize?: number; seqLen?: number; epochs?: number; throughputTokensPerSec?: number }, c)); } catch (e) { return fail(e); } },
      { annotations: { readOnlyHint: true } }
    ),
    data_profile: tool(
      'data_profile',
      '数据集画像：对 CSV/TSV/JSONL 文本做字段级统计——类型推断、缺失率、数值列 min/max/mean、分类列高频值。用于训练前数据质检与污染初筛。',
      {
        text: z.string().describe('数据文件文本内容（建议先读文件前几百行传入；上限 5000 行）'),
        format: z.string().optional().describe('csv / jsonl / auto（按首字符判断），默认 auto')
      },
      async function (args) { try { return ok(dataProfile(args as { text: string; format?: string })); } catch (e) { return fail(e); } },
      { annotations: { readOnlyHint: true } }
    ),
    /* ---- research-robotics ---- */
    torque_estimate: tool(
      'torque_estimate',
      '估算机械臂/机构关节的静态重力矩与动态峰值力矩：按质量、力臂、关节数均摊，对照额定力矩给裕度判定与推荐规格。默认动态/安全系数可被插件 config.json 覆盖。',
      {
        massKg: z.number().describe('末端负载+连杆折算质量（kg）'),
        armM: z.number().describe('质心到关节轴的力臂（m）'),
        joints: z.number().optional().describe('均摊关节数，默认 1'),
        dynamicFactor: z.number().optional().describe('动态放大系数，默认取插件配置'),
        ratedNm: z.number().optional().describe('电机额定力矩（Nm，经减速比后），可选')
      },
      async function (args) { try { return ok(torqueEstimate(args as { massKg: number; armM: number; joints?: number; dynamicFactor?: number; ratedNm?: number }, c)); } catch (e) { return fail(e); } },
      { annotations: { readOnlyHint: true } }
    ),
    urdf_check: tool(
      'urdf_check',
      'URDF 模型静态核查：连杆树完整性、child 冲突、inertial 缺失/非法（质量≤0、惯性三角不等式）、运动关节缺 limit。粘贴 URDF 文本即可。',
      { urdf: z.string().describe('URDF 文件全文或 <robot> 片段文本') },
      async function (args) { try { return ok(urdfCheck(args as { urdf: string })); } catch (e) { return fail(e); } },
      { annotations: { readOnlyHint: true } }
    ),
    dh_transform: tool(
      'dh_transform',
      '标准 DH 参数 → 逐关节齐次变换矩阵与末端位姿（位置 + RPY 角）。用于运动学粗算、雅可比条件检查前的位姿验证。',
      {
        dh: z.array(z.array(z.number())).describe('DH 表，每行 [theta, d, a, alpha]，1~6 行'),
        unit: z.string().optional().describe('角度单位 rad（默认）或 deg')
      },
      async function (args) { try { return ok(dhTransform(args as { dh: number[][]; unit?: string })); } catch (e) { return fail(e); } },
      { annotations: { readOnlyHint: true } }
    )
  };
  const picked = (toolNames || []).map(function (n) { return all[n]; }).filter(Boolean) as never[];
  return createSdkMcpServer({ name: serverKey, tools: picked });
}

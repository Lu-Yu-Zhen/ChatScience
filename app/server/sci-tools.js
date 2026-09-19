"use strict";
/* ==================================================================
   sci-tools.ts · 六个自定义科研工具（04 策划案 C1，纯本地计算）
   与 6 个既有科研 MCP 工具并列，经 buildScienceServer 注入同一
   chatscience in-process server。本文件只放纯函数，MCP 薄包装在
   qoder.ts —— 验证脚本可直接单测函数，不依赖模型与网络。

   工具清单（策划案 11.1 #6）：
   1. doi_cite      DOI → BibTeX 与 GB/T 7714 引用（元数据可直接传入=纯本地；
                    只给 DOI 时走内容协商联网补全，失败回退待补全模板并如实标注）
   2. latex_check   LaTeX 公式解析与校验（括号/定界符/环境配对、常见命令拼写）
   3. unit_convert  科研单位换算（长度/质量/时间/能量/压力/温度/数据/角度/力/功率）
   4. name_normalize 变量与文件命名规范化（snake/camel/kebab/pascal + 文件名安全化）
   5. figure_caption 由表格/图片元信息自动生成学术图注/表注模板
   6. keyword_expand 研究关键词与同义词扩展（内置缩写表与变体规则 + 布尔检索式生成）
   ================================================================== */
Object.defineProperty(exports, "__esModule", { value: true });
exports.doiCite = doiCite;
exports.latexCheck = latexCheck;
exports.unitConvert = unitConvert;
exports.nameNormalize = nameNormalize;
exports.figureCaption = figureCaption;
exports.keywordExpand = keywordExpand;
function doiValid(doi) {
    /* DOI 语法：10.<suffix>/<path>，suffix 4-5 位数字 */
    return /^10\.\d{4,5}\/\S+$/.test(doi.trim());
}
function citeKeyFrom(authors, year, title) {
    const a = (authors[0] || 'anon').split(/\s+/).pop() || 'anon';
    const t = (title.split(/\s+/)[0] || 'untitled').replace(/[^a-zA-Z0-9]/g, '');
    return (a.toLowerCase() + year + t.toLowerCase()).slice(0, 40) || 'cite';
}
/* LaTeX/文本字段转义（& % $ # _ 为 BibTeX 特殊字符） */
function bibEscape(s) {
    return String(s || '').replace(/([&%$#_])/g, '\\$1');
}
function buildBibtex(key, meta, authors, type) {
    const fields = [];
    if (authors.length)
        fields.push('  author       = {' + authors.map(bibEscape).join(' and ') + '}');
    if (meta.title)
        fields.push('  title        = {' + bibEscape(meta.title) + '}');
    if (meta.journal)
        fields.push('  journal      = {' + bibEscape(meta.journal) + '}');
    if (meta.year)
        fields.push('  year         = {' + meta.year + '}');
    if (meta.volume)
        fields.push('  volume       = {' + meta.volume + '}');
    if (meta.number)
        fields.push('  number       = {' + meta.number + '}');
    if (meta.pages)
        fields.push('  pages        = {' + meta.pages + '}');
    if (meta.publisher)
        fields.push('  publisher    = {' + bibEscape(meta.publisher) + '}');
    if (meta.doi)
        fields.push('  doi          = {' + meta.doi + '}');
    if (meta.url)
        fields.push('  url          = {' + meta.url + '}');
    return '@' + type + '{' + key + ',\n' + fields.join(',\n') + '\n}';
}
function buildGbt7714(meta, authors) {
    /* GB/T 7714-2015 顺序编码制：作者. 题名[J]. 刊名, 年, 卷(期): 页码. */
    const au = authors.length
        ? (authors.length > 3 ? authors.slice(0, 3).join(', ') + ', 等' : authors.join(', '))
        : '佚名';
    const tail = [meta.journal, meta.year && String(meta.year), meta.volume && (meta.volume + (meta.number ? '(' + meta.number + ')' : '')), meta.pages]
        .filter(Boolean).join(', ');
    return au + '. ' + (meta.title || 'Untitled') + '[J].' + (tail ? ' ' + tail + '.' : '.')
        + (meta.doi ? ' DOI: ' + meta.doi + '.' : '');
}
function normalizeMeta(m, doi) {
    const authors = (m && m.authors) || [];
    return {
        authors: authors,
        meta: {
            title: (m && m.title) || '',
            journal: (m && m.journal) || '',
            year: String((m && m.year) || ''),
            volume: (m && String(m.volume)) || '',
            number: (m && String(m.issue)) || '',
            pages: (m && String(m.pages)) || '',
            publisher: (m && m.publisher) || '',
            doi: doi,
            url: doi ? 'https://doi.org/' + doi : ''
        }
    };
}
/* CrossRef 内容协商：doi.org 302 → data.crossref.org，Accept: application/x-bibtex */
async function fetchBibtexFromDoi(doi, timeoutMs) {
    const ctl = new AbortController();
    const t = setTimeout(function () { ctl.abort(); }, timeoutMs);
    try {
        const resp = await fetch('https://doi.org/' + encodeURIComponent(doi).replace(/%2F/g, '/'), {
            headers: { Accept: 'application/x-bibtex; charset=utf-8' },
            signal: ctl.signal,
            redirect: 'follow'
        });
        if (!resp.ok)
            return null;
        const text = await resp.text();
        return /@/.test(text) ? text.trim() : null;
    }
    catch (e) {
        return null;
    }
    finally {
        clearTimeout(t);
    }
}
async function doiCite(args) {
    const style = args.style || 'both';
    const doi = String(args.doi || '').trim();
    const hasLocalMeta = !!(args.meta && args.meta.title);
    if (!doi && !hasLocalMeta)
        return { error: '需要 doi 或 meta（至少 title）二者其一' };
    if (doi && !doiValid(doi))
        return { error: 'DOI 语法不合法（应形如 10.1234/abc.def）: ' + doi };
    let meta;
    let authors;
    let source;
    if (hasLocalMeta) {
        const n = normalizeMeta(args.meta, doi);
        meta = n.meta;
        authors = n.authors;
        source = 'local-meta';
    }
    else if (doi) {
        const fetched = await fetchBibtexFromDoi(doi, 12000);
        if (fetched) {
            /* 从返回的 bibtex 里粗提取字段用于 GB/T 7714 */
            const pick = function (field) {
                const m = fetched.match(new RegExp(field + '\\s*=\\s*[{\"]([^\}\"]+)[\"}]', 'i'));
                return m ? m[1] : '';
            };
            const rawAuthors = pick('author').split(/\s+and\s+/i).map(function (s) { return s.trim(); }).filter(Boolean);
            meta = { title: pick('title'), journal: pick('journal') || pick('booktitle'), year: pick('year'), volume: pick('volume'), number: pick('number'), pages: pick('pages'), publisher: pick('publisher'), doi: doi, url: 'https://doi.org/' + doi };
            authors = rawAuthors;
            source = 'crossref';
        }
        else {
            /* 联网失败：回退待补全模板，如实标注（不伪造元数据） */
            const n = normalizeMeta(undefined, doi);
            n.meta.title = '[待补全：未能联网获取元数据，请补入题名]';
            return {
                doi: doi, source: 'template',
                bibtex: buildBibtex('todo' + Date.now().toString(36), n.meta, n.authors, 'article'),
                gbt7714: buildGbt7714(n.meta, n.authors),
                note: '联网获取元数据失败（超时或网络不可达），以上为待补全模板，字段未经核实——禁止直接引用。'
            };
        }
    }
    else {
        const n = normalizeMeta(args.meta, doi);
        meta = n.meta;
        authors = n.authors;
        source = 'local-meta';
    }
    const key = citeKeyFrom(authors, meta.year, meta.title);
    const out = { doi: doi || undefined, source: source };
    if (style === 'bibtex' || style === 'both')
        out.bibtex = buildBibtex(key, meta, authors, meta.journal ? 'article' : 'misc');
    if (style === 'gbt7714' || style === 'both')
        out.gbt7714 = buildGbt7714(meta, authors);
    if (source === 'local-meta' && !meta.title)
        out.note = '仅校验了 DOI 语法，元数据待补充';
    return out;
}
const LATEX_COMMANDS_KNOWN = new Set([
    'begin', 'end', 'frac', 'dfrac', 'sqrt', 'sum', 'prod', 'int', 'iint', 'iiint', 'oint',
    'lim', 'infty', 'partial', 'nabla', 'cdot', 'cdots', 'ldots', 'times', 'div', 'pm', 'mp',
    'leq', 'geq', 'neq', 'approx', 'equiv', 'sim', 'propto', 'll', 'gg', 'left', 'right',
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa',
    'lambda', 'mu', 'nu', 'xi', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'varphi', 'chi', 'psi', 'omega',
    'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Phi', 'Psi', 'Omega',
    'mathbb', 'mathcal', 'mathbf', 'mathrm', 'mathit', 'mathsf', 'mathtt', 'boldsymbol', 'hat', 'bar', 'vec', 'tilde', 'dot', 'ddot',
    'text', 'textrm', 'textbf', 'textit', 'operatorname', 'arg', 'max', 'min', 'log', 'ln', 'exp', 'sin', 'cos', 'tan',
    'mathbf', 'nabla', 'top', 'bot', 'in', 'notin', 'subset', 'subseteq', 'supset', 'supseteq', 'cup', 'cap', 'emptyset',
    'forall', 'exists', 'neg', 'land', 'lor', 'implies', 'iff', 'rightarrow', 'leftarrow', 'Rightarrow', 'Leftarrow', 'leftrightarrow', 'Leftrightarrow',
    'mapsto', 'to', 'gets', 'langle', 'rangle', 'vert', 'Vert', 'mid', 'parallel', 'perp', 'angle',
    'label', 'ref', 'eqref', 'cite', 'nonumber', 'tag', 'quad', 'qquad', 'hspace', 'vspace', 'newline', '\\\\'
]);
function latexCheck(args) {
    const src = String(args.latex || '');
    if (!src.trim())
        return { ok: false, issues: [{ type: 'empty', detail: '输入为空' }], stats: { chars: 0, commands: 0, environments: 0, mathScopes: 0 } };
    const issues = [];
    /* ① 花括号配对（忽略 \\{ \\} 转义） */
    let depth = 0;
    for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if (c === '\\') {
            i++;
            continue;
        }
        if (c === '{')
            depth++;
        else if (c === '}') {
            depth--;
            if (depth < 0) {
                issues.push({ type: 'brace-unbalanced', detail: '第 ' + i + ' 个字符处出现多余 }', position: i });
                depth = 0;
            }
        }
    }
    if (depth !== 0)
        issues.push({ type: 'brace-unbalanced', detail: '花括号不配对：缺 ' + depth + ' 个 }（净深度 ' + depth + '）' });
    /* ② 数学定界符配对：$...$（含 $$）、\( \)、\[ \] */
    const dollarPairs = src.split('$$').length - 1;
    if (dollarPairs % 2 !== 0)
        issues.push({ type: 'delimiter', detail: '$$ 定界符数量为奇数（' + dollarPairs + '）' });
    const singles = src.replace(/\$\$/g, '').split('$').length - 1;
    if (singles % 2 !== 0)
        issues.push({ type: 'delimiter', detail: '行内 $ 定界符数量为奇数（' + singles + '）' });
    const countOf = function (tok) { let n = 0, i = 0; while ((i = src.indexOf(tok, i)) > -1) {
        n++;
        i += tok.length;
    } return n; };
    if (countOf('\\(') !== countOf('\\)'))
        issues.push({ type: 'delimiter', detail: '\\( 与 \\) 数量不一致（' + countOf('\\(') + ' vs ' + countOf('\\)') + '）' });
    if (countOf('\\[') !== countOf('\\]'))
        issues.push({ type: 'delimiter', detail: '\\[ 与 \\] 数量不一致（' + countOf('\\[') + ' vs ' + countOf('\\]') + '）' });
    /* ③ 环境配对 begin/end */
    const begins = [];
    const envRe = /\\(begin|end)\{([^}]+)\}/g;
    let m;
    while ((m = envRe.exec(src))) {
        if (m[1] === 'begin')
            begins.push(m[2]);
        else {
            const last = begins.pop();
            if (last !== m[2])
                issues.push({ type: 'environment', detail: '环境不配对：\\end{' + m[2] + '} 与最近的 \\begin{' + (last || '∅') + '} 不匹配（位置 ' + m.index + '）', position: m.index });
        }
    }
    begins.forEach(function (e) { issues.push({ type: 'environment', detail: '\\begin{' + e + '} 缺少对应的 \\end{' + e + '}' }); });
    /* ④ 常见命令拼写（未知命令提示核对；希腊字母与高频命令建在白名单） */
    const cmdRe = /\\([a-zA-Z]+)/g;
    const unknown = [];
    let cmdCount = 0;
    while ((m = cmdRe.exec(src))) {
        cmdCount++;
        if (!LATEX_COMMANDS_KNOWN.has(m[1]) && unknown.indexOf(m[1]) < 0)
            unknown.push(m[1]);
    }
    if (unknown.length)
        issues.push({ type: 'unknown-command', detail: '以下命令不在内置白名单（可能是拼写错误，也可能是合法的宏包命令，请人工核对）: ' + unknown.join(', ') });
    /* ⑤ 易错点：\left 无 \right、下标循环引用提示 */
    if (countOf('\\left') !== countOf('\\right'))
        issues.push({ type: 'delimiter', detail: '\\left 与 \\right 数量不一致（' + countOf('\\left') + ' vs ' + countOf('\\right') + '）' });
    return {
        ok: issues.every(function (i) { return i.type !== 'brace-unbalanced' && i.type !== 'delimiter' && i.type !== 'environment'; }),
        issues: issues,
        stats: {
            chars: src.length, commands: cmdCount,
            environments: (src.match(/\\begin\{/g) || []).length,
            mathScopes: dollarPairs + countOf('\\[') + countOf('\\(')
        }
    };
}
/* 因子表：同量纲内 to 值 = value * fromFactor / toFactor */
const UNIT_TABLE = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, um: 1e-6, nm: 1e-9, pm: 1e-12, Å: 1e-10, angstrom: 1e-10, in: 0.0254, ft: 0.3048, mi: 1609.344, ly: 9.4607e15, au: 1.495978707e11 },
    mass: { kg: 1, g: 0.001, mg: 1e-6, ug: 1e-9, t: 1000, lb: 0.45359237, oz: 0.028349523, u: 1.66053906660e-27, Da: 1.66053906660e-27 },
    time: { s: 1, ms: 0.001, us: 1e-6, ns: 1e-9, min: 60, h: 3600, d: 86400 },
    energy: { J: 1, kJ: 1000, MJ: 1e6, cal: 4.184, kcal: 4184, eV: 1.602176634e-19, keV: 1.602176634e-16, MeV: 1.602176634e-13, GeV: 1.602176634e-10, Wh: 3600, kWh: 3.6e6, erg: 1e-7, btu: 1055.06 },
    pressure: { Pa: 1, kPa: 1000, MPa: 1e6, GPa: 1e9, bar: 1e5, mbar: 100, atm: 101325, torr: 133.322, mmHg: 133.322, psi: 6894.757 },
    data: { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1048576, GiB: 1073741824, bit: 0.125 },
    force: { N: 1, kN: 1000, mN: 0.001, dyn: 1e-5, lbf: 4.448222 },
    power: { W: 1, kW: 1000, MW: 1e6, mW: 0.001, hp: 745.6999 },
    angle: { rad: 1, deg: Math.PI / 180, arcmin: Math.PI / 10800, arcsec: Math.PI / 648000, turn: 2 * Math.PI }
};
/* 温度单独处理 */
function convertTemp(v, from, to) {
    const norm = function (u) { return u.replace(/°/g, '').toLowerCase(); };
    const f = norm(from), t = norm(to);
    const toC = f === 'c' ? v : f === 'f' ? (v - 32) * 5 / 9 : f === 'k' ? v - 273.15 : f === 'r' ? (v - 491.67) * 5 / 9 : null;
    if (toC === null)
        return null;
    return t === 'c' ? toC : t === 'f' ? toC * 9 / 5 + 32 : t === 'k' ? toC + 273.15 : t === 'r' ? (toC + 273.15) * 9 / 5 : null;
}
function unitConvert(args) {
    const v = Number(args.value);
    const from = String(args.from || '').trim();
    const to = String(args.to || '').trim();
    if (!isFinite(v))
        return { error: 'value 必须是有限数字' };
    if (!from || !to)
        return { error: 'from 与 to 必填' };
    const t1 = convertTemp(v, from, to);
    if (t1 !== null && isFinite(t1)) {
        return { value: t1, from: from, to: to, formula: '温度换算（C/F/K/R 四制式）' };
    }
    for (const dim of Object.keys(UNIT_TABLE)) {
        const tab = UNIT_TABLE[dim];
        const f = tab[from] !== undefined ? tab[from] : (tab[from.toLowerCase()] !== undefined ? tab[from.toLowerCase()] : null);
        const t = tab[to] !== undefined ? tab[to] : (tab[to.toLowerCase()] !== undefined ? tab[to.toLowerCase()] : null);
        if (f !== null && t !== null) {
            const out = v * f / t;
            return { value: out, from: from, to: to, formula: v + ' ' + from + ' = ' + out + ' ' + to + '（量纲: ' + dim + '，线性因子换算）' };
        }
    }
    const dims = Object.keys(UNIT_TABLE).map(function (d) { return d + '[' + Object.keys(UNIT_TABLE[d]).slice(0, 8).join('/') + '…]'; });
    return { error: '不支持的单位组合：' + from + ' → ' + to, available: dims.concat(['温度: °C/°F/K/°R']) };
}
function wordsOf(name) {
    const s = String(name || '').trim();
    if (!s)
        return [];
    const cleaned = s.replace(/[^a-zA-Z0-9_\-\s]/g, ' ');
    return cleaned
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .split(/[\s_\-]+/)
        .map(function (w) { return w.trim(); })
        .filter(Boolean);
}
function nameNormalize(args) {
    const words = wordsOf(args.name);
    if (!words.length)
        return { error: '无法从输入中解析出有效词元' };
    const lower = words.map(function (w) { return w.toLowerCase(); });
    const snake = lower.join('_');
    const camel = lower[0] + lower.slice(1).map(function (w) { return w[0].toUpperCase() + w.slice(1); }).join('');
    const pascal = lower.map(function (w) { return w[0].toUpperCase() + w.slice(1); }).join('');
    const kebab = lower.join('-');
    const filename = lower.join('_').replace(/[^a-z0-9_]/g, '').slice(0, 64) || 'unnamed';
    const latexVar = lower.length === 1 ? lower[0] : lower.map(function (w, i) { return i === 0 ? w : w[0].toUpperCase() + w.slice(1); }).join('');
    const style = args.style || 'snake_case';
    const chosen = style === 'camelCase' ? camel : style === 'PascalCase' ? pascal : style === 'kebab-case' ? kebab : style === 'filename' ? filename : style === 'latex-var' ? latexVar : snake;
    return {
        input: args.name, style: style, result: chosen,
        all: { snake_case: snake, camelCase: camel, PascalCase: pascal, 'kebab-case': kebab, filename: filename, 'latex-var': latexVar },
        note: 'LaTeX 变量建议与论文符号对应（如 attentionDim → d_{attn}）；文件名仅含小写字母数字下划线，跨平台安全'
    };
}
function figureCaption(args) {
    const kind = args.kind === 'table' ? 'table' : 'figure';
    const what = String(args.what || '').trim();
    if (!what)
        return { error: 'what 必填：一句话说明图/表展示什么' };
    const zh = args.lang !== 'en';
    const parts = [];
    if (zh) {
        parts.push((kind === 'table' ? '表' : '图') + ' X：' + what);
        if (args.method)
            parts.push('（' + args.method + (args.dataset ? '，' + args.dataset : '') + '）');
        else if (args.dataset)
            parts.push('（' + args.dataset + '）');
        if (args.hasErrorBars)
            parts.push('误差条为 ' + (zh ? '3 次随机种子的标准差' : '') + '；');
        if (args.significance)
            parts.push('显著性标注：' + args.significance + '。');
        if (args.highlight)
            parts.push(args.highlight);
    }
    else {
        parts.push((kind === 'table' ? 'Table' : 'Figure') + ' X: ' + what + '.');
        if (args.method)
            parts.push(args.method + (args.dataset ? ' on ' + args.dataset : '') + '.');
        if (args.hasErrorBars)
            parts.push('Error bars denote std over 3 random seeds.');
        if (args.significance)
            parts.push('Significance: ' + args.significance + '.');
        if (args.highlight)
            parts.push(args.highlight);
    }
    const checklist = [
        zh ? '图内信息自足：不看正文也能理解（轴标签、单位、图例齐全）' : 'self-contained',
        zh ? '正文先引用后出现（"如图 X 所示"）' : 'referenced before shown',
        kind === 'table' ? (zh ? '表格里最优结果加粗，基线明确标注' : 'bold the best, mark the baseline') : (zh ? '配色色盲友好；打印黑白仍可分辨' : 'colorblind-safe'),
        args.metricNames && args.metricNames.length ? (zh ? '指标名与正文术语一致：' + args.metricNames.join('、') : 'metric names consistent') : (zh ? '指标名与正文术语一致' : 'metric names consistent')
    ];
    const cap = parts.join(' ').replace(/\s*；\s*$/g, '。');
    return {
        caption: cap,
        shortCaption: (zh ? (kind === 'table' ? '表' : '图') + ' X：' : (kind === 'table' ? 'Table X: ' : 'Figure X: ')) + what,
        checklist: checklist
    };
}
/* 内置领域同义词/缩写表（大模型与机器人方向高频词；未命中词条做形态变体） */
const SYNONYM_TABLE = {
    'attention': ['self-attention', 'multi-head attention', 'MHA'],
    'transformer': ['self-attention network', 'attention-based model'],
    'llm': ['large language model', 'large-scale language model'],
    'vlm': ['vision-language model', 'multimodal large model'],
    'vla': ['vision-language-action', 'vision-language-action model'],
    'moe': ['mixture of experts', 'sparse expert model'],
    'rlhf': ['reinforcement learning from human feedback', 'human preference alignment'],
    'dpo': ['direct preference optimization', 'preference optimization'],
    'robot': ['robotics', 'manipulation', 'embodied agent'],
    'manipulation': ['robotic manipulation', 'grasping', 'dexterous manipulation'],
    'sim2real': ['simulation to reality transfer', 'domain randomization', 'reality gap'],
    'embodied': ['embodied AI', 'embodied intelligence', 'embodied agent'],
    'diffusion': ['diffusion model', 'denoising diffusion', 'score-based generative model'],
    'world model': ['worldmodel', 'model-based learning', 'dynamics model'],
    'distillation': ['knowledge distillation', 'teacher-student'],
    'pruning': ['model pruning', 'sparsification'],
    'quantization': ['model quantization', 'low-bit'],
    'rl': ['reinforcement learning', 'deep reinforcement learning'],
    'imitation learning': ['behavior cloning', 'learning from demonstration'],
    'few-shot': ['few-shot learning', 'low-resource learning', 'in-context learning'],
    'generalization': ['out-of-distribution generalization', 'OOD'],
    'efficiency': ['inference efficiency', 'computational efficiency'],
    'benchmark': ['evaluation benchmark', 'evaluation suite']
};
function morphologyVariants(term) {
    const out = [];
    const t = term.toLowerCase();
    if (t.endsWith('ies'))
        out.push(t.slice(0, -3) + 'y');
    if (t.endsWith('s') && !t.endsWith('ss'))
        out.push(t.slice(0, -1));
    if (!t.endsWith('s') && !t.endsWith('y'))
        out.push(t + 's');
    if (t.endsWith('ing'))
        out.push(t.slice(0, -3), t.slice(0, -3) + 'ed');
    if (t.indexOf('-') > -1) {
        out.push(t.replace(/-/g, ' '), t.replace(/-/g, ''));
    }
    if (t.indexOf(' ') > -1) {
        out.push(t.replace(/\s+/g, '-'));
    }
    /* 缩写展开：如 mha */
    if (t.length >= 2 && t === t.toUpperCase() && t.length <= 5) {
        /* 无表可查时提示人工补充 */
    }
    return out.filter(function (x) { return x && x !== t; });
}
function keywordExpand(args) {
    const kws = (args.keywords || []).map(function (k) { return String(k || '').trim(); }).filter(Boolean);
    if (!kws.length)
        return { error: 'keywords 不能为空', expansions: {} };
    const maxPer = Math.min(Math.max(parseInt(String(args.maxPerTerm), 10) || 6, 2), 12);
    const expansions = {};
    kws.forEach(function (k) {
        const key = k.toLowerCase();
        const set = [];
        (SYNONYM_TABLE[key] || []).forEach(function (s) { if (set.indexOf(s) < 0)
            set.push(s); });
        /* 反查：完整术语 → 缩写 */
        Object.keys(SYNONYM_TABLE).forEach(function (full) {
            if (full === key)
                return;
            SYNONYM_TABLE[full].forEach(function (abbr) {
                if (abbr.toLowerCase() === key && set.indexOf(full) < 0)
                    set.push(full);
            });
        });
        morphologyVariants(k).forEach(function (v) { if (set.indexOf(v) < 0 && set.length < maxPer)
            set.push(v); });
        expansions[k] = set.slice(0, maxPer);
    });
    /* 布尔检索式：arXiv API 风格（AND 连接词条，词条内 OR 连接变体） */
    const query = kws.map(function (k) {
        const variants = [k].concat(expansions[k] || []).slice(0, 4);
        return '(' + variants.map(function (v) { return '"' + v + '"'; }).join(' OR ') + ')';
    }).join(' AND ');
    return {
        expansions: expansions,
        booleanQuery: query,
        note: '同义词表覆盖大模型/具身智能高频词；其余词条给形态变体（单复数/连字符/空格）。检索式可直接用于 arxiv_search（去掉外层引号亦可）。建议再用 keyword 的领域行话人工补充一轮。'
    };
}

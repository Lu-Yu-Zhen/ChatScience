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
exports.createKb = createKb;
/* ==================================================================
   kb.ts · 知识库 BM25 词法检索
   索引来源：前端在"添加知识"时推送已解析的纯文本（复用 readerDocText 的
   pdf.js / mammoth / SheetJS 解析结果），后端不重复解析二进制。
   分块 → 分词（中文 bigram + 单字，英文按词）→ BM25 打分。
   诚实定位：词法检索，不是语义检索——同义改述会漏召回，工具描述/UI/报告
   三处已声明；返回 score 供模型自行判断可信度。
   ================================================================== */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const K1 = 1.5, B = 0.75;
const CHUNK_CHARS = 600, CHUNK_OVERLAP = 80, MAX_TEXT = 900000;
function safeName(name) {
    const s = String(name || '').replace(/[\\/:*?"<>|]/g, '_').slice(0, 120);
    if (!s)
        throw new Error('invalid kb file name');
    return s;
}
function createKb(appRoot) {
    const DIR = path.join(appRoot, 'data', 'kb');
    function kbDir(kbId) {
        const id = String(kbId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'default';
        const p = path.join(DIR, id);
        policyGuard(p);
        return p;
    }
    function policyGuard(p) {
        const r = path.resolve(DIR);
        const t = path.resolve(p);
        if (t !== r && !t.startsWith(r + path.sep))
            throw new Error('kb path escapes index root');
    }
    function tokenize(text) {
        const tokens = [];
        const s = String(text || '').toLowerCase();
        let m;
        const re = /[a-z0-9]+/g;
        while ((m = re.exec(s))) {
            if (m[0].length <= 24)
                tokens.push(m[0]);
        }
        /* 中文只建 bigram（不加单字）：单字会让无关查询误命中（如"力波"里的"力"
           命中"注意力"），bigram 对短查询的召回足够且精度高得多 */
        const cjk = s.match(/[\u4e00-\u9fff]+/g) || [];
        cjk.forEach(function (seg) {
            for (let i = 0; i + 1 < seg.length; i++)
                tokens.push(seg[i] + seg[i + 1]);
        });
        return tokens;
    }
    function chunkText(text) {
        const t = String(text || '').slice(0, MAX_TEXT);
        const chunks = [];
        let i = 0;
        while (i < t.length) {
            chunks.push(t.slice(i, i + CHUNK_CHARS));
            if (i + CHUNK_CHARS >= t.length)
                break;
            i += CHUNK_CHARS - CHUNK_OVERLAP;
        }
        return chunks.length ? chunks : [''];
    }
    /* 索引一个文件：{ kbId, fileName, text } → app/data/kb/<kbId>/<file>.json */
    function indexFile(req) {
        fs.mkdirSync(DIR, { recursive: true });
        const dir = kbDir(req.kbId);
        fs.mkdirSync(dir, { recursive: true });
        const fname = safeName(req.fileName);
        const chunks = chunkText(req.text).map(function (c, idx) {
            const tokens = tokenize(c);
            const tf = {};
            tokens.forEach(function (t) { tf[t] = (tf[t] || 0) + 1; });
            return { idx: idx, text: c.slice(0, 1200), tf: tf, len: tokens.length };
        });
        fs.writeFileSync(path.join(dir, fname + '.json'), JSON.stringify({ kbId: req.kbId, fileName: req.fileName, indexedAt: Date.now(), chunks: chunks }, null, 1), 'utf8');
        return { kbId: req.kbId, fileName: req.fileName, chunks: chunks.length, chars: String(req.text || '').length };
    }
    function removeFile(kbId, fileName) {
        const dir = kbDir(kbId);
        const f = path.join(dir, safeName(fileName) + '.json');
        try {
            fs.rmSync(f, { force: true });
        }
        catch (e) { /* 忽略 */ }
        return { removed: fileName };
    }
    /* 已索引状态：{kbId: {files, chunks, chars}} */
    function status() {
        const out = {};
        let files = [];
        try {
            files = fs.readdirSync(DIR, { withFileTypes: true });
        }
        catch (e) {
            return { totalFiles: 0, kbs: out };
        }
        let total = 0;
        files.forEach(function (d) {
            if (!d.isDirectory())
                return;
            let fl = [];
            try {
                fl = fs.readdirSync(path.join(DIR, d.name));
            }
            catch (e) {
                return;
            }
            let chunks = 0;
            fl.forEach(function (f) {
                if (!f.endsWith('.json'))
                    return;
                try {
                    chunks += JSON.parse(fs.readFileSync(path.join(DIR, d.name, f), 'utf8')).chunks.length;
                    total++;
                }
                catch (e) { /* 损坏跳过 */ }
            });
            out[d.name] = { files: fl.filter(function (f) { return f.endsWith('.json'); }).length, chunks: chunks };
        });
        return { totalFiles: total, kbs: out };
    }
    /* BM25 检索 */
    function search(req) {
        const q = String(req.query || '').trim();
        if (!q)
            return { error: 'query 不能为空' };
        const topK = Math.min(Math.max(parseInt(String(req.topK), 10) || 5, 1), 20);
        const st = status();
        if (!st.totalFiles) {
            return {
                hint: '知识库正文尚未建立索引。请在「知识和数据库」页重新导入文件（添加知识时会自动建立索引），或告诉我需要的文件名。',
                results: []
            };
        }
        const qTokens = tokenize(q);
        if (!qTokens.length)
            return { hint: '无法从查询中提取检索词', results: [] };
        /* 载入候选：限定 kbId 或全部 */
        const docs = [];
        let kbIds = [];
        try {
            kbIds = fs.readdirSync(DIR, { withFileTypes: true }).filter(function (d) { return d.isDirectory(); }).map(function (d) { return d.name; });
        }
        catch (e) { /* 无索引 */ }
        if (req.kbId)
            kbIds = kbIds.filter(function (k) { return k === String(req.kbId).replace(/[^a-zA-Z0-9_-]/g, ''); });
        if (req.kbId && !kbIds.length) {
            return {
                hint: '该知识库尚未建立索引。请在「知识和数据库」页向该知识库重新添加文件（添加知识时会自动建立索引）。',
                results: []
            };
        }
        kbIds.forEach(function (kbId) {
            let fl = [];
            try {
                fl = fs.readdirSync(path.join(DIR, kbId));
            }
            catch (e) {
                return;
            }
            fl.forEach(function (f) {
                if (!f.endsWith('.json'))
                    return;
                try {
                    const doc = JSON.parse(fs.readFileSync(path.join(DIR, kbId, f), 'utf8'));
                    doc.chunks.forEach(function (c) { docs.push({ kbId: kbId, file: doc.fileName, chunk: c }); });
                }
                catch (e) { /* 损坏跳过 */ }
            });
        });
        if (!docs.length)
            return { hint: '没有命中的知识库文件', results: [] };
        /* BM25 */
        const N = docs.length;
        const avgLen = docs.reduce(function (s, d) { return s + d.chunk.len; }, 0) / N || 1;
        const df = {};
        docs.forEach(function (d) {
            Object.keys(d.chunk.tf).forEach(function (t) { df[t] = (df[t] || 0) + 1; });
        });
        const scored = docs.map(function (d) {
            let score = 0;
            const seen = {};
            qTokens.forEach(function (t) {
                if (seen[t])
                    return;
                seen[t] = 1;
                const f = d.chunk.tf[t] || 0;
                if (!f)
                    return;
                const idf = Math.log(1 + (N - (df[t] || 0) + 0.5) / ((df[t] || 0) + 0.5));
                score += idf * (f * (K1 + 1)) / (f + K1 * (1 - B + B * d.chunk.len / avgLen));
            });
            return { kbId: d.kbId, file: d.file, chunkIdx: d.chunk.idx, score: Math.round(score * 1000) / 1000, text: d.chunk.text };
        }).filter(function (r) { return r.score > 0; })
            .sort(function (a, b) { return b.score - a.score; })
            .slice(0, topK);
        return {
            query: q, kind: 'bm25-lexical', indexedFiles: st.totalFiles,
            count: scored.length, results: scored,
            note: 'BM25 词法检索（非语义）：同义改述可能漏召回；score 供参考，重要结论建议核对原文。'
        };
    }
    const api = { indexFile: indexFile, removeFile: removeFile, status: status, search: search, dir: DIR };
    return api;
}

/* ==================================================================
   research.js · 科研检索工具实现（arXiv / 网页抓取 / 联网检索）
   全部走 Node 24 全局 fetch，零依赖。超时与体积都有上限。
   web_search 依赖第三方 HTML 端点，结构变化即失效——工具描述里必须
   如实说明这一点，失败时返回明确错误而不是空结果。
   ================================================================== */

const UA = 'ChatScience-Research-Agent/1.0 (local desktop; research use)';
const FETCH_TIMEOUT = 20000;
const MAX_HTML = 3 * 1024 * 1024;

async function timedFetch(url, init) {
  const ctl = new AbortController();
  const t = setTimeout(function () { ctl.abort(); }, FETCH_TIMEOUT);
  try {
    return await fetch(url, Object.assign({}, init, {
      signal: ctl.signal,
      headers: Object.assign({ 'User-Agent': UA }, (init && init.headers) || {})
    }));
  } finally { clearTimeout(t); }
}

/* ---------------- arXiv 检索（官方 API，免 key） ---------------- */

function xmlText(xml, tag) {
  const m = xml.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i'));
  if (!m) return '';
  return decodeXml(m[1]).replace(/\s+/g, ' ').trim();
}
function decodeXml(s) {
  return String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

async function arxivSearch(args) {
  const q = String(args.query || '').trim();
  if (!q) return { error: 'query 不能为空' };
  const max = Math.min(Math.max(parseInt(args.maxResults, 10) || 5, 1), 20);
  /* arXiv API 查询语法：字段前缀 ti:/au:/abs:/cat:/all:，默认 all: */
  const term = q.split(/\s+/).map(function (w) { return 'all:' + w; }).join('+AND+');
  const url = 'https://export.arxiv.org/api/query?search_query=' + term
    + '&start=0&max_results=' + max + '&sortBy=relevance';
  let resp;
  try { resp = await timedFetch(url, { headers: { Accept: 'application/atom+xml' } }); }
  catch (e) { return { error: 'arXiv 请求失败：' + e.message }; }
  if (!resp.ok) return { error: 'arXiv 返回 ' + resp.status };
  const xml = await resp.text();
  const entries = xml.split(/<entry>/i).slice(1);
  const papers = entries.map(function (e) {
    const idUrl = xmlText(e, 'id');
    const m = idUrl.match(/arxiv\.org\/abs\/([^\s]+)/i);
    return {
      arxivId: m ? m[1] : idUrl,
      title: xmlText(e, 'title'),
      authors: (e.match(/<name>([\s\S]*?)<\/name>/gi) || [])
        .map(function (a) { return decodeXml(a.replace(/<\/?name>/gi, '')).trim(); }).slice(0, 6),
      summary: Work_trunc2(xmlText(e, 'summary'), 1200),
      published: xmlText(e, 'published'),
      updated: xmlText(e, 'updated'),
      categories: (e.match(/<category[^>]*term="([^"]+)"/gi) || [])
        .map(function (c) { return (c.match(/term="([^"]+)"/) || [])[1]; }).filter(Boolean),
      pdf: m ? ('https://arxiv.org/pdf/' + m[1]) : '',
      absUrl: idUrl
    };
  }).filter(function (p) { return p.title; });
  return { query: q, count: papers.length, papers: papers, note: 'arXiv 官方 API，按相关性排序；摘要为截断版' };
}
function Work_trunc2(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s; }

/* ---------------- 网页抓取 ---------------- */

function stripHtml(html) {
  let s = String(html || '');
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  s = s.replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  s = s.replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n+/g, '\n\n');
  return s.trim();
}

async function fetchUrl(args) {
  const url = String(args.url || '').trim();
  if (!/^https?:\/\//i.test(url)) return { error: '仅支持 http/https URL' };
  let resp;
  try { resp = await timedFetch(url, { headers: { Accept: 'text/html,application/xhtml+xml,text/plain,*/*' } }); }
  catch (e) { return { error: '抓取失败：' + e.message }; }
  const ct = resp.headers.get('content-type') || '';
  if (ct.indexOf('application/pdf') > -1) {
    return { url: url, error: '目标是 PDF（' + ct + '）。请改用 kb_search 检索已导入知识库的论文，或先下载后导入。' };
  }
  const buf = await resp.arrayBuffer();
  if (buf.byteLength > MAX_HTML) return { url: url, error: '页面过大（' + buf.byteLength + ' 字节）' };
  const text = Buffer.from(buf).toString('utf8');
  const maxChars = Math.min(Math.max(parseInt(args.maxChars, 10) || 12000, 500), 60000);
  const clean = stripHtml(text);
  return {
    url: url, status: resp.status, contentType: ct,
    chars: clean.length, text: Work_trunc2(clean, maxChars),
    truncated: clean.length > maxChars
  };
}

/* ---------------- 联网检索（无 key，依赖第三方 HTML 端点，脆弱） ---------------- */

async function webSearch(args) {
  const q = String(args.query || '').trim();
  if (!q) return { error: 'query 不能为空' };
  /* DuckDuckGo HTML 版：无需 key；页面结构变化即失效，工具描述已声明该风险 */
  const body = new URLSearchParams({ q: q, kl: 'cn-zh' }).toString();
  let resp;
  try {
    resp = await timedFetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/html' },
      body: body
    });
  } catch (e) { return { error: '检索请求失败：' + e.message }; }
  if (!resp.ok) return { error: '检索端点返回 ' + resp.status + '（第三方端点可能已变更结构）' };
  const html = await resp.text();
  const results = [];
  /* result__a 携带 uddg= 包装的真实链接 */
  const re = /<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snRe = /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippets = [];
  let sm;
  while ((sm = snRe.exec(html)) && snippets.length < 12) snippets.push(stripHtml(sm[1]));
  let m, i = 0;
  while ((m = re.exec(html)) && results.length < 8) {
    let href = m[1];
    const u = href.match(/[?&]uddg=([^&]+)/);
    if (u) href = decodeURIComponent(u[1]);
    results.push({ title: stripHtml(m[2]), url: href, snippet: snippets[i] || '' });
    i++;
  }
  if (!results.length) return { error: '未解析到结果——检索端点页面结构可能已变更（此工具无 API key，依赖 HTML 解析，属已知脆弱点）', query: q };
  return { query: q, count: results.length, results: results, note: '无 key 公开端点，结果质量与稳定性有限；重要结论请用 fetch_url 核对原文' };
}

module.exports = { arxivSearch, fetchUrl, webSearch, stripHtml };

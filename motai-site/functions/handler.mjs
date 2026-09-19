// Public feedback board: anonymous visitors submit; everyone reads.
// Grants are SELECT + INSERT only; there is no update or delete endpoint.
const json = (body, status = 200, headers = {}) => Response.json(body, {
  status,
  headers: { "cache-control": "no-store", ...headers },
});

const PAGE_SIZE = 20;
const MAX_BODY_CHARS = 2048;
const MAX_NICKNAME = 24;
const MAX_CONTENT = 500;

const runes = (value) => Array.from(value).length;

function validateSubmit(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "invalid_body" };
  const rawNickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const nickname = rawNickname === "" ? "匿名访客" : rawNickname;
  if (runes(nickname) > MAX_NICKNAME) return { error: "nickname_too_long" };
  if (content.length === 0 || runes(content) > MAX_CONTENT) return { error: "invalid_content" };
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(content)) return { error: "invalid_content" };
  return { nickname, content };
}

export async function handleFeedback({ request, supabase }) {
  const params = new URL(request.url).searchParams;
  const action = params.get("action");

  if (action === "list") {
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405, { allow: "GET" });
    const rawOffset = params.get("offset") ?? "0";
    if (!/^(0|[1-9][0-9]{0,5})$/.test(rawOffset)) return json({ error: "invalid_offset" }, 400);
    const offset = Number(rawOffset);
    try {
      // Fetch one extra row; range endpoints are inclusive.
      const { data, error } = await supabase.from("feedback")
        .select("id,nickname,content,created_at")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + PAGE_SIZE);
      if (error || !Array.isArray(data)) return json({ error: "database_request_failed" }, 503);
      const hasMore = data.length > PAGE_SIZE;
      return json({ items: data.slice(0, PAGE_SIZE), hasMore, nextOffset: hasMore ? offset + PAGE_SIZE : null });
    } catch {
      return json({ error: "database_request_failed" }, 503);
    }
  }

  if (action === "submit") {
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, { allow: "POST" });
    if (!request.headers.get("content-type")?.includes("application/json")) return json({ error: "invalid_body" }, 400);
    let raw;
    try {
      raw = await request.text();
    } catch {
      return json({ error: "invalid_body" }, 400);
    }
    if (raw.length > MAX_BODY_CHARS) return json({ error: "body_too_large" }, 413);
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json({ error: "invalid_body" }, 400);
    }
    const validated = validateSubmit(parsed);
    if (validated.error) return json({ error: validated.error }, 400);

    try {
      // Same visitor content repeated within 2 minutes is rejected (best effort).
      const since = new Date(Date.now() - 120_000).toISOString();
      const recent = await supabase.from("feedback")
        .select("id").eq("content", validated.content).gte("created_at", since).limit(1);
      if (recent.error) return json({ error: "database_request_failed" }, 503);
      if (Array.isArray(recent.data) && recent.data.length > 0) return json({ error: "duplicate_too_soon" }, 429);

      const created = await supabase.from("feedback").insert({
        id: crypto.randomUUID(),
        nickname: validated.nickname,
        content: validated.content,
        created_at: new Date().toISOString(),
      }).select("id,nickname,content,created_at").single();
      if (created.error || !created.data) return json({ error: "database_request_failed" }, 503);
      return json({ ok: true, item: created.data });
    } catch {
      // A transport failure leaves the write outcome unknown; the caller must not replay it.
      return json({ error: "write_result_unknown" }, 503);
    }
  }

  return json({ error: "not_found" }, 404);
}

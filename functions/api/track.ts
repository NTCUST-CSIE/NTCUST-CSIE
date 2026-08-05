interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  let type = '';
  let path = '';
  let slug = '';
  let target = '';
  let visitorId = '';
  let isNewSession = false;

  const url = new URL(request.url);
  type = url.searchParams.get('type') || '';
  path = url.searchParams.get('path') || '';
  slug = url.searchParams.get('slug') || '';
  target = url.searchParams.get('target') || '';
  visitorId = url.searchParams.get('visitor_id') || '';
  isNewSession = url.searchParams.get('is_new_session') === 'true';

  if (request.method === 'POST') {
    try {
      const body = await request.json() as any;
      if (body?.type) type = body.type;
      if (body?.path) path = body.path;
      if (body?.slug) slug = body.slug;
      if (body?.target) target = body.target;
      if (body?.visitor_id) visitorId = body.visitor_id;
      if (typeof body?.is_new_session === 'boolean') isNewSession = body.is_new_session;
    } catch {
      // Body might be empty or form encoded
    }
  }

  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'D1 Database binding DB not found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 1. Update Visitor Tracking with Time-Gap Recognition
    if (visitorId) {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS visitors (
          visitor_id TEXT PRIMARY KEY,
          first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_visit_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          visit_count INTEGER DEFAULT 1,
          page_views INTEGER DEFAULT 1,
          returns_after_30m INTEGER DEFAULT 0,
          returns_after_24h INTEGER DEFAULT 0,
          returns_after_7d INTEGER DEFAULT 0
        );
      `).run();

      const existing = await env.DB.prepare(
        `SELECT visitor_id, last_seen_at FROM visitors WHERE visitor_id = ?1`
      ).bind(visitorId).first() as { visitor_id: string; last_seen_at: string } | null;

      if (existing && existing.last_seen_at) {
        const lastSeenTime = new Date(existing.last_seen_at + (existing.last_seen_at.includes('Z') ? '' : 'Z')).getTime();
        const now = Date.now();
        const diffSeconds = Math.max(0, Math.floor((now - lastSeenTime) / 1000));

        // If it's a new session or more than 30 mins since last active
        const isSessionBreak = isNewSession || diffSeconds >= 1800;

        if (isSessionBreak) {
          const add30m = diffSeconds >= 1800 ? 1 : 0;
          const add24h = diffSeconds >= 86400 ? 1 : 0;
          const add7d = diffSeconds >= 604800 ? 1 : 0;

          await env.DB.prepare(`
            UPDATE visitors SET
              visit_count = visit_count + 1,
              page_views = page_views + 1,
              last_visit_at = last_seen_at,
              last_seen_at = CURRENT_TIMESTAMP,
              returns_after_30m = returns_after_30m + ?2,
              returns_after_24h = returns_after_24h + ?3,
              returns_after_7d = returns_after_7d + ?4
            WHERE visitor_id = ?1
          `).bind(visitorId, add30m, add24h, add7d).run();
        } else {
          await env.DB.prepare(`
            UPDATE visitors SET
              page_views = page_views + 1,
              last_seen_at = CURRENT_TIMESTAMP
            WHERE visitor_id = ?1
          `).bind(visitorId).run();
        }
      } else {
        await env.DB.prepare(`
          INSERT INTO visitors (
            visitor_id, first_seen_at, last_seen_at, last_visit_at,
            visit_count, page_views, returns_after_30m, returns_after_24h, returns_after_7d
          ) VALUES (?1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 1, 0, 0, 0)
          ON CONFLICT(visitor_id) DO UPDATE SET
            page_views = page_views + 1,
            last_seen_at = CURRENT_TIMESTAMP
        `).bind(visitorId).run();
      }
    }

    // 2. If tracking a normal Page View
    if (type === 'pageview' || path) {
      const normalizedPath = (path || '/').trim().toLowerCase();

      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS page_views (
          path TEXT PRIMARY KEY,
          views INTEGER DEFAULT 0,
          last_viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `).run();

      await env.DB.prepare(`
        INSERT INTO page_views (path, views, last_viewed_at)
        VALUES (?1, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(path) DO UPDATE SET
          views = views + 1,
          last_viewed_at = CURRENT_TIMESTAMP
      `).bind(normalizedPath).run();

      return new Response(JSON.stringify({ success: true, type: 'pageview', path: normalizedPath }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 3. If tracking a Shortlink Click
    slug = (slug || '').trim().toLowerCase();

    if (!slug) {
      return new Response(JSON.stringify({ error: 'Missing slug or path parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS link_clicks (
        slug TEXT PRIMARY KEY,
        target TEXT,
        clicks INTEGER DEFAULT 0,
        last_clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).run();

    await env.DB.prepare(`
      INSERT INTO link_clicks (slug, target, clicks, last_clicked_at)
      VALUES (?1, ?2, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET
        clicks = clicks + 1,
        last_clicked_at = CURRENT_TIMESTAMP,
        target = CASE WHEN ?2 IS NOT NULL AND ?2 != '' THEN ?2 ELSE target END
    `).bind(slug, target).run();

    return new Response(JSON.stringify({ success: true, type: 'shortlink', slug }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

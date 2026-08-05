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

  let slug = '';
  let target = '';

  const url = new URL(request.url);
  slug = url.searchParams.get('slug') || '';
  target = url.searchParams.get('target') || '';

  if (request.method === 'POST') {
    try {
      const body = await request.json() as any;
      if (body?.slug) slug = body.slug;
      if (body?.target) target = body.target;
    } catch {
      // Body might be empty or form encoded
    }
  }

  slug = slug.trim().toLowerCase();

  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'D1 Database binding DB not found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Ensure table exists
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS link_clicks (
        slug TEXT PRIMARY KEY,
        target TEXT,
        clicks INTEGER DEFAULT 0,
        last_clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).run();

    // Upsert click count
    await env.DB.prepare(`
      INSERT INTO link_clicks (slug, target, clicks, last_clicked_at)
      VALUES (?1, ?2, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET
        clicks = clicks + 1,
        last_clicked_at = CURRENT_TIMESTAMP,
        target = CASE WHEN ?2 IS NOT NULL AND ?2 != '' THEN ?2 ELSE target END
    `).bind(slug, target).run();

    return new Response(JSON.stringify({ success: true, slug }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

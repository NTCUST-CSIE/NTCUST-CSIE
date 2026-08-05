interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'D1 Database binding DB not found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Ensure traffic_stats exists
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS traffic_stats (
        path TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        target TEXT DEFAULT '',
        hits INTEGER DEFAULT 0,
        last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).run();

    const { results } = await env.DB.prepare(
      `SELECT 
        path,
        REPLACE(path, '/', '') as slug, 
        target, 
        hits as clicks, 
        datetime(last_accessed_at, '+8 hours') as last_clicked_tw 
      FROM traffic_stats 
      WHERE type = 'shortlink'
      ORDER BY hits DESC, last_accessed_at DESC`
    ).all();

    return new Response(JSON.stringify({ success: true, count: results.length, data: results }, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

import eggsConfig from '../../src/data/eggs.json';

interface Env {
  DB: D1Database;
}

// SHA-256 of the full CSIE CTF flag, so the flag itself never ships in this file
const CTF_FLAG_SHA256 = 'b27f175ad44243cb5b1a7075fc0ffebf1e2f5366ad724f1aeae3f6677b18cc68';

const eggIds = new Set((eggsConfig as { id: string }[]).map(e => e.id));

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });

const ensureTable = (db: D1Database) =>
  db.prepare(`
    CREATE TABLE IF NOT EXISTS egg_finds (
      egg TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      found_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (egg, visitor_id)
    );
  `).run();

const sha256 = async (text: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
};

// POST { egg, visitor_id, flag? } -> records the discovery once per visitor and returns their rank
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let egg = '';
  let visitorId = '';
  let flag = '';
  try {
    const body = await request.json() as { egg?: unknown; visitor_id?: unknown; flag?: unknown };
    egg = typeof body?.egg === 'string' ? body.egg : '';
    visitorId = typeof body?.visitor_id === 'string' ? body.visitor_id.slice(0, 64) : '';
    flag = typeof body?.flag === 'string' ? body.flag.trim() : '';
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  if (!eggIds.has(egg) || !visitorId) {
    return json({ success: false, error: 'Unknown egg or missing visitor_id' }, 400);
  }

  // The CTF egg only counts with the correct flag
  if (egg === 'ctf' && await sha256(flag) !== CTF_FLAG_SHA256) {
    return json({ success: false, error: 'Wrong flag' }, 403);
  }

  try {
    if (!env.DB) {
      return json({ error: 'D1 Database binding DB not found' }, 500);
    }

    await ensureTable(env.DB);

    await env.DB.prepare(`
      INSERT INTO egg_finds (egg, visitor_id, found_at)
      VALUES (?1, ?2, CURRENT_TIMESTAMP)
      ON CONFLICT(egg, visitor_id) DO NOTHING
    `).bind(egg, visitorId).run();

    const stats = await env.DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM egg_finds
          WHERE egg = ?1 AND rowid <= (SELECT rowid FROM egg_finds WHERE egg = ?1 AND visitor_id = ?2)) as rank,
        (SELECT COUNT(*) FROM egg_finds WHERE egg = ?1) as total
    `).bind(egg, visitorId).first() as { rank: number; total: number } | null;

    return json({ success: true, egg, rank: stats?.rank ?? 0, total: stats?.total ?? 0 });
  } catch (err: any) {
    return json({ success: false, error: err.message }, 500);
  }
};

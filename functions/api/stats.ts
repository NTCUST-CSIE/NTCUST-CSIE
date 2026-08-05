interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const wantsJson = url.searchParams.get('format') === 'json' || request.headers.get('accept')?.includes('application/json');

  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'D1 Database binding DB not found' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Ensure tables exist
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS page_views (
        path TEXT PRIMARY KEY,
        views INTEGER DEFAULT 0,
        last_viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS link_clicks (
        slug TEXT PRIMARY KEY,
        target TEXT,
        clicks INTEGER DEFAULT 0,
        last_clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).run();

    // Query Page Views
    const pageViewsQuery = await env.DB.prepare(
      `SELECT path, views, datetime(last_viewed_at, '+8 hours') as last_viewed_tw FROM page_views ORDER BY views DESC`
    ).all();

    // Query Shortlink Clicks
    const linkClicksQuery = await env.DB.prepare(
      `SELECT slug, target, clicks, datetime(last_clicked_at, '+8 hours') as last_clicked_tw FROM link_clicks ORDER BY clicks DESC`
    ).all();

    const pageViews = pageViewsQuery.results || [];
    const linkClicks = linkClicksQuery.results || [];

    const totalViews = pageViews.reduce((acc, row: any) => acc + (row.views || 0), 0);
    const totalClicks = linkClicks.reduce((acc, row: any) => acc + (row.clicks || 0), 0);

    if (wantsJson) {
      return new Response(
        JSON.stringify({
          success: true,
          summary: { totalPageViews: totalViews, totalShortlinkClicks: totalClicks },
          pageViews,
          shortlinkClicks: linkClicks,
        }, null, 2),
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // Return a clean visual HTML dashboard
    const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>網站流量與點擊統計 | NTCUST CSIE</title>
  <style>
    :root {
      --bg: #0d1117;
      --card-bg: rgba(22, 27, 34, 0.8);
      --border: rgba(255, 255, 255, 0.1);
      --primary: #00a8f0;
      --text: #f0f6fc;
      --muted: #8b949e;
      --accent: #238636;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 2rem 1rem;
      display: flex;
      justify-content: center;
    }
    .container {
      width: 100%;
      max-width: 900px;
    }
    h1 {
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .subtitle {
      color: var(--muted);
      margin-bottom: 2rem;
      font-size: 0.95rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
    }
    .stat-label {
      color: var(--muted);
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary);
    }
    .section-title {
      font-size: 1.3rem;
      margin: 2rem 0 1rem;
      border-left: 4px solid var(--primary);
      padding-left: 0.75rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 2rem;
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      background: rgba(255, 255, 255, 0.05);
      color: var(--muted);
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(0, 168, 240, 0.15);
      color: var(--primary);
      font-weight: 600;
      font-size: 0.85rem;
    }
    .target-url {
      color: var(--muted);
      font-size: 0.85rem;
      max-width: 280px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: inline-block;
    }
    .time {
      color: var(--muted);
      font-size: 0.85rem;
    }
    .footer-links {
      text-align: center;
      margin-top: 2rem;
      color: var(--muted);
      font-size: 0.85rem;
    }
    .footer-links a {
      color: var(--primary);
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 網站流量與點擊統計</h1>
    <div class="subtitle">國立臺中科技大學 資訊工程科 科學會 • 即時數據後台</div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">總頁面瀏覽量 (PV)</div>
        <div class="stat-value">${totalViews.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">短網址總點擊數</div>
        <div class="stat-value">${totalClicks.toLocaleString()}</div>
      </div>
    </div>

    <div class="section-title">📄 各頁面瀏覽次數 (Page Views)</div>
    <table>
      <thead>
        <tr>
          <th>頁面路徑</th>
          <th>瀏覽次數</th>
          <th>最後造訪時間 (台灣時間)</th>
        </tr>
      </thead>
      <tbody>
        ${pageViews.length > 0 ? pageViews.map((row: any) => `
          <tr>
            <td><code>${row.path}</code></td>
            <td><span class="badge">${row.views}</span></td>
            <td class="time">${row.last_viewed_tw || '-'}</td>
          </tr>
        `).join('') : '<tr><td colspan="3" style="text-align: center; color: var(--muted);">尚無頁面造訪紀錄</td></tr>'}
      </tbody>
    </table>

    <div class="section-title">🔗 短網址點擊次數 (Shortlink Clicks)</div>
    <table>
      <thead>
        <tr>
          <th>短網址代稱</th>
          <th>目標網址</th>
          <th>點擊次數</th>
          <th>最後點擊時間 (台灣時間)</th>
        </tr>
      </thead>
      <tbody>
        ${linkClicks.length > 0 ? linkClicks.map((row: any) => `
          <tr>
            <td><code>/${row.slug}</code></td>
            <td><span class="target-url" title="${row.target}">${row.target || '-'}</span></td>
            <td><span class="badge">${row.clicks}</span></td>
            <td class="time">${row.last_clicked_tw || '-'}</td>
          </tr>
        `).join('') : '<tr><td colspan="4" style="text-align: center; color: var(--muted);">尚無短網址點擊紀錄</td></tr>'}
      </tbody>
    </table>

    <div class="footer-links">
      <a href="?format=json">檢視 JSON 格式</a> • <a href="/">回首頁</a>
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
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

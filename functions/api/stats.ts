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

    // Ensure all tables exist
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

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS visitors (
        visitor_id TEXT PRIMARY KEY,
        first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        visit_count INTEGER DEFAULT 1,
        page_views INTEGER DEFAULT 1
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

    // Query Visitors Summary
    const visitorsSummaryQuery = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_visitors,
        SUM(CASE WHEN visit_count > 1 THEN 1 ELSE 0 END) as returning_visitors,
        SUM(CASE WHEN visit_count = 1 THEN 1 ELSE 0 END) as new_visitors,
        SUM(visit_count) as total_sessions
      FROM visitors
    `).first() as any;

    const pageViews = pageViewsQuery.results || [];
    const linkClicks = linkClicksQuery.results || [];

    const totalViews = pageViews.reduce((acc, row: any) => acc + (row.views || 0), 0);
    const totalClicks = linkClicks.reduce((acc, row: any) => acc + (row.clicks || 0), 0);

    const totalVisitors = visitorsSummaryQuery?.total_visitors || 0;
    const returningVisitors = visitorsSummaryQuery?.returning_visitors || 0;
    const newVisitors = visitorsSummaryQuery?.new_visitors || 0;
    const totalSessions = visitorsSummaryQuery?.total_sessions || 0;
    const returningRate = totalVisitors > 0 ? ((returningVisitors / totalVisitors) * 100).toFixed(1) + '%' : '0%';

    if (wantsJson) {
      return new Response(
        JSON.stringify({
          success: true,
          summary: {
            totalPageViews: totalViews,
            totalUniqueVisitors: totalVisitors,
            newVisitors,
            returningVisitors,
            returningRate,
            totalSessions,
            totalShortlinkClicks: totalClicks,
          },
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

    // Return visual HTML dashboard
    const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>網站流量與訪客統計 | NTCUST CSIE</title>
  <style>
    :root {
      --bg: #0d1117;
      --card-bg: rgba(22, 27, 34, 0.85);
      --border: rgba(255, 255, 255, 0.1);
      --primary: #00a8f0;
      --green: #3fb950;
      --purple: #bc8cff;
      --orange: #f0883e;
      --text: #f0f6fc;
      --muted: #8b949e;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 2.5rem 1rem;
      display: flex;
      justify-content: center;
    }
    .container {
      width: 100%;
      max-width: 950px;
    }
    h1 {
      font-size: 1.85rem;
      margin: 0 0 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .subtitle {
      color: var(--muted);
      margin-bottom: 2rem;
      font-size: 0.95rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2.5rem;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem 1.4rem;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    .stat-label {
      color: var(--muted);
      font-size: 0.85rem;
      margin-bottom: 0.4rem;
      font-weight: 500;
    }
    .stat-value {
      font-size: 1.85rem;
      font-weight: 700;
      color: var(--primary);
    }
    .stat-value.green { color: var(--green); }
    .stat-value.purple { color: var(--purple); }
    .stat-value.orange { color: var(--orange); }
    
    .section-title {
      font-size: 1.25rem;
      margin: 2.5rem 0 1rem;
      border-left: 4px solid var(--primary);
      padding-left: 0.75rem;
      font-weight: 600;
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
      background: rgba(255, 255, 255, 0.04);
      color: var(--muted);
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      background: rgba(0, 168, 240, 0.15);
      color: var(--primary);
      font-weight: 600;
      font-size: 0.85rem;
    }
    .target-url {
      color: var(--muted);
      font-size: 0.85rem;
      max-width: 320px;
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
      margin-top: 3rem;
      color: var(--muted);
      font-size: 0.9rem;
    }
    .footer-links a {
      color: var(--primary);
      text-decoration: none;
      margin: 0 0.5rem;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 網站流量與訪客統計</h1>
    <div class="subtitle">國立臺中科技大學 資訊工程科 科學會 • 即時數據後台</div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">總頁面瀏覽量 (PV)</div>
        <div class="stat-value">${totalViews.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">獨立訪客人數 (UV)</div>
        <div class="stat-value green">${totalVisitors.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">重複訪客 (回訪人數)</div>
        <div class="stat-value purple">${returningVisitors.toLocaleString()} <span style="font-size: 1rem; font-weight: normal; color: var(--muted);">(${returningRate})</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">新訪客人數</div>
        <div class="stat-value orange">${newVisitors.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">短網址總點擊</div>
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
      <a href="?format=json">檢視純 JSON 格式</a> • <a href="/">回到網站首頁</a>
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

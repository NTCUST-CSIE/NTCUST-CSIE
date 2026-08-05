interface Env {
  DB: D1Database;
  STATS_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const wantsJson = url.searchParams.get('format') === 'json' || request.headers.get('accept')?.includes('application/json');

  // Optional Secret Key check
  const providedKey = url.searchParams.get('key') || request.headers.get('x-admin-key');
  if (env.STATS_KEY && env.STATS_KEY !== providedKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or missing secret key (?key=...)' }), {
      status: 401,
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

    // Ensure traffic_stats & visitors tables exist
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS traffic_stats (
        path TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        target TEXT DEFAULT '',
        hits INTEGER DEFAULT 0,
        last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).run();

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

    // Query Unified Traffic Stats
    const trafficQuery = await env.DB.prepare(`
      SELECT 
        path, 
        type, 
        target, 
        hits, 
        datetime(last_accessed_at, '+8 hours') as last_time_tw 
      FROM traffic_stats 
      ORDER BY hits DESC, last_accessed_at DESC
    `).all();

    // Query Visitors Summary
    const visitorsSummaryQuery = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_visitors,
        SUM(CASE WHEN visit_count > 1 THEN 1 ELSE 0 END) as returning_visitors,
        SUM(CASE WHEN visit_count = 1 THEN 1 ELSE 0 END) as new_visitors,
        SUM(visit_count) as total_sessions,
        SUM(returns_after_30m) as returns_after_30m,
        SUM(returns_after_24h) as returns_after_24h,
        SUM(returns_after_7d) as returns_after_7d
      FROM visitors
    `).first() as any;

    const allTraffic = trafficQuery.results || [];
    const pageTraffic = allTraffic.filter((item: any) => item.type === 'page');
    const shortlinkTraffic = allTraffic.filter((item: any) => item.type === 'shortlink');

    const totalViews = pageTraffic.reduce((acc, row: any) => acc + (row.hits || 0), 0);
    const totalClicks = shortlinkTraffic.reduce((acc, row: any) => acc + (row.hits || 0), 0);

    const totalVisitors = visitorsSummaryQuery?.total_visitors || 0;
    const returningVisitors = visitorsSummaryQuery?.returning_visitors || 0;
    const newVisitors = visitorsSummaryQuery?.new_visitors || 0;
    const totalSessions = visitorsSummaryQuery?.total_sessions || 0;
    const returnsAfter30m = visitorsSummaryQuery?.returns_after_30m || 0;
    const returnsAfter24h = visitorsSummaryQuery?.returns_after_24h || 0;
    const returnsAfter7d = visitorsSummaryQuery?.returns_after_7d || 0;
    const returningRate = totalVisitors > 0 ? ((returningVisitors / totalVisitors) * 100).toFixed(1) + '%' : '0%';

    if (wantsJson) {
      return new Response(
        JSON.stringify({
          success: true,
          summary: {
            totalPageViews: totalViews,
            totalShortlinkClicks: totalClicks,
            totalUniqueVisitors: totalVisitors,
            newVisitors,
            returningVisitors,
            returningRate,
            totalSessions,
            returnsAfter30m,
            returnsAfter24h,
            returnsAfter7d,
          },
          traffic: allTraffic,
          pages: pageTraffic,
          shortlinks: shortlinkTraffic,
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

    // HTML Unified Dashboard
    const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>網站整合流量統計 | NTCUST CSIE</title>
  <style>
    :root {
      --bg: #0d1117;
      --card-bg: rgba(22, 27, 34, 0.85);
      --border: rgba(255, 255, 255, 0.1);
      --primary: #00a8f0;
      --green: #3fb950;
      --purple: #bc8cff;
      --orange: #f0883e;
      --cyan: #39c5bb;
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
      max-width: 960px;
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
      margin-bottom: 1.5rem;
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
    .stat-value.cyan { color: var(--cyan); }
    
    .section-title {
      font-size: 1.25rem;
      margin: 2.5rem 0 1rem;
      border-left: 4px solid var(--primary);
      padding-left: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .filter-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .filter-btn {
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--muted);
      padding: 6px 14px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s;
    }
    .filter-btn:hover, .filter-btn.active {
      color: #fff;
      border-color: var(--primary);
      background: rgba(0, 168, 240, 0.15);
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
    .badge.purple {
      background: rgba(188, 140, 255, 0.15);
      color: var(--purple);
    }
    .badge.cyan {
      background: rgba(57, 197, 187, 0.15);
      color: var(--cyan);
    }
    .badge.green {
      background: rgba(63, 185, 80, 0.15);
      color: var(--green);
    }
    .type-tag {
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .type-tag.page { background: rgba(0, 168, 240, 0.15); color: var(--primary); }
    .type-tag.shortlink { background: rgba(188, 140, 255, 0.15); color: var(--purple); }
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
    <h1>📊 網站整合流量與回訪統計</h1>
    <div class="subtitle">國立臺中科技大學 資訊工程科 科學會 • Cloudflare D1 整合資料庫</div>

    <div class="section-title" style="margin-top:0;">👥 訪客總覽指標</div>
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
        <div class="stat-label">累積回訪訪客 (回訪率)</div>
        <div class="stat-value purple">${returningVisitors.toLocaleString()} <span style="font-size: 0.95rem; font-weight: normal; color: var(--muted);">(${returningRate})</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">短網址總點擊數</div>
        <div class="stat-value cyan">${totalClicks.toLocaleString()}</div>
      </div>
    </div>

    <div class="section-title">⏳ 時間區間回頭客次數（間隔造訪）</div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">超過 30 分鐘 重新回訪</div>
        <div class="stat-value cyan">${returnsAfter30m.toLocaleString()} <span style="font-size: 0.9rem; font-weight: normal; color: var(--muted);">次</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">超過 24 小時 (隔日) 回頭客</div>
        <div class="stat-value purple">${returnsAfter24h.toLocaleString()} <span style="font-size: 0.9rem; font-weight: normal; color: var(--muted);">次</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">超過 7 天 (跨週) 長期回頭客</div>
        <div class="stat-value green">${returnsAfter7d.toLocaleString()} <span style="font-size: 0.9rem; font-weight: normal; color: var(--muted);">次</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">初次造訪新訪客</div>
        <div class="stat-value orange">${newVisitors.toLocaleString()}</div>
      </div>
    </div>

    <div class="section-title">
      <span>🚀 整合流量排行 (traffic_stats)</span>
    </div>

    <div class="filter-tabs">
      <button class="filter-btn active" onclick="filterTable('all', this)">全部清單 (${allTraffic.length})</button>
      <button class="filter-btn" onclick="filterTable('page', this)">📄 頁面瀏覽 (${pageTraffic.length})</button>
      <button class="filter-btn" onclick="filterTable('shortlink', this)">🔗 短網址點擊 (${shortlinkTraffic.length})</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>路徑 / 代稱</th>
          <th>類型</th>
          <th>訪問 / 點擊次數</th>
          <th>跳轉目標網址</th>
          <th>最後造訪時間 (台灣時間)</th>
        </tr>
      </thead>
      <tbody id="traffic-body">
        ${allTraffic.length > 0 ? allTraffic.map((row: any) => `
          <tr data-type="${row.type}">
            <td><code>${row.path}</code></td>
            <td><span class="type-tag ${row.type}">${row.type === 'page' ? '頁面' : '短網址'}</span></td>
            <td><span class="badge ${row.type === 'page' ? '' : 'cyan'}">${row.hits}</span></td>
            <td><span class="target-url" title="${row.target}">${row.target ? row.target : '-'}</span></td>
            <td class="time">${row.last_time_tw || '-'}</td>
          </tr>
        `).join('') : '<tr><td colspan="5" style="text-align: center; color: var(--muted);">尚無流量紀錄</td></tr>'}
      </tbody>
    </table>

    <div class="footer-links">
      <a href="?format=json">檢視純 JSON 格式</a> • <a href="/api/clicks">短網址專用 API</a> • <a href="/">回到網站首頁</a>
    </div>
  </div>

  <script>
    function filterTable(type, btn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const rows = document.querySelectorAll('#traffic-body tr');
      rows.forEach(r => {
        if (type === 'all' || r.getAttribute('data-type') === type) {
          r.style.display = '';
        } else {
          r.style.display = 'none';
        }
      });
    }
  </script>
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

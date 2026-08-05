import shortlinksConfig from '../../src/data/404.json';

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

    // Auto-sync standard website pages into traffic_stats
    const standardPages = ['/', '/members', '/events', '/finance', '/feedback', '/aichat'];
    for (const pagePath of standardPages) {
      await env.DB.prepare(`
        INSERT INTO traffic_stats (path, type, target, hits, last_accessed_at)
        VALUES (?1, 'page', '', 0, CURRENT_TIMESTAMP)
        ON CONFLICT(path) DO NOTHING;
      `).bind(pagePath).run();
    }

    // Auto-sync shortlinks from 404.json into traffic_stats
    if (shortlinksConfig && typeof shortlinksConfig === 'object') {
      for (const [key, target] of Object.entries(shortlinksConfig as Record<string, string>)) {
        if (!key || typeof target !== 'string') continue;
        if (target.startsWith('http://') || target.startsWith('https://')) {
          const normalizedPath = '/' + key.trim().toLowerCase();
          await env.DB.prepare(`
            INSERT INTO traffic_stats (path, type, target, hits, last_accessed_at)
            VALUES (?1, 'shortlink', ?2, 0, CURRENT_TIMESTAMP)
            ON CONFLICT(path) DO UPDATE SET
              target = ?2
          `).bind(normalizedPath, target).run();
        }
      }
    }

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
        SUM(CASE WHEN returns_after_30m > 0 THEN 1 ELSE 0 END) as returning_visitors,
        SUM(CASE WHEN returns_after_30m = 0 THEN 1 ELSE 0 END) as new_visitors,
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

    // HTML Unified Dashboard using strictly Phosphor Icons
    const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>網站整合流量統計 | NTCUST CSIE</title>
  <script src="https://unpkg.com/@phosphor-icons/web@2.1.2"></script>
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
    h1 i {
      color: var(--primary);
    }
    .subtitle {
      color: var(--muted);
      margin-bottom: 2rem;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
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
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .stat-label i {
      font-size: 1.1rem;
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
      gap: 0.5rem;
    }
    .filter-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
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
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
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
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
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
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .footer-links a {
      color: var(--primary);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1><i class="ph ph-chart-bar"></i> 網站整合流量與回訪統計</h1>
    <div class="subtitle"><i class="ph ph-database"></i> 國立臺中科技大學 資訊工程科 科學會 網頁瀏覽統計</div>

    <div class="section-title" style="margin-top:0;"><i class="ph ph-users"></i> 訪客總覽指標</div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label"><i class="ph ph-eye"></i> 總頁面瀏覽量 (PV)</div>
        <div class="stat-value">${totalViews.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label"><i class="ph ph-user"></i> 獨立訪客人數 (UV)</div>
        <div class="stat-value green">${totalVisitors.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label"><i class="ph ph-arrows-clockwise"></i> 累積回訪訪客</div>
        <div class="stat-value purple">${returningVisitors.toLocaleString()} <span style="font-size: 0.95rem; font-weight: normal; color: var(--muted);">(${returningRate})</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label"><i class="ph ph-link"></i> 短網址總點擊數</div>
        <div class="stat-value cyan">${totalClicks.toLocaleString()}</div>
      </div>
    </div>

    <div class="section-title"><i class="ph ph-clock-counter-clockwise"></i> 時間區間</div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label"><i class="ph ph-clock-countdown"></i> 超過 30 分鐘</div>
        <div class="stat-value cyan">${returnsAfter30m.toLocaleString()} <span style="font-size: 0.9rem; font-weight: normal; color: var(--muted);">次</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label"><i class="ph ph-calendar"></i> 超過 24 小時</div>
        <div class="stat-value purple">${returnsAfter24h.toLocaleString()} <span style="font-size: 0.9rem; font-weight: normal; color: var(--muted);">次</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label"><i class="ph ph-calendar-check"></i> 超過 7 天</div>
        <div class="stat-value green">${returnsAfter7d.toLocaleString()} <span style="font-size: 0.9rem; font-weight: normal; color: var(--muted);">次</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label"><i class="ph ph-user-plus"></i> 初次造訪</div>
        <div class="stat-value orange">${newVisitors.toLocaleString()}</div>
      </div>
    </div>

    <div class="section-title">
      <i class="ph ph-chart-line-up"></i>
      <span>整合流量排行 (traffic_stats)</span>
    </div>

    <div class="filter-tabs">
      <button class="filter-btn active" onclick="filterTable('all', this)"><i class="ph ph-list-dashes"></i> 全部 (${allTraffic.length})</button>
      <button class="filter-btn" onclick="filterTable('page', this)"><i class="ph ph-file-text"></i> 頁面 (${pageTraffic.length})</button>
      <button class="filter-btn" onclick="filterTable('shortlink', this)"><i class="ph ph-link-simple"></i> 短網址 (${shortlinkTraffic.length})</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>路徑</th>
          <th>類型</th>
          <th>訪問次數</th>
          <th>目標網址</th>
          <th>最後造訪時間</th>
        </tr>
      </thead>
      <tbody id="traffic-body">
        ${allTraffic.length > 0 ? allTraffic.map((row: any) => `
          <tr data-type="${row.type}">
            <td><code>${row.path}</code></td>
            <td>
              <span class="type-tag ${row.type}">
                <i class="${row.type === 'page' ? 'ph ph-file-text' : 'ph ph-arrow-square-out'}"></i>
                ${row.type === 'page' ? '頁面' : '短網址'}
              </span>
            </td>
            <td><span class="badge ${row.type === 'page' ? '' : 'cyan'}">${row.hits}</span></td>
            <td><span class="target-url" title="${row.target}">${row.target ? row.target : '-'}</span></td>
            <td class="time">${row.last_time_tw || '-'}</td>
          </tr>
        `).join('') : '<tr><td colspan="5" style="text-align: center; color: var(--muted);">尚無流量紀錄</td></tr>'}
      </tbody>
    </table>

    <div class="footer-links">
      <a href="?format=json"><i class="ph ph-code"></i> 檢視純 JSON 格式</a>
      <a href="/api/clicks"><i class="ph ph-link"></i> 短網址專用 API</a>
      <a href="/"><i class="ph ph-house"></i> 回到網站首頁</a>
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

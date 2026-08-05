export function getVisitorInfo() {
  let vid = '';
  try {
    vid = localStorage.getItem('csie_vid') || '';
    if (!vid) {
      vid = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : 'v_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem('csie_vid', vid);
    }
  } catch {
    vid = 'anonymous_' + Math.random().toString(36).substring(2, 8);
  }

  let isNewSession = false;
  try {
    const sessionKey = 'csie_session_active';
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      isNewSession = true;
    }
  } catch {
    isNewSession = true;
  }

  return { vid, isNewSession };
}

export function trackEvent(params: {
  type: 'pageview' | 'shortlink';
  path?: string;
  slug?: string;
  target?: string;
}) {
  try {
    const { vid, isNewSession } = getVisitorInfo();
    const payload = JSON.stringify({
      ...params,
      visitor_id: vid,
      is_new_session: isNewSession
    });

    const query = new URLSearchParams({
      type: params.type || '',
      path: params.path || '',
      slug: params.slug || '',
      target: params.target || '',
      visitor_id: vid,
      is_new_session: isNewSession ? 'true' : 'false',
    }).toString();

    const trackUrl = `/api/track?${query}`;

    // 1. Try Beacon API
    let sent = false;
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        sent = navigator.sendBeacon(trackUrl, payload);
      } catch {
        sent = false;
      }
    }

    // 2. Fallback to fetch with keepalive
    if (!sent && typeof fetch !== 'undefined') {
      fetch(trackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
        mode: 'no-cors'
      }).catch(() => {});
    }
  } catch {
    // Fail silently to avoid blocking user flow
  }
}

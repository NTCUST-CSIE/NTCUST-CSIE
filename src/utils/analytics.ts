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

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  } catch {
    // Fail silently to avoid blocking user flow
  }
}

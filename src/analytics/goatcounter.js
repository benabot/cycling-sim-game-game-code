export function trackEvent(name) {
  try {
    if (!name || typeof name !== 'string') return;
    if (name.startsWith('/')) return;
    if (typeof window === 'undefined') return;

    try {
      if (localStorage.getItem('analytics_optout') === '1') return;
    } catch (err) {}

    if (!window.goatcounter || typeof window.goatcounter.count !== 'function') return;
    window.goatcounter.count({ event: true, path: name });
  } catch (err) {}
}

const dedupeSessionCache = new Set();

export function isOptedOut() {
  try {
    return localStorage.getItem('analytics_optout') === '1';
  } catch (err) {
    return false;
  }
}

function getGoatcounter() {
  if (typeof window === 'undefined') return null;
  return window.goatcounter || null;
}

function shouldDedupeEvent(name) {
  return name === 'setup_option_confirm';
}

function isEventDeduped(name) {
  if (!shouldDedupeEvent(name)) return false;
  const key = `gc_event_${name}`;
  try {
    if (typeof sessionStorage !== 'undefined') {
      if (sessionStorage.getItem(key) === '1') return true;
      sessionStorage.setItem(key, '1');
      return false;
    }
  } catch (err) {}
  if (dedupeSessionCache.has(key)) return true;
  dedupeSessionCache.add(key);
  return false;
}

export function trackEvent(name) {
  try {
    if (!name || typeof name !== 'string') return;
    if (name.startsWith('/')) return;
    if (isOptedOut()) return;
    if (isEventDeduped(name)) return;

    const goatcounter = getGoatcounter();
    if (!goatcounter || typeof goatcounter.count !== 'function') return;
    goatcounter.count({ event: true, path: name });
  } catch (err) {}
}

export function trackPageview(path) {
  try {
    if (isOptedOut()) return;
    const goatcounter = getGoatcounter();
    if (!goatcounter || typeof goatcounter.count !== 'function') return;
    const target = path || (typeof window !== 'undefined' ? window.location?.pathname : null);
    if (!target || typeof target !== 'string') return;
    goatcounter.count({ path: target });
  } catch (err) {}
}

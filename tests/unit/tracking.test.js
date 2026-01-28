import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackEvent, trackPageview, isOptedOut } from '../../src/analytics/goatcounter.js';

function createStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    _dump: () => ({ ...store })
  };
}

describe('tracking wrapper', () => {
  let originalWindow;
  let originalLocalStorage;
  let originalSessionStorage;

  beforeEach(() => {
    originalWindow = globalThis.window;
    originalLocalStorage = globalThis.localStorage;
    originalSessionStorage = globalThis.sessionStorage;
    globalThis.localStorage = createStorage();
    globalThis.sessionStorage = createStorage();
    globalThis.window = {
      location: { pathname: '/test' },
      goatcounter: { count: vi.fn() }
    };
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.localStorage = originalLocalStorage;
    globalThis.sessionStorage = originalSessionStorage;
    vi.restoreAllMocks();
  });

  it('opt-out disables tracking', () => {
    globalThis.localStorage.setItem('analytics_optout', '1');
    expect(isOptedOut()).toBe(true);
    trackEvent('setup_complete');
    trackPageview('/optout');
    expect(globalThis.window.goatcounter.count).not.toHaveBeenCalled();
  });

  it('opt-in allows tracking', () => {
    trackEvent('setup_complete');
    trackPageview('/optin');
    expect(globalThis.window.goatcounter.count).toHaveBeenCalledWith({ event: true, path: 'setup_complete' });
    expect(globalThis.window.goatcounter.count).toHaveBeenCalledWith({ path: '/optin' });
  });

  it('dedupes setup_option_confirm per session', () => {
    trackEvent('setup_option_confirm');
    trackEvent('setup_option_confirm');
    const calls = globalThis.window.goatcounter.count.mock.calls.filter(call => call[0]?.path === 'setup_option_confirm');
    expect(calls.length).toBe(1);
  });
});

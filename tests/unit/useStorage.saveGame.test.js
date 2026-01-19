/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';

var authState;
var saveToCloudMock;
var fetchGamesMock;
var downloadCSGMock;

vi.mock('../../src/composables/useAuth.js', async () => {
  const { ref } = await import('vue');
  authState = {
    isAuthenticated: ref(true),
    isConfigured: ref(true)
  };
  return {
    useAuth: () => authState
  };
});

vi.mock('../../src/composables/useCloudSave.js', async () => {
  const { ref } = await import('vue');
  saveToCloudMock = vi.fn();
  fetchGamesMock = vi.fn();
  return {
    useCloudSave: () => ({
      saveToCloud: saveToCloudMock,
      fetchGames: fetchGamesMock,
      cloudGames: ref([]),
      loadFromCloud: vi.fn(),
      deleteFromCloud: vi.fn()
    })
  };
});

vi.mock('../../src/services/localSave.service.js', () => {
  downloadCSGMock = vi.fn();
  return {
    downloadCSG: downloadCSGMock
  };
});

import { useStorage } from '../../src/composables/useStorage.js';

const baseState = {
  riders: [{ id: 'r1', name: 'Test Rider', position: 1, hasFinished: false, team: 'team_a' }],
  course: [{ type: 'flat' }],
  currentTurn: 1,
  phase: 'playing',
  teamIds: ['team_a', 'team_b'],
  players: [{ teamId: 'team_a', playerType: 'human' }]
};

function createMemoryStorage() {
  let store = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    },
    key(index) {
      return Object.keys(store)[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    }
  };
}

describe('useStorage.saveGame routing', () => {
  beforeEach(() => {
    if (!globalThis.localStorage || typeof localStorage.clear !== 'function') {
      Object.defineProperty(globalThis, 'localStorage', {
        value: createMemoryStorage(),
        configurable: true
      });
    }
    localStorage.clear();
    saveToCloudMock.mockReset();
    fetchGamesMock.mockReset();
    downloadCSGMock.mockReset();
    authState.isAuthenticated.value = true;
    authState.isConfigured.value = true;
    fetchGamesMock.mockResolvedValue();
  });

  it('routes cloud saves to the cloud service', async () => {
    saveToCloudMock.mockResolvedValue({ success: true, game: { id: 'cloud-1' } });

    const { saveGame } = useStorage();
    await saveGame('Cloud Save', baseState);

    expect(saveToCloudMock).toHaveBeenCalledWith('Cloud Save', baseState, null);
    expect(downloadCSGMock).not.toHaveBeenCalled();
  });

  it('routes local saves to the download helper', async () => {
    const { saveGame } = useStorage();
    await saveGame('Local Save', baseState, { forceLocal: true });

    expect(downloadCSGMock).toHaveBeenCalledTimes(1);
    expect(saveToCloudMock).not.toHaveBeenCalled();
  });
});

/**
 * Unit tests for chrome storage helpers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getStorageValue,
  setStorageValue,
  removeStorageValue,
  clearStorage,
  getUserSettings,
  saveUserSettings,
  updateUserSettings,
  resetUserSettings,
  getLocalStorageValue,
  setLocalStorageValue,
} from '../src/shared/storage';
import { DEFAULT_USER_SETTINGS, STORAGE_KEYS, UserSettings } from '../src/shared/types';

// Mock chrome.storage API
const mockStorage: Record<string, unknown> = {};
const mockLocalStorage: Record<string, unknown> = {};

const createChromeMock = () => ({
  storage: {
    sync: {
      get: vi.fn((key: string) => {
        return Promise.resolve({ [key]: mockStorage[key] });
      }),
      set: vi.fn((items: Record<string, unknown>) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((key: string) => {
        delete mockStorage[key];
        return Promise.resolve();
      }),
      clear: vi.fn(() => {
        Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
        return Promise.resolve();
      }),
    },
    local: {
      get: vi.fn((key: string) => {
        return Promise.resolve({ [key]: mockLocalStorage[key] });
      }),
      set: vi.fn((items: Record<string, unknown>) => {
        Object.assign(mockLocalStorage, items);
        return Promise.resolve();
      }),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
});

// Chrome mock type for testing
type ChromeMock = ReturnType<typeof createChromeMock>;

describe('Storage Helpers', () => {
  beforeEach(() => {
    // Reset mock storage
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);

    // Setup chrome mock
    (globalThis as unknown as { chrome: ChromeMock }).chrome = createChromeMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getStorageValue', () => {
    it('should return stored value when it exists', async () => {
      mockStorage['testKey'] = 'testValue';

      await getStorageValue('userSettings', 'default');

      expect(chrome.storage.sync.get).toHaveBeenCalledWith('userSettings');
    });

    it('should return default value when key does not exist', async () => {
      const result = await getStorageValue('userSettings', 'defaultValue');

      expect(result).toBe('defaultValue');
    });

    it('should return default value on error', async () => {
      chrome.storage.sync.get = vi.fn().mockRejectedValue(new Error('Storage error'));

      const result = await getStorageValue('userSettings', 'fallback');

      expect(result).toBe('fallback');
    });
  });

  describe('setStorageValue', () => {
    it('should set value and return true on success', async () => {
      const result = await setStorageValue('userSettings', { test: 'data' });

      expect(result).toBe(true);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        userSettings: { test: 'data' },
      });
    });

    it('should return false on error', async () => {
      chrome.storage.sync.set = vi.fn().mockRejectedValue(new Error('Storage error'));

      const result = await setStorageValue('userSettings', 'value');

      expect(result).toBe(false);
    });
  });

  describe('removeStorageValue', () => {
    it('should remove value and return true on success', async () => {
      mockStorage['userSettings'] = 'toRemove';

      const result = await removeStorageValue('userSettings');

      expect(result).toBe(true);
      expect(chrome.storage.sync.remove).toHaveBeenCalledWith('userSettings');
    });

    it('should return false on error', async () => {
      chrome.storage.sync.remove = vi.fn().mockRejectedValue(new Error('Storage error'));

      const result = await removeStorageValue('userSettings');

      expect(result).toBe(false);
    });
  });

  describe('clearStorage', () => {
    it('should clear all storage and return true on success', async () => {
      mockStorage['key1'] = 'value1';
      mockStorage['key2'] = 'value2';

      const result = await clearStorage();

      expect(result).toBe(true);
      expect(chrome.storage.sync.clear).toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      chrome.storage.sync.clear = vi.fn().mockRejectedValue(new Error('Storage error'));

      const result = await clearStorage();

      expect(result).toBe(false);
    });
  });

  describe('getUserSettings', () => {
    it('should return stored settings merged with defaults', async () => {
      const partialSettings = { tier: 'pro' as const, enabled: false };
      mockStorage[STORAGE_KEYS.USER_SETTINGS] = partialSettings;

      const result = await getUserSettings();

      expect(result).toEqual({
        ...DEFAULT_USER_SETTINGS,
        ...partialSettings,
      });
    });

    it('should return default settings when none are stored', async () => {
      const result = await getUserSettings();

      expect(result).toEqual(DEFAULT_USER_SETTINGS);
    });
  });

  describe('saveUserSettings', () => {
    it('should save complete user settings', async () => {
      const settings: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        tier: 'pro',
        theme: 'dark',
      };

      const result = await saveUserSettings(settings);

      expect(result).toBe(true);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        [STORAGE_KEYS.USER_SETTINGS]: settings,
      });
    });
  });

  describe('updateUserSettings', () => {
    it('should merge updates with existing settings', async () => {
      mockStorage[STORAGE_KEYS.USER_SETTINGS] = { ...DEFAULT_USER_SETTINGS };

      const result = await updateUserSettings({ theme: 'dark' });

      expect(result).not.toBeNull();
      expect(result?.theme).toBe('dark');
      expect(result?.tier).toBe(DEFAULT_USER_SETTINGS.tier);
    });

    it('should return null on error', async () => {
      chrome.storage.sync.get = vi.fn().mockRejectedValue(new Error('Storage error'));

      const result = await updateUserSettings({ theme: 'dark' });

      expect(result).toBeNull();
    });
  });

  describe('resetUserSettings', () => {
    it('should reset settings to defaults', async () => {
      mockStorage[STORAGE_KEYS.USER_SETTINGS] = {
        ...DEFAULT_USER_SETTINGS,
        tier: 'pro',
        theme: 'dark',
      };

      const result = await resetUserSettings();

      expect(result).toBe(true);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        [STORAGE_KEYS.USER_SETTINGS]: DEFAULT_USER_SETTINGS,
      });
    });
  });

  describe('Local Storage Helpers', () => {
    describe('getLocalStorageValue', () => {
      it('should return stored value from local storage', async () => {
        mockLocalStorage['largeData'] = { data: 'large' };

        const result = await getLocalStorageValue('largeData', null);

        expect(chrome.storage.local.get).toHaveBeenCalledWith('largeData');
        expect(result).toEqual({ data: 'large' });
      });

      it('should return default value when key does not exist', async () => {
        const result = await getLocalStorageValue('nonexistent', 'default');

        expect(result).toBe('default');
      });

      it('should return default value on error', async () => {
        chrome.storage.local.get = vi.fn().mockRejectedValue(new Error('Storage error'));

        const result = await getLocalStorageValue('key', 'fallback');

        expect(result).toBe('fallback');
      });
    });

    describe('setLocalStorageValue', () => {
      it('should set value in local storage and return true', async () => {
        const result = await setLocalStorageValue('largeData', { size: 'big' });

        expect(result).toBe(true);
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
          largeData: { size: 'big' },
        });
      });

      it('should return false on error', async () => {
        chrome.storage.local.set = vi.fn().mockRejectedValue(new Error('Storage error'));

        const result = await setLocalStorageValue('key', 'value');

        expect(result).toBe(false);
      });
    });
  });
});

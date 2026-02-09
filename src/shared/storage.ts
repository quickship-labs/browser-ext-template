/**
 * Chrome storage helpers for type-safe storage operations
 */

import {
  UserSettings,
  DEFAULT_USER_SETTINGS,
  STORAGE_KEYS,
  StorageKey,
} from './types';

// ============================================================================
// Generic Storage Helpers
// ============================================================================

/**
 * Get a value from chrome.storage.sync
 */
export const getStorageValue = async <T>(key: StorageKey, defaultValue: T): Promise<T> => {
  try {
    const result = await chrome.storage.sync.get(key);
    return (result[key] as T) ?? defaultValue;
  } catch (error) {
    console.error(`Failed to get storage value for key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Set a value in chrome.storage.sync
 */
export const setStorageValue = async <T>(key: StorageKey, value: T): Promise<boolean> => {
  try {
    await chrome.storage.sync.set({ [key]: value });
    return true;
  } catch (error) {
    console.error(`Failed to set storage value for key "${key}":`, error);
    return false;
  }
};

/**
 * Remove a value from chrome.storage.sync
 */
export const removeStorageValue = async (key: StorageKey): Promise<boolean> => {
  try {
    await chrome.storage.sync.remove(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove storage value for key "${key}":`, error);
    return false;
  }
};

/**
 * Clear all values from chrome.storage.sync
 */
export const clearStorage = async (): Promise<boolean> => {
  try {
    await chrome.storage.sync.clear();
    return true;
  } catch (error) {
    console.error('Failed to clear storage:', error);
    return false;
  }
};

// ============================================================================
// User Settings Helpers
// ============================================================================

/**
 * Get user settings from storage
 */
export const getUserSettings = async (): Promise<UserSettings> => {
  const settings = await getStorageValue<UserSettings>(
    STORAGE_KEYS.USER_SETTINGS,
    DEFAULT_USER_SETTINGS
  );
  // Merge with defaults to ensure all fields exist
  return { ...DEFAULT_USER_SETTINGS, ...settings };
};

/**
 * Save user settings to storage
 */
export const saveUserSettings = async (settings: UserSettings): Promise<boolean> => {
  return setStorageValue(STORAGE_KEYS.USER_SETTINGS, settings);
};

/**
 * Update partial user settings
 */
export const updateUserSettings = async (
  updates: Partial<UserSettings>
): Promise<UserSettings | null> => {
  try {
    const currentSettings = await getUserSettings();
    const newSettings = { ...currentSettings, ...updates };
    const success = await saveUserSettings(newSettings);
    return success ? newSettings : null;
  } catch (error) {
    console.error('Failed to update user settings:', error);
    return null;
  }
};

/**
 * Reset user settings to defaults
 */
export const resetUserSettings = async (): Promise<boolean> => {
  return saveUserSettings(DEFAULT_USER_SETTINGS);
};

// ============================================================================
// Storage Change Listener
// ============================================================================

/**
 * Callback type for storage change listeners
 */
export type StorageChangeCallback = (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string
) => void;

/**
 * Add a listener for storage changes
 */
export const addStorageChangeListener = (callback: StorageChangeCallback): void => {
  chrome.storage.onChanged.addListener(callback);
};

/**
 * Remove a storage change listener
 */
export const removeStorageChangeListener = (callback: StorageChangeCallback): void => {
  chrome.storage.onChanged.removeListener(callback);
};

/**
 * Create a typed listener for user settings changes
 */
export const onUserSettingsChange = (
  callback: (newSettings: UserSettings, oldSettings: UserSettings | undefined) => void
): (() => void) => {
  const listener: StorageChangeCallback = (changes, areaName) => {
    if (areaName === 'sync' && changes[STORAGE_KEYS.USER_SETTINGS]) {
      const { newValue, oldValue } = changes[STORAGE_KEYS.USER_SETTINGS];
      callback(
        { ...DEFAULT_USER_SETTINGS, ...newValue } as UserSettings,
        oldValue as UserSettings | undefined
      );
    }
  };

  addStorageChangeListener(listener);
  return () => removeStorageChangeListener(listener);
};

// ============================================================================
// Local Storage (for larger data)
// ============================================================================

/**
 * Get a value from chrome.storage.local (for larger data)
 */
export const getLocalStorageValue = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const result = await chrome.storage.local.get(key);
    return (result[key] as T) ?? defaultValue;
  } catch (error) {
    console.error(`Failed to get local storage value for key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Set a value in chrome.storage.local
 */
export const setLocalStorageValue = async <T>(key: string, value: T): Promise<boolean> => {
  try {
    await chrome.storage.local.set({ [key]: value });
    return true;
  } catch (error) {
    console.error(`Failed to set local storage value for key "${key}":`, error);
    return false;
  }
};

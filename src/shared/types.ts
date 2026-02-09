/**
 * Shared TypeScript types for the browser extension
 */

// ============================================================================
// User & Subscription Types
// ============================================================================

/**
 * User subscription tier for freemium gating
 */
export type SubscriptionTier = 'free' | 'pro';

/**
 * User settings stored in chrome.storage.sync
 */
export interface UserSettings {
  /** User's subscription tier */
  tier: SubscriptionTier;
  /** Whether the extension is enabled */
  enabled: boolean;
  /** User's preferred theme */
  theme: 'light' | 'dark' | 'system';
  /** Notification preferences */
  notifications: {
    enabled: boolean;
    sound: boolean;
  };
  /** Custom user preferences (extensible) */
  preferences: Record<string, unknown>;
}

/**
 * Default user settings
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  tier: 'free',
  enabled: true,
  theme: 'system',
  notifications: {
    enabled: true,
    sound: false,
  },
  preferences: {},
};

// ============================================================================
// Message Types
// ============================================================================

/**
 * Base message interface for type-safe messaging
 */
export interface BaseMessage {
  type: string;
}

/**
 * Message types for communication between extension contexts
 */
export type MessageType =
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'GET_TAB_INFO'
  | 'CONTENT_SCRIPT_READY'
  | 'PERFORM_ACTION'
  | 'CHECK_FEATURE_ACCESS';

/**
 * Message to get current settings
 */
export interface GetSettingsMessage extends BaseMessage {
  type: 'GET_SETTINGS';
}

/**
 * Message to update settings
 */
export interface UpdateSettingsMessage extends BaseMessage {
  type: 'UPDATE_SETTINGS';
  payload: Partial<UserSettings>;
}

/**
 * Message to get current tab information
 */
export interface GetTabInfoMessage extends BaseMessage {
  type: 'GET_TAB_INFO';
}

/**
 * Message sent when content script is ready
 */
export interface ContentScriptReadyMessage extends BaseMessage {
  type: 'CONTENT_SCRIPT_READY';
  payload: {
    url: string;
    title: string;
  };
}

/**
 * Message to perform an action (example for extending)
 */
export interface PerformActionMessage extends BaseMessage {
  type: 'PERFORM_ACTION';
  payload: {
    action: string;
    data?: unknown;
  };
}

/**
 * Message to check if user has access to a feature
 */
export interface CheckFeatureAccessMessage extends BaseMessage {
  type: 'CHECK_FEATURE_ACCESS';
  payload: {
    feature: FeatureKey;
  };
}

/**
 * Union type of all message types
 */
export type ExtensionMessage =
  | GetSettingsMessage
  | UpdateSettingsMessage
  | GetTabInfoMessage
  | ContentScriptReadyMessage
  | PerformActionMessage
  | CheckFeatureAccessMessage;

// ============================================================================
// Response Types
// ============================================================================

/**
 * Generic response wrapper
 */
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Tab information response
 */
export interface TabInfo {
  id: number;
  url: string;
  title: string;
  favIconUrl?: string;
}

// ============================================================================
// Feature Gating Types
// ============================================================================

/**
 * Feature keys for freemium gating
 */
export type FeatureKey =
  | 'basic_feature'
  | 'advanced_analytics'
  | 'export_data'
  | 'custom_themes'
  | 'priority_support';

/**
 * Feature configuration
 */
export interface FeatureConfig {
  key: FeatureKey;
  name: string;
  description: string;
  requiredTier: SubscriptionTier;
}

/**
 * Feature access configuration
 * Maps features to their required subscription tier
 */
export const FEATURE_ACCESS: Record<FeatureKey, SubscriptionTier> = {
  basic_feature: 'free',
  advanced_analytics: 'pro',
  export_data: 'pro',
  custom_themes: 'pro',
  priority_support: 'pro',
};

/**
 * Check if a tier has access to a feature
 */
export const hasFeatureAccess = (tier: SubscriptionTier, feature: FeatureKey): boolean => {
  const requiredTier = FEATURE_ACCESS[feature];
  if (requiredTier === 'free') return true;
  return tier === 'pro';
};

// ============================================================================
// Storage Keys
// ============================================================================

/**
 * Storage keys used in chrome.storage
 */
export const STORAGE_KEYS = {
  USER_SETTINGS: 'userSettings',
  LAST_SYNC: 'lastSync',
  CACHE: 'cache',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

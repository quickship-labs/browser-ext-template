/**
 * Background Service Worker
 *
 * Handles:
 * - Message routing between extension contexts
 * - Storage operations
 * - Extension lifecycle events
 * - API calls (if needed)
 */

import {
  ExtensionMessage,
  MessageResponse,
  UserSettings,
  TabInfo,
  hasFeatureAccess,
  CheckFeatureAccessMessage,
  UpdateSettingsMessage,
} from '../shared/types';
import { getUserSettings, updateUserSettings } from '../shared/storage';
import { createMessageListener, MessageHandlerMap } from '../shared/messaging';

// ============================================================================
// Message Handlers
// ============================================================================

const messageHandlers: MessageHandlerMap = {
  GET_SETTINGS: async (): Promise<MessageResponse<UserSettings>> => {
    try {
      const settings = await getUserSettings();
      return { success: true, data: settings };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get settings',
      };
    }
  },

  UPDATE_SETTINGS: async (
    message: UpdateSettingsMessage
  ): Promise<MessageResponse<UserSettings>> => {
    try {
      const updatedSettings = await updateUserSettings(message.payload);
      if (updatedSettings) {
        return { success: true, data: updatedSettings };
      }
      return { success: false, error: 'Failed to update settings' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update settings',
      };
    }
  },

  GET_TAB_INFO: async (
    _message: ExtensionMessage,
    sender: chrome.runtime.MessageSender
  ): Promise<MessageResponse<TabInfo>> => {
    try {
      const tab = sender.tab;
      if (tab && tab.id) {
        return {
          success: true,
          data: {
            id: tab.id,
            url: tab.url || '',
            title: tab.title || '',
            favIconUrl: tab.favIconUrl,
          },
        };
      }
      // If called from popup, get the active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.id) {
        return {
          success: true,
          data: {
            id: activeTab.id,
            url: activeTab.url || '',
            title: activeTab.title || '',
            favIconUrl: activeTab.favIconUrl,
          },
        };
      }
      return { success: false, error: 'No active tab found' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get tab info',
      };
    }
  },

  CONTENT_SCRIPT_READY: async (
    _message: ExtensionMessage,
    sender: chrome.runtime.MessageSender
  ): Promise<MessageResponse<void>> => {
    // Log or handle content script initialization
    const tabId = sender.tab?.id;
    if (tabId) {
      // You can store tab state or perform initialization here
      console.warn(`Content script ready in tab ${tabId}`);
    }
    return { success: true };
  },

  PERFORM_ACTION: async (): Promise<MessageResponse<unknown>> => {
    // Placeholder for custom actions
    // Extend this handler based on your extension's needs
    return { success: true, data: { message: 'Action performed' } };
  },

  CHECK_FEATURE_ACCESS: async (
    message: CheckFeatureAccessMessage
  ): Promise<MessageResponse<boolean>> => {
    try {
      const settings = await getUserSettings();
      const hasAccess = hasFeatureAccess(settings.tier, message.payload.feature);
      return { success: true, data: hasAccess };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check feature access',
      };
    }
  },
};

// Register message listener
chrome.runtime.onMessage.addListener(createMessageListener(messageHandlers));

// ============================================================================
// Extension Lifecycle Events
// ============================================================================

/**
 * Called when the extension is first installed or updated
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // First installation - initialize settings
    console.warn('Extension installed');
    // Settings will be initialized with defaults on first access
  } else if (details.reason === 'update') {
    // Extension updated
    console.warn(`Extension updated from ${details.previousVersion}`);
    // Perform any migration if needed
  }
});

/**
 * Called when Chrome starts up
 */
chrome.runtime.onStartup.addListener(() => {
  console.warn('Browser started, extension active');
});

// ============================================================================
// Tab Events (optional - uncomment if needed)
// ============================================================================

// chrome.tabs.onActivated.addListener(async (activeInfo) => {
//   const tab = await chrome.tabs.get(activeInfo.tabId);
//   console.warn('Tab activated:', tab.url);
// });

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === 'complete') {
//     console.warn('Tab loaded:', tab.url);
//   }
// });

// ============================================================================
// Alarm Events (for scheduled tasks)
// ============================================================================

// Example: Create an alarm for periodic tasks
// chrome.alarms.create('periodicTask', { periodInMinutes: 60 });

// chrome.alarms.onAlarm.addListener((alarm) => {
//   if (alarm.name === 'periodicTask') {
//     // Perform periodic task
//   }
// });

// ============================================================================
// Context Menu (optional)
// ============================================================================

// chrome.runtime.onInstalled.addListener(() => {
//   chrome.contextMenus.create({
//     id: 'extensionAction',
//     title: 'Extension Action',
//     contexts: ['selection'],
//   });
// });

// chrome.contextMenus.onClicked.addListener((info, tab) => {
//   if (info.menuItemId === 'extensionAction' && info.selectionText) {
//     // Handle context menu action
//   }
// });

// ============================================================================
// Export for testing (if needed)
// ============================================================================

export { messageHandlers };

/**
 * Message passing helpers for communication between extension contexts
 */

import {
  ExtensionMessage,
  MessageResponse,
  GetSettingsMessage,
  UpdateSettingsMessage,
  GetTabInfoMessage,
  ContentScriptReadyMessage,
  PerformActionMessage,
  CheckFeatureAccessMessage,
  UserSettings,
  TabInfo,
  FeatureKey,
} from './types';

// ============================================================================
// Message Senders
// ============================================================================

/**
 * Send a message to the background service worker
 */
export const sendMessage = async <T>(message: ExtensionMessage): Promise<MessageResponse<T>> => {
  try {
    const response = await chrome.runtime.sendMessage<ExtensionMessage, MessageResponse<T>>(
      message
    );
    return response;
  } catch (error) {
    console.error('Failed to send message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Send a message to a specific tab's content script
 */
export const sendMessageToTab = async <T>(
  tabId: number,
  message: ExtensionMessage
): Promise<MessageResponse<T>> => {
  try {
    const response = await chrome.tabs.sendMessage<ExtensionMessage, MessageResponse<T>>(
      tabId,
      message
    );
    return response;
  } catch (error) {
    console.error(`Failed to send message to tab ${tabId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Send a message to all tabs
 */
export const broadcastToAllTabs = async <T>(
  message: ExtensionMessage
): Promise<Map<number, MessageResponse<T>>> => {
  const results = new Map<number, MessageResponse<T>>();
  try {
    const tabs = await chrome.tabs.query({});
    await Promise.all(
      tabs.map(async (tab) => {
        if (tab.id) {
          const response = await sendMessageToTab<T>(tab.id, message);
          results.set(tab.id, response);
        }
      })
    );
  } catch (error) {
    console.error('Failed to broadcast message:', error);
  }
  return results;
};

// ============================================================================
// Typed Message Senders
// ============================================================================

/**
 * Request current user settings from background
 */
export const requestSettings = async (): Promise<MessageResponse<UserSettings>> => {
  const message: GetSettingsMessage = { type: 'GET_SETTINGS' };
  return sendMessage<UserSettings>(message);
};

/**
 * Request to update user settings
 */
export const requestUpdateSettings = async (
  updates: Partial<UserSettings>
): Promise<MessageResponse<UserSettings>> => {
  const message: UpdateSettingsMessage = {
    type: 'UPDATE_SETTINGS',
    payload: updates,
  };
  return sendMessage<UserSettings>(message);
};

/**
 * Request current tab information
 */
export const requestTabInfo = async (): Promise<MessageResponse<TabInfo>> => {
  const message: GetTabInfoMessage = { type: 'GET_TAB_INFO' };
  return sendMessage<TabInfo>(message);
};

/**
 * Notify background that content script is ready
 */
export const notifyContentScriptReady = async (
  url: string,
  title: string
): Promise<MessageResponse<void>> => {
  const message: ContentScriptReadyMessage = {
    type: 'CONTENT_SCRIPT_READY',
    payload: { url, title },
  };
  return sendMessage<void>(message);
};

/**
 * Request to perform an action
 */
export const requestAction = async (
  action: string,
  data?: unknown
): Promise<MessageResponse<unknown>> => {
  const message: PerformActionMessage = {
    type: 'PERFORM_ACTION',
    payload: { action, data },
  };
  return sendMessage<unknown>(message);
};

/**
 * Check if user has access to a feature
 */
export const checkFeatureAccess = async (
  feature: FeatureKey
): Promise<MessageResponse<boolean>> => {
  const message: CheckFeatureAccessMessage = {
    type: 'CHECK_FEATURE_ACCESS',
    payload: { feature },
  };
  return sendMessage<boolean>(message);
};

// ============================================================================
// Message Handler Types
// ============================================================================

/**
 * Message handler function type
 */
export type MessageHandler<T extends ExtensionMessage = ExtensionMessage, R = unknown> = (
  message: T,
  sender: chrome.runtime.MessageSender
) => Promise<MessageResponse<R>> | MessageResponse<R>;

/**
 * Message handler map type
 */
export type MessageHandlerMap = {
  [K in ExtensionMessage['type']]?: MessageHandler<
    Extract<ExtensionMessage, { type: K }>,
    unknown
  >;
};

/**
 * Create a message listener with typed handlers
 */
export const createMessageListener = (
  handlers: MessageHandlerMap
): ((
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: MessageResponse) => void
) => boolean) => {
  return (message, sender, sendResponse) => {
    const handler = handlers[message.type];
    if (handler) {
      // Handle async handlers
      const result = handler(message as never, sender);
      if (result instanceof Promise) {
        result.then(sendResponse).catch((error) => {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
        return true; // Keep the message channel open for async response
      } else {
        sendResponse(result);
        return false;
      }
    }
    // No handler found
    sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
    return false;
  };
};

// ============================================================================
// Connection-based Messaging (for long-lived connections)
// ============================================================================

/**
 * Create a connection to the background service worker
 */
export const createConnection = (name: string): chrome.runtime.Port => {
  return chrome.runtime.connect({ name });
};

/**
 * Listen for connections from content scripts or popup
 */
export const onConnect = (
  callback: (port: chrome.runtime.Port) => void
): void => {
  chrome.runtime.onConnect.addListener(callback);
};

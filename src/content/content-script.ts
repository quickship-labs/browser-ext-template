/**
 * Content Script
 *
 * Runs in the context of web pages.
 * Can access and modify the DOM.
 *
 * IMPORTANT: Content scripts run in an isolated world and cannot access
 * the page's JavaScript variables. Use message passing to communicate
 * with the background service worker.
 */

import { notifyContentScriptReady, requestSettings, requestAction } from '../shared/messaging';
import { ExtensionMessage, MessageResponse, UserSettings } from '../shared/types';

// ============================================================================
// State
// ============================================================================

let isInitialized = false;
let currentSettings: UserSettings | null = null;

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the content script
 */
const initialize = async (): Promise<void> => {
  if (isInitialized) return;

  try {
    // Notify background that content script is ready
    await notifyContentScriptReady(window.location.href, document.title);

    // Get current settings
    const settingsResponse = await requestSettings();
    if (settingsResponse.success && settingsResponse.data) {
      currentSettings = settingsResponse.data;

      // Only run if extension is enabled
      if (currentSettings.enabled) {
        setupContentScript();
      }
    }

    isInitialized = true;
  } catch (error) {
    console.error('[Extension] Failed to initialize content script:', error);
  }
};

/**
 * Set up content script functionality
 */
const setupContentScript = (): void => {
  // Add your content script logic here
  // This runs on every page that matches the manifest's content_scripts pattern

  // Example: Add a custom class to the body
  // document.body.classList.add('extension-active');

  // Example: Observe DOM changes
  // setupMutationObserver();

  // Example: Listen for specific events
  // setupEventListeners();
};

// ============================================================================
// Message Handling (from background/popup)
// ============================================================================

/**
 * Handle messages from other extension contexts
 */
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ): boolean => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });

    // Return true to indicate async response
    return true;
  }
);

/**
 * Process incoming messages
 */
const handleMessage = async (message: ExtensionMessage): Promise<MessageResponse> => {
  switch (message.type) {
    case 'UPDATE_SETTINGS':
      // Settings were updated, refresh local state
      const settingsResponse = await requestSettings();
      if (settingsResponse.success && settingsResponse.data) {
        currentSettings = settingsResponse.data;
      }
      return { success: true };

    case 'PERFORM_ACTION':
      // Handle custom actions from popup/background
      return handleAction(message.payload);

    default:
      return { success: false, error: `Unknown message type: ${message.type}` };
  }
};

/**
 * Handle custom actions
 */
const handleAction = (payload: { action: string; data?: unknown }): MessageResponse => {
  switch (payload.action) {
    case 'highlightElements':
      // Example action: highlight elements on the page
      return { success: true, data: { highlighted: true } };

    case 'extractData':
      // Example action: extract data from the page
      const data = extractPageData();
      return { success: true, data };

    default:
      return { success: false, error: `Unknown action: ${payload.action}` };
  }
};

// ============================================================================
// Page Interaction Utilities
// ============================================================================

/**
 * Extract basic data from the current page
 */
const extractPageData = (): Record<string, unknown> => {
  return {
    url: window.location.href,
    title: document.title,
    metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content'),
    headings: Array.from(document.querySelectorAll('h1, h2')).map((h) => ({
      level: h.tagName.toLowerCase(),
      text: h.textContent?.trim(),
    })),
  };
};

/**
 * Inject a style into the page
 */
const injectStyle = (css: string): HTMLStyleElement => {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  return style;
};

/**
 * Create a floating UI element (for overlays, widgets, etc.)
 */
const createFloatingElement = (id: string): HTMLDivElement => {
  // Remove existing element if present
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  const element = document.createElement('div');
  element.id = id;
  element.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    pointer-events: auto;
  `;
  document.body.appendChild(element);
  return element;
};

// ============================================================================
// DOM Observation (optional)
// ============================================================================

/**
 * Set up a mutation observer to watch for DOM changes
 */
const setupMutationObserver = (): MutationObserver => {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        // Handle added/removed nodes
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // Process newly added elements
          }
        });
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
};

// ============================================================================
// Event Listeners (optional)
// ============================================================================

/**
 * Set up event listeners on the page
 */
const setupEventListeners = (): void => {
  // Example: Listen for clicks
  document.addEventListener('click', (event) => {
    // Handle click events if needed
  });

  // Example: Listen for keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    // Example: Ctrl/Cmd + Shift + E to trigger extension action
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'E') {
      event.preventDefault();
      requestAction('extensionTrigger');
    }
  });
};

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Clean up when content script is being unloaded
 */
const cleanup = (): void => {
  // Remove any injected elements
  // Remove event listeners
  // Clear observers
};

// Listen for extension unload (when navigating away or extension is disabled)
window.addEventListener('unload', cleanup);

// ============================================================================
// Initialize
// ============================================================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Export for potential testing
export {
  initialize,
  extractPageData,
  injectStyle,
  createFloatingElement,
  setupMutationObserver,
};

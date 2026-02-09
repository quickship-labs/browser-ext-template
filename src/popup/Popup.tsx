import { useEffect, useState, useCallback } from 'react';
import {
  UserSettings,
  DEFAULT_USER_SETTINGS,
  TabInfo,
  FeatureKey,
  hasFeatureAccess,
} from '../shared/types';
import { requestSettings, requestUpdateSettings, requestTabInfo } from '../shared/messaging';
import { onUserSettingsChange } from '../shared/storage';

/**
 * Main Popup Component
 */
export const Popup = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [tabInfo, setTabInfo] = useState<TabInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsRes, tabRes] = await Promise.all([requestSettings(), requestTabInfo()]);

        if (settingsRes.success && settingsRes.data) {
          setSettings(settingsRes.data);
        }

        if (tabRes.success && tabRes.data) {
          setTabInfo(tabRes.data);
        }
      } catch (err) {
        setError('Failed to load extension data');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Listen for settings changes
    const unsubscribe = onUserSettingsChange((newSettings) => {
      setSettings(newSettings);
    });

    return () => unsubscribe();
  }, []);

  // Toggle extension enabled state
  const toggleEnabled = useCallback(async () => {
    const response = await requestUpdateSettings({ enabled: !settings.enabled });
    if (response.success && response.data) {
      setSettings(response.data);
    }
  }, [settings.enabled]);

  // Open options page
  const openOptions = useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  // Check if user can access a pro feature
  const canAccessFeature = useCallback(
    (feature: FeatureKey) => {
      return hasFeatureAccess(settings.tier, feature);
    },
    [settings.tier]
  );

  if (loading) {
    return (
      <div className="w-popup p-4 bg-white">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-popup p-4 bg-white">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-popup bg-white">
      {/* Header */}
      <header className="bg-primary-600 text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Extension Template</h1>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              settings.tier === 'pro'
                ? 'bg-yellow-400 text-yellow-900'
                : 'bg-primary-500 text-white'
            }`}
          >
            {settings.tier.toUpperCase()}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-4">
        {/* Current Tab Info */}
        {tabInfo && (
          <section className="bg-gray-50 rounded-lg p-3">
            <h2 className="text-sm font-medium text-gray-600 mb-1">Current Tab</h2>
            <p className="text-sm text-gray-900 truncate" title={tabInfo.title}>
              {tabInfo.title || 'Untitled'}
            </p>
            <p className="text-xs text-gray-500 truncate" title={tabInfo.url}>
              {tabInfo.url}
            </p>
          </section>
        )}

        {/* Enable/Disable Toggle */}
        <section className="flex items-center justify-between py-2">
          <span className="text-sm font-medium text-gray-700">Extension Enabled</span>
          <button
            onClick={toggleEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enabled ? 'bg-primary-600' : 'bg-gray-300'
            }`}
            role="switch"
            aria-checked={settings.enabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </section>

        {/* Free Features */}
        <section>
          <h2 className="text-sm font-medium text-gray-700 mb-2">Free Features</h2>
          <div className="space-y-2">
            <FeatureButton
              label="Basic Feature"
              available={true}
              onClick={() => {
                // Handle basic feature action
              }}
            />
          </div>
        </section>

        {/* Pro Features */}
        <section>
          <h2 className="text-sm font-medium text-gray-700 mb-2">Pro Features</h2>
          <div className="space-y-2">
            <FeatureButton
              label="Advanced Analytics"
              available={canAccessFeature('advanced_analytics')}
              onClick={() => {
                // Handle pro feature action
              }}
            />
            <FeatureButton
              label="Export Data"
              available={canAccessFeature('export_data')}
              onClick={() => {
                // Handle pro feature action
              }}
            />
          </div>
          {settings.tier === 'free' && (
            <button className="mt-2 w-full py-2 px-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg text-sm font-medium transition-colors">
              Upgrade to Pro
            </button>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t p-3 flex justify-between items-center">
        <button
          onClick={openOptions}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Settings
        </button>
        <span className="text-xs text-gray-400">v1.0.0</span>
      </footer>
    </div>
  );
};

/**
 * Feature Button Component
 */
interface FeatureButtonProps {
  label: string;
  available: boolean;
  onClick: () => void;
}

const FeatureButton = ({ label, available, onClick }: FeatureButtonProps) => {
  if (!available) {
    return (
      <div className="flex items-center justify-between py-2 px-3 bg-gray-100 rounded-lg opacity-60">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          PRO
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-2 px-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
    >
      <span className="text-sm text-primary-700 font-medium">{label}</span>
      <svg
        className="w-4 h-4 text-primary-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
};

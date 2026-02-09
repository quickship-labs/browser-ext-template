import { useEffect, useState, useCallback } from 'react';
import { UserSettings, DEFAULT_USER_SETTINGS, SubscriptionTier } from '../shared/types';
import { requestSettings, requestUpdateSettings } from '../shared/messaging';
import { onUserSettingsChange, resetUserSettings } from '../shared/storage';

/**
 * Options/Settings Page Component
 */
export const Options = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load initial settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await requestSettings();
        if (response.success && response.data) {
          setSettings(response.data);
        }
      } catch {
        showMessage('error', 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    // Listen for external settings changes
    const unsubscribe = onUserSettingsChange((newSettings) => {
      setSettings(newSettings);
    });

    return () => unsubscribe();
  }, []);

  // Show temporary message
  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  // Save settings
  const saveSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      setSaving(true);
      try {
        const response = await requestUpdateSettings(updates);
        if (response.success && response.data) {
          setSettings(response.data);
          showMessage('success', 'Settings saved');
        } else {
          showMessage('error', response.error || 'Failed to save settings');
        }
      } catch {
        showMessage('error', 'Failed to save settings');
      } finally {
        setSaving(false);
      }
    },
    [showMessage]
  );

  // Handle theme change
  const handleThemeChange = useCallback(
    (theme: UserSettings['theme']) => {
      saveSettings({ theme });
    },
    [saveSettings]
  );

  // Handle notification toggle
  const handleNotificationToggle = useCallback(
    (key: keyof UserSettings['notifications']) => {
      saveSettings({
        notifications: {
          ...settings.notifications,
          [key]: !settings.notifications[key],
        },
      });
    },
    [settings.notifications, saveSettings]
  );

  // Handle tier change (for demo purposes)
  const handleTierChange = useCallback(
    (tier: SubscriptionTier) => {
      saveSettings({ tier });
    },
    [saveSettings]
  );

  // Reset to defaults
  const handleReset = useCallback(async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      setSaving(true);
      try {
        const success = await resetUserSettings();
        if (success) {
          setSettings(DEFAULT_USER_SETTINGS);
          showMessage('success', 'Settings reset to defaults');
        } else {
          showMessage('error', 'Failed to reset settings');
        }
      } catch {
        showMessage('error', 'Failed to reset settings');
      } finally {
        setSaving(false);
      }
    }
  }, [showMessage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Extension Settings</h1>
          <p className="text-gray-600 mt-2">Configure your extension preferences</p>
        </header>

        {/* Message Toast */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Subscription Section */}
          <SettingsSection title="Subscription" description="Manage your subscription tier">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">Current Plan: </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                    settings.tier === 'pro'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {settings.tier.toUpperCase()}
                </span>
              </div>
              {/* Demo tier toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleTierChange('free')}
                  className={`px-3 py-1 rounded text-sm ${
                    settings.tier === 'free'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={saving}
                >
                  Free
                </button>
                <button
                  onClick={() => handleTierChange('pro')}
                  className={`px-3 py-1 rounded text-sm ${
                    settings.tier === 'pro'
                      ? 'bg-yellow-400 text-yellow-900'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={saving}
                >
                  Pro
                </button>
              </div>
            </div>
          </SettingsSection>

          {/* Appearance Section */}
          <SettingsSection title="Appearance" description="Customize the look and feel">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <div className="flex gap-3">
                  {(['light', 'dark', 'system'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => handleThemeChange(theme)}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                        settings.theme === theme
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                      disabled={saving}
                    >
                      <span className="capitalize">{theme}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Notifications Section */}
          <SettingsSection
            title="Notifications"
            description="Control how you receive notifications"
          >
            <div className="space-y-4">
              <ToggleOption
                label="Enable Notifications"
                description="Receive notifications from the extension"
                enabled={settings.notifications.enabled}
                onChange={() => handleNotificationToggle('enabled')}
                disabled={saving}
              />
              <ToggleOption
                label="Sound"
                description="Play sound with notifications"
                enabled={settings.notifications.sound}
                onChange={() => handleNotificationToggle('sound')}
                disabled={saving || !settings.notifications.enabled}
              />
            </div>
          </SettingsSection>

          {/* Data Section */}
          <SettingsSection title="Data & Privacy" description="Manage your extension data">
            <div className="space-y-4">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                disabled={saving}
              >
                Reset All Settings
              </button>
            </div>
          </SettingsSection>

          {/* About Section */}
          <SettingsSection title="About" description="Extension information">
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Version:</span> 1.0.0
              </p>
              <p>
                <span className="font-medium">Build:</span> Production
              </p>
              <p className="mt-4">
                This is a starter template for Chrome extensions built with React, TypeScript, and
                Tailwind CSS.
              </p>
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
};

/**
 * Settings Section Component
 */
interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const SettingsSection = ({ title, description, children }: SettingsSectionProps) => {
  return (
    <section className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {children}
    </section>
  );
};

/**
 * Toggle Option Component
 */
interface ToggleOptionProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
}

const ToggleOption = ({ label, description, enabled, onChange, disabled }: ToggleOptionProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="font-medium text-gray-900">{label}</span>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${enabled ? 'bg-primary-600' : 'bg-gray-300'}`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

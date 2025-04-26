'use client';

import { createContext, useContext, useEffect, useState } from 'react';

// Types for our settings
export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  fontScale: 'small' | 'normal' | 'large';
}

export interface PreferenceSettings {
  defaultView: 'list' | 'board' | 'calendar';
  taskSort: 'priority' | 'dueDate' | 'created' | 'alphabetical';
  timezone: string;
  startOfWeek: 'sunday' | 'monday' | 'saturday';
}

// Default values
const defaultAppearanceSettings: AppearanceSettings = {
  theme: 'system',
  compactMode: false,
  fontScale: 'normal',
};

const defaultPreferenceSettings: PreferenceSettings = {
  defaultView: 'list',
  taskSort: 'priority',
  timezone: 'UTC',
  startOfWeek: 'monday',
};

// Context creation
type SettingsContextType = {
  appearanceSettings: AppearanceSettings;
  preferenceSettings: PreferenceSettings;
  updateAppearanceSettings: (settings: Partial<AppearanceSettings>) => Promise<boolean>;
  updatePreferenceSettings: (settings: Partial<PreferenceSettings>) => Promise<boolean>;
  isLoading: boolean;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>(defaultAppearanceSettings);
  const [preferenceSettings, setPreferenceSettings] = useState<PreferenceSettings>(defaultPreferenceSettings);
  const [isClient, setIsClient] = useState(false);

  // Make sure we're running on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (!isClient) return;

    try {
      // Load appearance settings
      const storedAppearance = localStorage.getItem('appearanceSettings');
      if (storedAppearance) {
        setAppearanceSettings(JSON.parse(storedAppearance));
      }

      // Load preference settings
      const storedPreferences = localStorage.getItem('preferenceSettings');
      if (storedPreferences) {
        setPreferenceSettings(JSON.parse(storedPreferences));
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }

    setIsLoading(false);
  }, [isClient]);

  // Apply appearance settings when they change
  useEffect(() => {
    if (!isClient || isLoading) return;

    // Apply theme
    if (appearanceSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (appearanceSettings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // Apply font scale
    document.documentElement.style.fontSize = appearanceSettings.fontScale === 'small' ? '14px' : appearanceSettings.fontScale === 'large' ? '18px' : '16px';

    // Apply compact mode
    if (appearanceSettings.compactMode) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }
  }, [appearanceSettings, isLoading, isClient]);

  // Update appearance settings
  const updateAppearanceSettings = async (settings: Partial<AppearanceSettings>): Promise<boolean> => {
    try {
      const newSettings = { ...appearanceSettings, ...settings };
      setAppearanceSettings(newSettings);

      // Save to localStorage
      if (isClient) {
        localStorage.setItem('appearanceSettings', JSON.stringify(newSettings));
      }

      // Save to server if user is authenticated
      try {
        const response = await fetch('/api/settings/appearance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        });

        if (!response.ok) {
          console.warn('Could not save appearance settings to server:', await response.text());
          // Don't throw, just log warning - settings are saved to localStorage anyway
        }
      } catch (apiError) {
        console.warn('API error while saving appearance settings:', apiError);
        // Don't throw, just log warning - settings are saved to localStorage anyway
      }

      // Apply theme immediately for better UX
      if (newSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (newSettings.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      // Apply other settings immediately
      document.documentElement.style.fontSize = newSettings.fontScale === 'small' ? '14px' : newSettings.fontScale === 'large' ? '18px' : '16px';

      if (newSettings.compactMode) {
        document.documentElement.classList.add('compact-mode');
      } else {
        document.documentElement.classList.remove('compact-mode');
      }

      return true;
    } catch (error) {
      console.error('Error updating appearance settings:', error);
      return false;
    }
  };

  // Update preference settings
  const updatePreferenceSettings = async (settings: Partial<PreferenceSettings>): Promise<boolean> => {
    try {
      const newSettings = { ...preferenceSettings, ...settings };
      setPreferenceSettings(newSettings);

      // Save to localStorage
      if (isClient) {
        localStorage.setItem('preferenceSettings', JSON.stringify(newSettings));
      }

      // Save to server if user is authenticated
      try {
        const response = await fetch('/api/settings/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        });

        if (!response.ok) {
          console.warn('Could not save preference settings to server', await response.text());
        }
      } catch (apiError) {
        console.warn('API error while saving preference settings:', apiError);
      }

      return true;
    } catch (error) {
      console.error('Error updating preference settings:', error);
      return false;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        appearanceSettings,
        preferenceSettings,
        updateAppearanceSettings,
        updatePreferenceSettings,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hooks to use settings
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export function useAppearanceSettings() {
  const { appearanceSettings, updateAppearanceSettings, isLoading } = useSettings();
  return {
    settings: appearanceSettings,
    saveSettings: updateAppearanceSettings,
    loaded: !isLoading,
  };
}

export function usePreferenceSettings() {
  const { preferenceSettings, updatePreferenceSettings, isLoading } = useSettings();
  return {
    settings: preferenceSettings,
    saveSettings: updatePreferenceSettings,
    loaded: !isLoading,
  };
}

import { useEffect, useState } from 'react';

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

// Default settings
export const defaultAppearanceSettings: AppearanceSettings = {
  theme: 'system',
  compactMode: false,
  fontScale: 'normal',
};

export const defaultPreferenceSettings: PreferenceSettings = {
  defaultView: 'list',
  taskSort: 'priority',
  timezone: 'UTC',
  startOfWeek: 'monday',
};

// Hook for appearance settings
export function useAppearanceSettings() {
  const [settings, setSettings] = useState<AppearanceSettings>(defaultAppearanceSettings);
  const [loaded, setLoaded] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('appearanceSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing appearance settings:', error);
      }
    }
    setLoaded(true);
  }, []);

  // Save settings to localStorage and API
  const saveSettings = async (newSettings: AppearanceSettings) => {
    try {
      // Update local state immediately for responsiveness
      setSettings(newSettings);

      // Save to localStorage
      localStorage.setItem('appearanceSettings', JSON.stringify(newSettings));

      // Save to server if user is authenticated
      const response = await fetch('/api/settings/appearance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save appearance settings to server');
      }

      // Apply theme
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

      // Apply font scale
      document.documentElement.style.fontSize = newSettings.fontScale === 'small' ? '14px' : newSettings.fontScale === 'large' ? '18px' : '16px';

      // Apply compact mode
      if (newSettings.compactMode) {
        document.documentElement.classList.add('compact-mode');
      } else {
        document.documentElement.classList.remove('compact-mode');
      }

      return true;
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      return false;
    }
  };

  return {
    settings,
    saveSettings,
    loaded,
  };
}

// Hook for preference settings
export function usePreferenceSettings() {
  const [settings, setSettings] = useState<PreferenceSettings>(defaultPreferenceSettings);
  const [loaded, setLoaded] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('preferenceSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing preference settings:', error);
      }
    }
    setLoaded(true);
  }, []);

  // Save settings to localStorage and API
  const saveSettings = async (newSettings: PreferenceSettings) => {
    try {
      // Update local state immediately for responsiveness
      setSettings(newSettings);

      // Save to localStorage
      localStorage.setItem('preferenceSettings', JSON.stringify(newSettings));

      // Save to server if user is authenticated
      const response = await fetch('/api/settings/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save preference settings to server');
      }

      return true;
    } catch (error) {
      console.error('Error saving preference settings:', error);
      return false;
    }
  };

  return {
    settings,
    saveSettings,
    loaded,
  };
}

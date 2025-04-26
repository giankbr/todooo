'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppearanceSettings, usePreferenceSettings } from '@/lib/settings-storage';
import { BellIcon, Clock, Globe, KeyIcon, MoonIcon, SunIcon, UserIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [isSaving, setIsSaving] = useState(false);

  // Get settings from our custom hooks
  const { settings: appearanceSettings, saveSettings: saveAppearanceSettings, loaded: appearanceLoaded } = useAppearanceSettings();
  const { settings: preferenceSettings, saveSettings: savePreferenceSettings, loaded: preferenceLoaded } = usePreferenceSettings();

  // Account settings
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    dailyDigest: false,
    mentionAlerts: true,
  });

  const handlePasswordChange = () => {
    if (!passwordData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    toast.loading('Updating password...', { id: 'password-update' });

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Password updated successfully', { id: 'password-update' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }, 1500);
  };

  const saveNotificationSettings = () => {
    setIsSaving(true);
    toast.loading('Saving notification preferences...', { id: 'notification-update' });

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Notification preferences saved', { id: 'notification-update' });
    }, 1000);
  };

  const handleAppearanceSave = async () => {
    setIsSaving(true);
    toast.loading('Saving appearance settings...', { id: 'appearance-update' });

    try {
      // Call our saveSettings function from the custom hook
      const success = await saveAppearanceSettings(appearanceSettings);

      if (success) {
        toast.success('Appearance settings saved successfully', { id: 'appearance-update' });
      } else {
        toast.error('Failed to save appearance settings', { id: 'appearance-update' });
      }
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      toast.error('An error occurred while saving appearance settings', { id: 'appearance-update' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferenceSave = async () => {
    setIsSaving(true);
    toast.loading('Saving preferences...', { id: 'preferences-update' });

    try {
      // Call our saveSettings function from the custom hook
      const success = await savePreferenceSettings(preferenceSettings);

      if (success) {
        toast.success('Preferences saved successfully', { id: 'preferences-update' });
      } else {
        toast.error('Failed to save preferences', { id: 'preferences-update' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('An error occurred while saving preferences', { id: 'preferences-update' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserIcon className="mr-2 h-5 w-5" />
                  Profile
                </CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input id="display-name" defaultValue={session?.user?.name || ''} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue={session?.user?.email || ''} disabled />
                  <p className="text-xs text-muted-foreground">Contact IT department to change your email address</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" defaultValue={session?.user?.department || ''} placeholder="Your department" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost">Cancel</Button>
                <Button>Save Profile</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <KeyIcon className="mr-2 h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>Update your password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input type="password" id="current-password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input type="password" id="new-password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input type="password" id="confirm-password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost">Cancel</Button>
                <Button onClick={handlePasswordChange} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Update Password'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BellIcon className="mr-2 h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Control how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch checked={notificationSettings.emailNotifications} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive notifications in your browser</p>
                  </div>
                  <Switch checked={notificationSettings.pushNotifications} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, pushNotifications: checked })} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Task Reminders</p>
                    <p className="text-sm text-muted-foreground">Get notified about upcoming tasks</p>
                  </div>
                  <Switch checked={notificationSettings.taskReminders} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, taskReminders: checked })} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Daily Digest</p>
                    <p className="text-sm text-muted-foreground">Receive a summary of your daily tasks</p>
                  </div>
                  <Switch checked={notificationSettings.dailyDigest} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, dailyDigest: checked })} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mention Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified when you're mentioned</p>
                  </div>
                  <Switch checked={notificationSettings.mentionAlerts} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, mentionAlerts: checked })} />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveNotificationSettings} disabled={isSaving} className="ml-auto">
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MoonIcon className="mr-2 h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel of your dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div
                    className={`flex flex-col items-center space-y-2 rounded-md border p-4 cursor-pointer hover:bg-muted ${appearanceSettings.theme === 'light' ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => saveAppearanceSettings({ ...appearanceSettings, theme: 'light' })}
                  >
                    <div className="h-24 w-full rounded-md bg-[#f8fafc] border flex items-center justify-center">
                      <SunIcon className="h-10 w-10 text-amber-500" />
                    </div>
                    <RadioGroup value={appearanceSettings.theme} onValueChange={(value: any) => saveAppearanceSettings({ ...appearanceSettings, theme: value })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="light" id="theme-light" />
                        <Label htmlFor="theme-light">Light</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div
                    className={`flex flex-col items-center space-y-2 rounded-md border p-4 cursor-pointer hover:bg-muted ${appearanceSettings.theme === 'dark' ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => saveAppearanceSettings({ ...appearanceSettings, theme: 'dark' })}
                  >
                    <div className="h-24 w-full rounded-md bg-[#1e293b] border flex items-center justify-center">
                      <MoonIcon className="h-10 w-10 text-slate-400" />
                    </div>
                    <RadioGroup value={appearanceSettings.theme} onValueChange={(value: any) => saveAppearanceSettings({ ...appearanceSettings, theme: value })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dark" id="theme-dark" />
                        <Label htmlFor="theme-dark">Dark</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div
                    className={`flex flex-col items-center space-y-2 rounded-md border p-4 cursor-pointer hover:bg-muted ${appearanceSettings.theme === 'system' ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => saveAppearanceSettings({ ...appearanceSettings, theme: 'system' })}
                  >
                    <div className="h-24 w-full rounded-md bg-gradient-to-r from-[#f8fafc] to-[#1e293b] border flex items-center justify-center">
                      <div className="flex">
                        <SunIcon className="h-10 w-10 text-amber-500" />
                        <MoonIcon className="h-10 w-10 text-slate-400" />
                      </div>
                    </div>
                    <RadioGroup value={appearanceSettings.theme} onValueChange={(value: any) => saveAppearanceSettings({ ...appearanceSettings, theme: value })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="system" id="theme-system" />
                        <Label htmlFor="theme-system">System</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">Reduce spacing and size of elements</p>
                  </div>
                  <Switch checked={appearanceSettings.compactMode} onCheckedChange={(checked) => saveAppearanceSettings({ ...appearanceSettings, compactMode: checked })} />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Font Size</Label>
                <Select value={appearanceSettings.fontScale} onValueChange={(value: any) => saveAppearanceSettings({ ...appearanceSettings, fontScale: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Settings */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                Preferences
              </CardTitle>
              <CardDescription>Set your default preferences for tasks and projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="default-view">Default View</Label>
                  <Select value={preferenceSettings.defaultView} onValueChange={(value: any) => savePreferenceSettings({ ...preferenceSettings, defaultView: value })}>
                    <SelectTrigger id="default-view">
                      <SelectValue placeholder="Select default view" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="list">List View</SelectItem>
                      <SelectItem value="board">Board View</SelectItem>
                      <SelectItem value="calendar">Calendar View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-sort">Default Task Sorting</Label>
                  <Select value={preferenceSettings.taskSort} onValueChange={(value: any) => savePreferenceSettings({ ...preferenceSettings, taskSort: value })}>
                    <SelectTrigger id="task-sort">
                      <SelectValue placeholder="Select default sorting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="dueDate">Due Date</SelectItem>
                      <SelectItem value="created">Date Created</SelectItem>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Timezone
                  </Label>
                  <Select value={preferenceSettings.timezone} onValueChange={(value) => savePreferenceSettings({ ...preferenceSettings, timezone: value })}>
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Asia/Jakarta">Western Indonesian Time (WIB)</SelectItem>
                      <SelectItem value="Asia/Makassar">Central Indonesian Time (WITA)</SelectItem>
                      <SelectItem value="Asia/Jayapura">Eastern Indonesian Time (WIT)</SelectItem>
                      <SelectItem value="US/Eastern">Eastern Time (US & Canada)</SelectItem>
                      <SelectItem value="US/Pacific">Pacific Time (US & Canada)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Japan Standard Time</SelectItem>
                      <SelectItem value="Europe/London">GMT (London)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="week-start">Start of Week</Label>
                  <Select value={preferenceSettings.startOfWeek} onValueChange={(value: any) => savePreferenceSettings({ ...preferenceSettings, startOfWeek: value })}>
                    <SelectTrigger id="week-start">
                      <SelectValue placeholder="Select start day of week" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">Sunday</SelectItem>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

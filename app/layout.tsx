import NextAuthSessionProvider from '@/components/providers/session-provider';
import { SettingsProvider } from '@/components/providers/settings-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import ToastProvider from '@/components/providers/toast-provider';
import { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'MorfoTasks - Task & Project Management Platform',
  description: 'Manage your daily tasks, standups, and projects in one place',
  keywords: ['task management', 'standup', 'project management', 'productivity'],
  authors: [{ name: 'gian', url: 'https://porto-gian.vercel.com' }],
  creator: 'Morfotech',
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://yourapp.com',
    title: 'StandUp - Task & Project Management Platform',
    description: 'Manage your daily tasks, standups, and projects in one place',
    siteName: 'StandUp Platform',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body className="font-outfit">
        <NextAuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SettingsProvider>
              {children}
              <ToastProvider />
            </SettingsProvider>
          </ThemeProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppLayout } from '@/components/AppLayout';
import { APP_NAME, APP_TAGLINE } from '@/lib/brand';

export const metadata: Metadata = {
  title: `${APP_NAME} · ${APP_TAGLINE}`,
  description:
    'Bills that ping before they are due. Multi-user dashboard with Telegram bot and Gemini AI receipt scanning in monochrome glass styling.',
  keywords: [
    'pingue',
    'bill reminder',
    'recharge reminder',
    'telegram bill bot',
    'utility payments',
    'bento finance dashboard',
  ],
  authors: [{ name: APP_NAME }],
  openGraph: {
    title: `${APP_NAME} · ${APP_TAGLINE}`,
    description: 'Bills that ping before they are due.',
    siteName: APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}

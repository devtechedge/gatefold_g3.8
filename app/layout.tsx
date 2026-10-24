import type {Metadata, Viewport} from 'next';
import './globals.css'; // Global styles
import ThemeToggle from '@/components/ThemeToggle';

export const metadata: Metadata = {
  metadataBase: new URL('https://gatefold-zeta.vercel.app'),
  title: 'Gatefold — Event Publishing & Ticket Operations',
  description: 'Event publishing, ticket inventory, atomic reservations, ticket issuance, and attendee check-in platform for independent organizers, venues, festivals, and conferences.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Gatefold — Event Publishing & Ticket Operations',
    description: 'Event publishing, ticket inventory, atomic reservations, ticket issuance, and attendee check-in platform for independent organizers, venues, festivals, and conferences.',
    type: 'website',
    url: 'https://gatefold-zeta.vercel.app',
    images: ['/docs/screenshots/social-preview.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gatefold — Event Publishing & Ticket Operations',
    description: 'Event publishing, ticket inventory, atomic reservations, ticket issuance, and attendee check-in platform for independent organizers, venues, festivals, and conferences.',
    images: ['/docs/screenshots/social-preview.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#faf8f5',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}

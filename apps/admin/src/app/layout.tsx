import type { Metadata } from 'next';
import './globals.css';

import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'NKS Admin',
  description: 'NKS byggekontroll — administrasjonspanel',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nb" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

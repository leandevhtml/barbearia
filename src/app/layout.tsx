import type { Metadata, Viewport } from 'next';
import { Outfit, Bebas_Neue, Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import InstallPrompt from '@/components/shared/InstallPrompt';

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
});

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Gigantes do Corte — Sistema Premium de Barbearia',
  description: 'Dashboard completo para gestão de barbearia com agendamento, fidelidade e controle financeiro.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gigantes do Corte',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#020202',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${bebas.variable} ${inter.variable}`}>
      <body className="grid-bg font-sans">
        <Providers>
          {children}
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}

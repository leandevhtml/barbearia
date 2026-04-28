import type { Metadata } from 'next';
import { Outfit, Bebas_Neue, Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${bebas.variable} ${inter.variable}`}>
      <body className="grid-bg font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


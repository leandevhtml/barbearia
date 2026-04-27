import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Gigantes do Corte — Sistema Premium de Barbearia',
  description: 'Dashboard completo para gestão de barbearia com agendamento, fidelidade e controle financeiro.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="grid-bg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

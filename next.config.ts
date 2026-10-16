import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongodb-memory-server', 'mongodb-memory-server-core'],
  typescript: {
    // Ignore type errors during build (Vercel)
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // ═══════════════════════════════════════════════════
  // 🛡️ SECURITY HEADERS — Proteção contra ataques web
  // ═══════════════════════════════════════════════════
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Impede que o site seja embutido em iframes de outros domínios (anti-clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Impede que o navegador "adivinhe" o tipo do arquivo (anti-MIME sniffing)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Controla quais informações são enviadas ao navegar para outro site
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Desabilita APIs do navegador que não usamos (câmera, microfone, GPS, etc.)
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          // Força HTTPS por 1 ano (HSTS)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          // Bloqueia ataques XSS no navegador
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Content Security Policy — Controla de onde o site pode carregar recursos
          { 
            key: 'Content-Security-Policy', 
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://api.mercadopago.com https://vitals.vercel-insights.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          },
        ],
      },
    ];
  },
};

export default nextConfig;

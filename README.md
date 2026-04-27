# 💈 Elite Club - Gestão de Barbearia Premium

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-blue)
![Next.js](https://img.shields.io/badge/Next.js-15+-black?logo=next.js)
![React](https://img.shields.io/badge/React-19+-blue?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?logo=tailwind-css)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-47A248?logo=mongodb)

O **Elite Club** é uma plataforma completa de gestão para barbearias modernas, focada em oferecer uma experiência premium tanto para o cliente quanto para o administrador. O sistema combina agendamento inteligente, fidelização de clientes e controle administrativo rigoroso em uma interface elegante e responsiva.

---

## ✨ Funcionalidades Principais

### 👤 Área do Cliente
- **Agendamento Online**: Interface intuitiva para escolha de serviços, profissionais e horários.
- **Cartão Fidelidade Digital**: Sistema de selos automático que recompensa clientes frequentes com cortes grátis.
- **Status em Tempo Real**: Acompanhamento do status do agendamento e notificações.
- **Perfil Personalizado**: Histórico de serviços e preferências.

### 👔 Painel Administrativo (Master Dashboard)
- **Gestão de Agendamentos**: Calendário completo para gerenciar a agenda do dia.
- **Controle Financeiro**: Fluxo de caixa, relatórios de faturamento e métricas de desempenho.
- **Gestão de Serviços e Estoque**: Cadastro de serviços, preços e controle de produtos.
- **Fidelização**: Gerenciamento manual e automático de cupons e recompensas.

---

## 🎨 Diferenciais Estéticos
O projeto utiliza uma estética **Dark Premium** com:
- **Barber Pole 3D**: Animação customizada de carregamento que reforça a identidade visual.
- **Glassmorphism**: Efeitos de transparência modernos em toda a interface.
- **Animações Fluidas**: Transições suaves utilizando Framer Motion para uma experiência de usuário superior.
- **Design Responsivo**: Adaptado perfeitamente para Smartphones, Tablets e Desktops.

---

## 🚀 Tecnologias Utilizadas

Este projeto foi construído com as tecnologias mais modernas do ecossistema Web:

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **Banco de Dados**: [MongoDB](https://www.mongodb.com/) com [Mongoose](https://mongoosejs.com/)
- **Autenticação**: [NextAuth.js](https://next-auth.js.org/)
- **Estado Global**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Animações**: [Framer Motion](https://www.framer.com/motion/)
- **Gráficos**: [Recharts](https://recharts.org/)
- **Ícones**: [Lucide React](https://lucide.dev/)

---

## 🛠️ Como Executar o Projeto

### Pré-requisitos
- Node.js 18.x ou superior
- Instância do MongoDB (Local ou Atlas)

### Passo a Passo

1. **Clonar o repositório**
   ```bash
   git clone https://github.com/leandevhtml/barbearia.git
   cd barbearia
   ```

2. **Instalar dependências**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente**
   Crie um arquivo `.env.local` na raiz e adicione:
   ```env
   MONGODB_URI=seu_link_do_mongodb
   NEXTAUTH_SECRET=sua_chave_secreta
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Executar o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📄 Licença
Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---
<p align="center">Desenvolvido com ❤️ por <a href="https://github.com/leandevhtml">Leandro Silva</a></p>

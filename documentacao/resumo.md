# Di' Moda Íntima — Resumo do Projeto

## O que é

E-commerce completo de moda íntima e produtos para o prazer, composto por um **frontend React (Vite)** e um **backend Node.js (Express)**, ambos hospedáveis separadamente (Vercel + Railway).

---

## Funcionalidades Principais

### Loja Pública (cliente)
- Página inicial com banner hero dinâmico e produtos em destaque
- Navegação por categorias (vibrador, fantasia, gel, etc.)
- Página de detalhe do produto com galeria de imagens (zoom, swipe, modal fullscreen)
- Carrinho de compras persistente (localStorage)
- Checkout em 3 etapas (dados → pagamento → revisão)
- Três formas de pagamento: **PIX manual**, **Cartão de Crédito (Stripe Checkout)** e **Dinheiro na entrega**
- Tela de confirmação inteligente (mostra chave PIX, status do Stripe ou instruções para dinheiro)
- Cadastro/login de clientes e área "Minha Conta" com histórico de pedidos
- SEO completo (meta tags, Open Graph, Schema.org JSON-LD)
- Dark mode com toggle flutuante
- Layout responsivo (mobile-first)

### Painel Administrativo
- Dashboard com estatísticas (total de produtos, pedidos, receita) e filtro por datas
- CRUD completo de **Produtos** (com upload múltiplo de até 5 imagens via Cloudinary)
- CRUD completo de **Categorias**
- Gerenciamento de **Pedidos** (status: pendente → confirmado → enviado → entregue/cancelado)
- Arquivamento individual e em lote de pedidos
- Gerenciamento de **Usuários** (alteração de role admin/client)
- **Editor Visual** da homepage (banner, textos, cores)
- Sidebar responsivo com navegação e logout

### Notificações
- **Email automático** para o admin e para o cliente (se o e-mail for fornecido) através da Resend API, adaptado à forma de pagamento escolhida:
  - Disparado no ato para PIX / Dinheiro informando aguardo de pagamento.
  - Disparado pós-confirmação no webhook para casos de Cartão de Crédito.
- **WhatsApp** (via CallMeBot API, opcional) — com fallback para link manual
### Pagamentos
- **PIX manual**: exibe chave PIX estática + botão "enviar comprovante no WhatsApp"
- **Cartão de Crédito**: redireciona para Stripe Checkout Session, retorna com status
- **Dinheiro**: gera pedido e aguarda pagamento na entrega
- Webhook do Stripe para confirmar pagamento automaticamente

---

## Stack Tecnológica

| Camada     | Tecnologia                                 |
|------------|---------------------------------------------|
| Frontend   | React 18, Vite 5, TailwindCSS 3, Axios     |
| Backend    | Node.js, Express 4, ES Modules              |
| Banco      | Firebase Firestore (produção) / SQLite (legado) |
| Pagamento  | Stripe (cartão) + PIX manual                |
| Upload     | Cloudinary (otimização automática, WebP)    |
| Email      | Resend API                                  |
| WhatsApp   | CallMeBot API (opcional)                    |
| Auth       | JWT (jsonwebtoken) + bcryptjs               |
| Deploy     | Vercel (front) + Railway (back)             |

---

## Variáveis de Ambiente Necessárias

| Variável                   | Descrição                              |
|----------------------------|----------------------------------------|
| `STRIPE_SECRET_KEY`        | Chave secreta do Stripe                |
| `STRIPE_PUBLISHABLE_KEY`   | Chave pública do Stripe                |
| `STRIPE_WEBHOOK_SECRET`    | Segredo do webhook Stripe              |
| `RESEND_API_KEY`           | Chave API do Resend para emails        |
| `ADMIN_EMAIL`              | Email destino das notificações         |
| `FIREBASE_PROJECT_ID`      | ID do projeto Firebase                 |
| `FIREBASE_PRIVATE_KEY`     | Chave privada do service account       |
| `FIREBASE_CLIENT_EMAIL`    | Email do service account               |
| `CLOUDINARY_CLOUD_NAME`    | Nome da cloud Cloudinary               |
| `CLOUDINARY_API_KEY`       | Chave API do Cloudinary                |
| `CLOUDINARY_API_SECRET`    | Segredo API do Cloudinary              |
| `JWT_SECRET`               | Segredo para geração de tokens         |
| `FRONTEND_URL`             | URL do frontend (redirects do Stripe)  |
| `CALLMEBOT_API_KEY`        | Chave CallMeBot (opcional)             |

# 🔗 Recursos e Serviços - Di' Moda Íntima

Este documento lista todos os serviços externos, dependências e configurações do projeto.

---

## 🚀 Deploy & Hospedagem

### Frontend (Vercel)
- **URL:** https://vercel.com
- **Dashboard:** https://vercel.com/dashboard
- **Site:** https://dimoda-intima.vercel.app
- **Função:** Hospeda o frontend React/Vite
- **Variáveis de Ambiente:**
  - `VITE_API_URL` - URL do backend Railway

### Backend (Railway)
- **URL:** https://railway.app
- **Dashboard:** https://railway.app/dashboard
- **Função:** Hospeda o servidor Node.js/Express + Firebase
- **Variáveis de Ambiente:**
  - `JWT_SECRET` - Chave secreta para tokens JWT
  - `CLOUDINARY_CLOUD_NAME` - Nome do cloud Cloudinary
  - `CLOUDINARY_API_KEY` - API Key do Cloudinary
  - `CLOUDINARY_API_SECRET` - API Secret do Cloudinary
  - `FIREBASE_SERVICE_ACCOUNT` - JSON do service account Firebase
  - `RESEND_API_KEY` - API Key do Resend para emails
  - `ADMIN_EMAIL` - Email para receber notificações de pedidos
  - `STRIPE_SECRET_KEY` - Chave secreta do Stripe

---

## � Notificações por Email

### Resend
- **URL:** https://resend.com
- **Dashboard:** https://resend.com/emails
- **Função:** Envia emails de notificação de novos pedidos
- **Grátis:** 100 emails/dia
- **Variável:** `RESEND_API_KEY`

---

## �🖼️ Armazenamento de Imagens

### Cloudinary
- **URL:** https://cloudinary.com
- **Dashboard:** https://console.cloudinary.com
- **Função:** Armazena e otimiza imagens de produtos
- **Credenciais:**
  - Cloud Name: `dlsbmzkwr`
  - API Key: `846998386898287`
  - API Secret: *(ver Railway variables)*

---

## 📦 Banco de Dados

### Firebase Firestore
- **URL:** https://console.firebase.google.com
- **Função:** Banco de dados NoSQL em nuvem
- **Collections:** `products`, `orders`, `users`, `categories`, `site_config`

---

## 💳 Pagamentos

### Stripe
- **URL:** https://stripe.com
- **Dashboard:** https://dashboard.stripe.com
- **Função:** Pagamentos com cartão de crédito
- **Variável:** `STRIPE_SECRET_KEY`

### PIX Manual
- **Chave:** 75983185141 (Telefone)
- **Beneficiário:** Di' Moda Íntima

---

## 🔐 Credenciais Admin

- **Email:** admin@dimoda.com
- **Senha:** 3970402dimoda

---

## � Dependências Frontend

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "axios": "^1.6.2",
  "react-hot-toast": "^2.4.1",
  "lucide-react": "^0.294.0",
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0"
}
```

**DevDependencies:**
- `vite` - Build tool
- `tailwindcss` - Framework CSS
- `autoprefixer` / `postcss` - Processador CSS

---

## 📦 Dependências Backend

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "firebase-admin": "^13.6.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "cloudinary": "^1.41.0",
  "multer": "^2.0.0",
  "stripe": "^20.1.0",
  "mercadopago": "^2.11.0",
  "nodemailer": "^7.0.12",
  "resend": "^6.6.0",
  "sql.js": "^1.9.0"
}
```

---

## 📝 Comandos Úteis

### Frontend
```bash
cd frontend
npm install          # Instalar dependências
npm run dev          # Rodar em desenvolvimento
npm run build        # Build para produção
```

### Backend
```bash
cd backend
npm install          # Instalar dependências
npm run dev          # Rodar em desenvolvimento (hot reload)
npm start            # Rodar em produção
```

---

## 📁 Estrutura do Projeto

```
Di' Moda Intima/
├── frontend/              # App React/Vite
│   ├── src/
│   │   ├── admin/        # Páginas administrativas
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── contexts/     # Contextos React (Cart, Auth)
│   │   ├── layouts/      # Layouts (Public, Admin)
│   │   ├── pages/        # Páginas públicas
│   │   └── services/     # API client
│   └── package.json
│
├── backend/               # Servidor Node.js/Express
│   ├── routes/           # Rotas da API
│   ├── services/         # Serviços (email, etc)
│   ├── middleware/       # Auth middleware
│   ├── database-firebase.js
│   ├── server.js
│   └── package.json
│
└── RECURSOS.md           # Este arquivo
```

---

## ⚠️ Notas Importantes

1. **Nunca commite** arquivos `.env` no Git
2. Configure variáveis de ambiente **nos dashboards** (Vercel/Railway)
3. Mantenha as **API Keys seguras**
4. O tier gratuito do Resend permite **100 emails/dia**
5. Backup regular do Firebase é recomendado

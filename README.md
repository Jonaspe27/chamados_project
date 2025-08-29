# Zendesk-like Help Desk (Node.js + MongoDB + JWT)

Estrutura pronta para deploy no Render. Antes de subir, configure as variáveis de ambiente conforme `.env.example`.

Seed automático cria `admin@local` / `1234` no primeiro start, se não houver admin.

Para rodar local:
1. Copie `.env.example` para `.env` e ajuste MONGODB_URI ou DB_*.
2. `npm install`
3. `npm run dev` (ou `npm start`)

Endpoints principais:
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/register (admin)
- GET /api/tickets
- POST /api/tickets
- GET /api/tickets/:id
- PATCH /api/tickets/:id
- POST /api/tickets/:id/comments

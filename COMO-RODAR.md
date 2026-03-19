# ISP Manager — Como Rodar

---

## 🐳 Modo Docker (Recomendado)

### Pré-requisito único
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando

### 1. Configure as variáveis de ambiente
```bash
# O arquivo .env já está criado com valores padrão.
# Edite se quiser trocar senhas:
notepad .env
```

### 2. Suba tudo com um comando
```bash
docker compose up -d --build
```

Isso vai:
1. Baixar imagens do PostgreSQL 16 e Nginx
2. Fazer o build do backend (NestJS)
3. Fazer o build do frontend (React + Vite)
4. Criar o banco de dados automaticamente
5. Rodar as migrations do Prisma
6. Executar o seed com dados iniciais
7. Subir tudo em rede interna

### 3. Acesse o sistema
| Serviço | URL |
|---|---|
| **Aplicação** | http://localhost |
| **API** | http://localhost:3000/api |
| **Swagger** | http://localhost:3000/api/docs |

### Credenciais padrão
| Usuário | Email | Senha |
|---|---|---|
| Administrador | admin@provedor.com.br | Admin@123 |
| Financeiro | financeiro@provedor.com.br | Fin@123 |

### Comandos úteis
```bash
# Ver status dos containers
docker compose ps

# Ver logs em tempo real
docker compose logs -f

# Logs só do backend
docker compose logs -f backend

# Parar tudo
docker compose down

# Parar e remover banco (CUIDADO: apaga os dados!)
docker compose down -v

# Rebuild sem cache (atualizar código)
docker compose build --no-cache && docker compose up -d

# Shell no banco
docker compose exec postgres psql -U isp_user -d isp_manager

# Shell no backend
docker compose exec backend sh
```

Se tiver `make` instalado:
```bash
make up       # sobe
make build    # sobe com rebuild
make logs     # logs
make down     # para
make shell-db # shell no postgres
make reset    # recria tudo do zero
```

---

## 💻 Modo Desenvolvimento Local (sem Docker)

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+ rodando localmente

### Backend
```bash
cd backend

# Ajuste o .env com seu PostgreSQL local
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/isp_manager"

npm install
npx prisma migrate dev --name init
npm run db:seed
npm run start:dev
```
API: http://localhost:3000/api
Swagger: http://localhost:3000/api/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App: http://localhost:5173

---

## 🏗️ Arquitetura Docker

```
┌─────────────────────────────────────────────────────┐
│                   Host (Windows)                     │
│  localhost:80        localhost:3000    localhost:5432 │
└──────┬───────────────────┬──────────────────┬────────┘
       │                   │                  │
┌──────▼──────┐  ┌─────────▼──────┐  ┌───────▼──────┐
│  isp_frontend│  │  isp_backend   │  │ isp_postgres  │
│  nginx:1.27  │  │  node:22       │  │ postgres:16   │
│  porta 80    │  │  porta 3000    │  │ porta 5432    │
│              │  │                │  │               │
│  React SPA   │  │  NestJS API    │  │  PostgreSQL   │
│  /api → proxy│──▶  Prisma ORM   ├──▶  isp_manager  │
└─────────────┘  └────────────────┘  └───────────────┘
         │_____________isp_network________________│
```

### Volumes persistentes
- `isp_postgres_data` — dados do PostgreSQL (preservado entre restarts)

---

## 📁 Estrutura do Projeto

```
Coontrole de internet/
├── docker-compose.yml       # Orquestração Docker
├── .env                     # Variáveis de ambiente
├── .env.example             # Exemplo de variáveis
├── Makefile                 # Comandos de conveniência
│
├── backend/                 # NestJS + Prisma + PostgreSQL
│   ├── Dockerfile           # Multi-stage build
│   ├── docker-entrypoint.sh # Migration + seed automático
│   ├── src/
│   │   ├── modules/         # auth, users, customers, plans, contracts, receivables, dashboard
│   │   ├── prisma/          # PrismaService
│   │   └── common/          # guards, decorators, filters
│   └── prisma/
│       ├── schema.prisma    # Schema do banco
│       └── seed.ts          # Dados iniciais
│
└── frontend/                # React + Vite + Tailwind
    ├── Dockerfile           # Build + nginx
    ├── nginx.conf           # Proxy reverso + SPA routing
    └── src/
        ├── pages/           # dashboard, customers, receivables, auth
        ├── components/      # layout, common, dashboard
        ├── services/        # API calls
        ├── store/           # Zustand (auth)
        ├── types/           # TypeScript types
        └── utils/           # formatters
```

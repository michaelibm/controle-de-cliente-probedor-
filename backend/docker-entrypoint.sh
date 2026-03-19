#!/bin/sh
set -e

echo "─────────────────────────────────────────────"
echo "  ISP Manager — Backend"
echo "─────────────────────────────────────────────"

# Aguarda o PostgreSQL ficar disponível
echo "⏳ Aguardando PostgreSQL..."
until node -e "
  const { Client } = require('pg');
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  c.connect().then(() => { console.log('ok'); c.end(); process.exit(0); })
    .catch(() => process.exit(1));
" 2>/dev/null; do
  sleep 2
done
echo "✅ PostgreSQL disponível"

# Aplica migrations
echo "🗄️  Aplicando migrations..."
npx prisma migrate deploy

# Roda seed se variável estiver definida
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Executando seed..."
  node dist/prisma/seed.js || echo "⚠️  Seed pulado (já executado ou erro ignorado)"
fi

echo "🚀 Iniciando servidor..."
exec node dist/main

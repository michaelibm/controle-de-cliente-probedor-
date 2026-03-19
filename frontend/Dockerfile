# ── Stage 1: Build ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Injeta a URL da API para o build (aponta para o nginx proxy interno)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Nginx ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove config padrão
RUN rm /etc/nginx/conf.d/default.conf

# Copia nossa config do nginx
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copia arquivos do build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

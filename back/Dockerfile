FROM oven/bun:1 AS base

WORKDIR /app

FROM base AS builder
# Copia arquivos de dependência primeiro (para aproveitar cache do apt)
COPY package.json bun.lock ./

# Instalar dependências de sistema para compilar módulos nativos (better-sqlite3)
# Isso fica após copiar package.json para que mudanças no código não invalidem este cache
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependências do Bun (cacheado se package.json não mudar)
RUN bun install --frozen

# Copiar código fonte (muda com frequência)
COPY . .

FROM base AS runner
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/bun.lock ./

EXPOSE 3000

ENV NODE_ENV=production
ENV SCRAPER_HEADLESS=true

CMD ["bun", "run", "src/index.ts"]

FROM oven/bun:1

WORKDIR /app

# Instalar dependências do sistema para Playwright
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lockb ./
RUN bun install

# Instalar browsers do Playwright (Chromium)
RUN bunx playwright install chromium

COPY . .

EXPOSE 3000

ENV NODE_ENV=development
ENV SCRAPER_HEADLESS=true

CMD ["bun", "run", "dev"]

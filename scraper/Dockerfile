FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

# Copia arquivos de dependência primeiro (para aproveitar cache do apt)
COPY package.json bun.lock ./

# Instalar dependências de sistema (unzip é necessário para instalar o bun)
# Isso fica após copiar package.json para que mudanças no código não invalidem este cache
RUN apt-get update && apt-get install -y \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Instalar Bun
RUN curl -fsSL https://bun.sh/install | bash

# Instalar dependências do Bun (cacheado se package.json não mudar)
RUN /root/.bun/bin/bun install --frozen

# Copiar código fonte (muda com frequência)
COPY . .

# Expor porta do scraper
EXPOSE 4000

# Configurar ambiente
ENV NODE_ENV=production
ENV HEADLESS=true

# Iniciar scraper
CMD ["/root/.bun/bin/bun", "run", "src/index.ts"]

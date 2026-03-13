FROM mcr.microsoft.com/playwright/browsers:latest

WORKDIR /app

# Instalar Bun
RUN curl -fsSL https://bun.sh/install | bash

# Copiar package.json e instalar dependências
COPY package.json ./
RUN /root/.bun/bin/bun install

# Copiar código fonte
COPY . .

# Expor porta do scraper
EXPOSE 4000

# Configurar ambiente
ENV NODE_ENV=production
ENV HEADLESS=true

# Iniciar scraper
CMD ["/root/.bun/bin/bun", "run", "start"]

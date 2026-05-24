# Build stage
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen
COPY . .

# Build com variável de ambiente para produção
ENV VITE_API_BASE_URL=/api
ENV VITE_DISABLE_REGISTRATION=true
RUN bun run build

# Production stage com Caddy
FROM caddy:2-alpine

RUN addgroup -g 1001 appgroup && \
adduser -u 1001 -G appgroup -D appuser
RUN chown -R appuser:appgroup /srv && \
chmod -R 755 /srv

USER appuser

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv


EXPOSE 7000
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

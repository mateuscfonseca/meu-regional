FROM oven/bun:1 AS base

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen

COPY . .

RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -m -d /app appuser && \
    mkdir -p /app/data && \
    chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production

EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]

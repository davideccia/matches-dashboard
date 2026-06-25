FROM node:22-alpine AS base
RUN corepack enable pnpm

FROM base AS build
WORKDIR /app
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN pnpm run build

FROM base AS runtime
RUN addgroup -g 1001 -S www-data && adduser -S www-data -u 1001 -G www-data
WORKDIR /app
COPY --from=build --chown=www-data:www-data /app/.output /app/.output
USER www-data
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1
CMD ["node", ".output/server/index.mjs"]

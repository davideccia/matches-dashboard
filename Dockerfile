FROM node:22-alpine AS base
RUN corepack enable pnpm

FROM base AS build
WORKDIR /app
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
ARG NUXT_PUBLIC_API_BASE=http://localhost:8081
ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE
RUN pnpm run build

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.output/public /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/index.html || exit 1

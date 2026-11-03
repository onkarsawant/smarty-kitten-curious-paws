# syntax=docker/dockerfile:1

# ---- Build stage ----
# Builds the TanStack Start app as a standalone Node server
# (NITRO_PRESET=node-server) instead of the default Cloudflare target.
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .
ENV NITRO_PRESET=node-server
RUN bun run build

# ---- Runtime stage ----
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server/index.mjs"]

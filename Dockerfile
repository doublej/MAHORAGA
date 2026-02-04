# Stage 1: Install worker dependencies
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Install dashboard dependencies
FROM node:22-slim AS dashboard-deps
WORKDIR /app/dashboard
COPY dashboard/package.json dashboard/package-lock.json ./
RUN npm ci

# Stage 3: App with source code
# Using slim (Debian) instead of Alpine — workerd requires glibc
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json wrangler.jsonc ./
COPY src/ ./src/
COPY migrations/ ./migrations/

# Dashboard
COPY --from=dashboard-deps /app/dashboard/node_modules ./dashboard/node_modules
COPY dashboard/ ./dashboard/

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Typecheck at build time — fails the build if types are broken
RUN npx tsc --noEmit
RUN cd dashboard && npx svelte-kit sync && npx svelte-check --tsconfig ./tsconfig.json --threshold error

EXPOSE 8787 3000

# Entrypoint generates .dev.vars from env vars, starts wrangler + dashboard
ENTRYPOINT ["./docker-entrypoint.sh"]

# Next.js web app (React frontend + TypeScript BFF). Build context = repo root.
FROM node:20-alpine
RUN corepack enable
WORKDIR /repo

# Manifests first for layer caching
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --no-frozen-lockfile

# Sources
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm -C apps/web build

EXPOSE 3000
ENV PORT=3000
CMD ["pnpm", "-C", "apps/web", "start"]

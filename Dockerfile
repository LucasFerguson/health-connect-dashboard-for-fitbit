# Multi-stage build producing a Next.js standalone server.
#
# `output: "standalone"` in next.config.js makes Next emit a self-contained
# server plus only the node_modules it actually traced, so the runtime stage
# never installs dependencies or carries dev tooling.

FROM node:20-alpine AS dependencies
WORKDIR /app
# Only the manifests, so this layer caches until dependencies actually change.
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# The generated GraphQL types are committed, so the build needs no network
# access and no running backend. Refresh them with `npm run codegen` on the
# host when the schema changes.
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Bind all interfaces: the default localhost-only bind is unreachable from
# outside the container.
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
# `standalone` already contains the traced node_modules and server.js.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER node
EXPOSE 3000

# Next has no dedicated health endpoint; `/api/sync-status` is the cheapest
# real route (small JSON, no pipeline run) that proves the server is serving.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/sync-status').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]

FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
# Pin npm to the same major that generated package-lock.json, so `npm ci`
# validates the lock file identically to the development environment.
RUN npm install --global npm@11 && npm ci

FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SITE_URL=https://crescimentovertical.com
ARG NEXT_PUBLIC_CONTACT_EMAIL=contato@crescimentovertical.com
ARG NEXT_PUBLIC_WHATSAPP_NUMBER
ARG NEXT_PUBLIC_WHATSAPP_DISPLAY
ARG NEXT_PUBLIC_WHATSAPP_MESSAGE
ARG SITE_NOINDEX=false

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL
ENV NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER
ENV NEXT_PUBLIC_WHATSAPP_DISPLAY=$NEXT_PUBLIC_WHATSAPP_DISPLAY
ENV NEXT_PUBLIC_WHATSAPP_MESSAGE=$NEXT_PUBLIC_WHATSAPP_MESSAGE
ENV SITE_NOINDEX=$SITE_NOINDEX

RUN npm run build

# One-shot migration stage: full app context (payload CLI + config + migrations).
FROM node:22-alpine AS migrate
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/payload.config.ts ./payload.config.ts
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/src ./src

RUN chown -R nextjs:nodejs \
  /app/package.json \
  /app/tsconfig.json \
  /app/payload.config.ts \
  /app/migrations \
  /app/src

USER nextjs

CMD ["node", "node_modules/payload/bin.js", "migrate"]

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV PAYLOAD_MEDIA_DIR=/app/media

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /app/media \
  && chown nextjs:nodejs /app/media

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health/live').then((response) => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"]

CMD ["node", "server.js"]

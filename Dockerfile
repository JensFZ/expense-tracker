# ── Stage 1: Abhängigkeiten installieren ─────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
RUN npm run build

# ── Stage 2b: Tesseract-Sprachdaten herunterladen ────────────────────────────
FROM node:20-alpine AS tessdata
RUN apk add --no-cache curl \
 && mkdir -p /tessdata \
 && curl -fsSL -o /tessdata/deu.traineddata \
      https://github.com/tesseract-ocr/tessdata_fast/raw/main/deu.traineddata \
 && curl -fsSL -o /tessdata/eng.traineddata \
      https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data
ENV TESSDATA_PATH=/app/tessdata

# Nicht-root-Benutzer für Sicherheit
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone-Output kopieren
COPY --from=builder   --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder   --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder   --chown=nextjs:nodejs /app/public           ./public

# Tesseract-Sprachdaten einbetten
COPY --from=tessdata --chown=nextjs:nodejs /tessdata ./tessdata

# Datenverzeichnis anlegen (wird als Volume eingebunden)
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

---

## Produktiv-Deployment

> **Wichtig:** Die App verwendet `better-sqlite3` und schreibt die Datenbank unter `./data/expenses.db` (relativ zum Arbeitsverzeichnis). Serverless-Plattformen wie Vercel sind daher **nicht geeignet**. Für den Produktivbetrieb wird ein Node.js-Server mit persistentem Dateisystem benötigt.

### Voraussetzungen

- Node.js 20 oder neuer
- npm 10 oder neuer
- Schreibrechte auf das `data/`-Verzeichnis im App-Ordner

---

### Option 1 – Direkt auf einem Server (z. B. VPS, Raspberry Pi)

```bash
# 1. Repository klonen und Abhängigkeiten installieren
git clone <repo-url> expense-tracker
cd expense-tracker
npm ci --omit=dev

# 2. Produktions-Build erstellen
npm run build

# 3. App starten (Port über Umgebungsvariable konfigurierbar)
PORT=3000 npm start
```

Für dauerhaften Betrieb empfiehlt sich **PM2**:

```bash
npm install -g pm2

pm2 start npm --name "expense-tracker" -- start
pm2 save
pm2 startup   # systemd-Einheit automatisch einrichten
```

---

### Option 2 – Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Image bauen und starten (data/ als Volume für Persistenz)
docker build -t expense-tracker .
docker run -d \
  -p 3000:3000 \
  -v /host/path/to/data:/app/data \
  --name expense-tracker \
  expense-tracker
```

> Damit `standalone`-Output erzeugt wird, muss in `next.config.ts` `output: "standalone"` gesetzt sein.

---

### Option 3 – Docker Compose

```yaml
# docker-compose.yml
services:
  expense-tracker:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3000
```

```bash
docker compose up -d
```

---

### Reverse Proxy (Nginx)

Empfohlen, um HTTPS und einen eigenen Domain-Namen zu verwenden:

```nginx
server {
    listen 80;
    server_name meine-domain.de;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name meine-domain.de;

    ssl_certificate     /etc/letsencrypt/live/meine-domain.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/meine-domain.de/privkey.pem;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

TLS-Zertifikat mit Let's Encrypt:

```bash
certbot --nginx -d meine-domain.de
```

---

### Datenbank-Backup

Die gesamte App-Datenbank besteht aus einer einzigen Datei:

```bash
# Backup erstellen
cp data/expenses.db data/expenses_$(date +%Y%m%d).db

# Automatisches tägliches Backup per Cron
0 3 * * * cp /opt/expense-tracker/data/expenses.db /backups/expenses_$(date +\%Y\%m\%d).db
```

---

### Umgebungsvariablen

| Variable   | Standard | Beschreibung              |
|------------|----------|---------------------------|
| `PORT`     | `3000`   | Port, auf dem die App lauscht |
| `NODE_ENV` | –        | Auf `production` setzen   |

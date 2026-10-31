# Cloud Run: one container serves the sales page (/), the React app (/admin/) and the Nest API (/api), see server.cjs.
# Data: the Turso database when TURSO_DATABASE_URL / TURSO_AUTH_TOKEN are set (the live demo data);
# otherwise a copy of prisma/demo.db in /tmp, which resets when the instance restarts.
FROM node:20-slim
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --no-audit --no-fund
COPY . .
RUN npx prisma generate && npx tsc -p tsconfig.json && cd frontend && VITE_API_BASE=/api npx vite build
ENV NODE_ENV=production PORT=8080 DATABASE_URL=file:/tmp/demo.db
EXPOSE 8080
CMD ["sh", "-c", "if [ -z \"$TURSO_DATABASE_URL\" ]; then cp prisma/demo.db /tmp/demo.db 2>/dev/null; npx prisma db push --skip-generate --accept-data-loss; fi; exec node server.cjs"]

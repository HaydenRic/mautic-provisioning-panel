# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set dummy DATABASE_URL for build
ENV DATABASE_URL="file:./dev.db"
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create nodejs user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

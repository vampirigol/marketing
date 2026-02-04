# Backend Dockerfile
FROM node:18-alpine AS base

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 backend

# Copy package files and install ALL dependencies (including tsx)
COPY --chown=backend:nodejs package*.json ./
RUN npm ci

# Copy source code
COPY --chown=backend:nodejs . .

USER backend

EXPOSE 3001

ENV PORT 3001

CMD ["npm", "start"]

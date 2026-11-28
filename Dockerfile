# RK GEM AI — production image
# Multi-stage: deps → build → slim runner. Works on Hugging Face Spaces,
# Render, Railway, Fly.io and any VPS with Docker.

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package*.json ./
RUN npm install --no-audit --no-fund

FROM deps AS builder
COPY . .
# Some features (studio media generators) live in git submodules. They are
# optional for the chat app, so we no longer hard-fail the build.
RUN NEXT_OUTPUT=standalone npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]

# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile

# Install dependencies only when needed
FROM node:14-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM node:14-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN yarn build

# DSB Container
FROM 098061033856.dkr.ecr.us-east-1.amazonaws.com/ew-dos-dsb-ecr:latest

RUN apk update && apk add --no-cache supervisor yarn
RUN mkdir -p /var/deployment/apps/aemo-gateway-ui

WORKDIR /var/deployment/apps/aemo-gateway-ui

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.env.production ./.env.production

WORKDIR /var/deployment/apps

COPY --from=builder /app/docker/supervisord.conf /etc/supervisord.conf

ENV NEXT_TELEMETRY_DISABLED 1

ENTRYPOINT [ "supervisord", "-c", "/etc/supervisord.conf" ]

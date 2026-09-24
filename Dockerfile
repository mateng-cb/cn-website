FROM swr.cn-north-4.myhuaweicloud.com/kzzx/node:20-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm@10.11.1
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM swr.cn-north-4.myhuaweicloud.com/kzzx/node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@10.11.1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG SITE_URL=https://suanlihaiyang.com
ARG STRAPI_URL=http://strapi:1337
ARG REVALIDATE_TOKEN
ARG PREVIEW_SECRET
ARG STRAPI_PREVIEW_TOKEN
ENV NEXT_TELEMETRY_DISABLED=1 \
    SITE_URL=$SITE_URL \
    STRAPI_URL=$STRAPI_URL \
    REVALIDATE_TOKEN=$REVALIDATE_TOKEN \
    PREVIEW_SECRET=$PREVIEW_SECRET \
    STRAPI_PREVIEW_TOKEN=$STRAPI_PREVIEW_TOKEN
RUN pnpm build

FROM swr.cn-north-4.myhuaweicloud.com/kzzx/node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]

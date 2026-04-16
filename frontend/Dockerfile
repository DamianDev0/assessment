FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:5050
ARG NEXT_PUBLIC_ORG_ID=00000000-0000-0000-0000-000000000001
ARG NEXT_PUBLIC_DEFAULT_CUSTOMER_ID=00000000-0000-0000-0000-000000000002
ARG NEXT_PUBLIC_GEOAPIFY_KEY=d7d9bebdc8b54e3a87fe3050d696f2f8

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ORG_ID=$NEXT_PUBLIC_ORG_ID
ENV NEXT_PUBLIC_DEFAULT_CUSTOMER_ID=$NEXT_PUBLIC_DEFAULT_CUSTOMER_ID
ENV NEXT_PUBLIC_GEOAPIFY_KEY=$NEXT_PUBLIC_GEOAPIFY_KEY

RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]

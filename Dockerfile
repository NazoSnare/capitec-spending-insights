# Spending Insights: the Next.js app and its mock API in one small image.
#
#   docker build -t spending-insights .
#   docker run --rm -p 3000:3000 spending-insights
#
# Three stages, so the final image carries only Next's standalone server and the files
# it uses: no dev dependencies, no source, no build tools.

ARG NODE_VERSION=22-alpine

# 1. Dependencies, from the lockfile exactly.
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# 2. Lint, unit tests and the production build. A failing test fails the image build,
#    so an image that exists has passed them.
FROM node:${NODE_VERSION} AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run lint && npm test && npm run build

# 3. Runtime: the standalone server only, as an unprivileged user.
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
# The API is part of the app, so a real endpoint is the health check.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/customers/12345/filters').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# `node server.js`, not `npm start`: next start pins its own port and ignores PORT.
CMD ["node", "server.js"]

# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app

COPY website/package.json website/package-lock.json ./
RUN npm ci

COPY website .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/package-lock.json ./
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY --from=build /app/middleware.ts ./middleware.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/next-env.d.ts ./next-env.d.ts
COPY --from=build /app/app ./app
COPY --from=build /app/components ./components
COPY --from=build /app/lib ./lib

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]

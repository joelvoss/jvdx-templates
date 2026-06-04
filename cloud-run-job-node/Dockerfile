FROM node:24-trixie-slim AS build

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends jq \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json Taskfile.sh tsconfig.json vite.config.ts ./

RUN ["npm", "ci"]

COPY src ./src

RUN ["./Taskfile.sh", "build"]

################################################################################

FROM node:24-trixie-slim AS prod-dependencies

WORKDIR /app

COPY --from=build /app/dist/package.json ./package.json
COPY --from=build /app/dist/package-lock.json ./package-lock.json

RUN ["npm", "ci", "--omit=dev"]

################################################################################

FROM gcr.io/distroless/nodejs24-debian13:nonroot AS runner

WORKDIR /app

COPY --chown=65532:65532 --from=build /app/dist ./
COPY --chown=65532:65532 --from=prod-dependencies /app/node_modules ./node_modules

ENV NODE_ENV=production

CMD [ "index.js" ]

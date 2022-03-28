# //////////////////////////////////////////////////////////////////////////////
# DEPENDENCY STAGE

FROM node:16-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# //////////////////////////////////////////////////////////////////////////////
# BUILDER STAGE

FROM node:16-alpine AS builder
# Alpine does not come with a bash shell
RUN apk add --no-cache --upgrade bash
WORKDIR /app

COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN ./Taskfile.sh build

# //////////////////////////////////////////////////////////////////////////////
# RUNNER STAGE

FROM node:16-alpine as runner
# Alpine does not come with a bash shell
RUN apk add --no-cache --upgrade bash
WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S runner -u 1001

ENV NODE_ENV production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/Taskfile.sh ./Taskfile.sh
COPY --from=builder /app/dist ./dist

USER runner

EXPOSE 3000
ENV PORT 3000

CMD [ "./Taskfile.sh", "start" ]
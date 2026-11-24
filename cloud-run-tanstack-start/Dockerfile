FROM node:26-trixie-slim AS build

WORKDIR /app

COPY dist ./

RUN npm ci --only=production

################################################################################

FROM gcr.io/distroless/nodejs26-debian13:nonroot

WORKDIR /app

COPY --chown=65532:65532 --from=build /app ./

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["express-server.js"]

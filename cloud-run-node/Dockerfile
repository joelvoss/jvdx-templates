FROM node:24-trixie-slim AS build

WORKDIR /app

COPY dist ./

RUN npm ci --only=production

################################################################################

FROM gcr.io/distroless/nodejs24-debian13

WORKDIR /app

COPY --from=build /app ./

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD [ "index.js" ]

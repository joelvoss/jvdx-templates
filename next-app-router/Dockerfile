FROM node:20-alpine
WORKDIR /app

ENV PORT 3000
# NOTE(joel): Set hostname to localhost
ENV HOSTNAME "0.0.0.0"
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 runner

# NOTE(joel): Copy pre-build standalone bundle and only allow runner to read 
# write and execute it.
COPY --chown=runner:nodejs --chmod=700 ./standalone .

USER runner

EXPOSE 3000

CMD ["node", "server.js"]
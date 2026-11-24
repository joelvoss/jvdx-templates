FROM gcr.io/distroless/nodejs26-debian13:nonroot

WORKDIR /app

ENV PORT=3000
# NOTE(joel): Set hostname to localhost
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# NOTE(joel): Copy pre-build standalone bundle and only allow runner to read 
# write and execute it.
COPY --chown=65532:65532 ./standalone .

EXPOSE 3000

CMD ["server.js"]
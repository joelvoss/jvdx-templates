FROM gcr.io/distroless/nodejs24-debian12

WORKDIR /app

ENV PORT=3000
# NOTE(joel): Set hostname to localhost
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# NOTE(joel): Copy pre-build standalone bundle and only allow runner to read 
# write and execute it.
COPY ./standalone .

EXPOSE 3000

CMD ["server.js"]
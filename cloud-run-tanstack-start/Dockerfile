FROM node:24 AS deps

WORKDIR /app

ENV NODE_ENV=production

COPY ./dist ./
RUN npm ci --omit=dev && npm cache clean --force

FROM gcr.io/distroless/nodejs24-debian12 AS runner

WORKDIR /app

# Copy build artifacts and production dependencies from deps stage
COPY --from=deps /app ./

# Expose port (Cloud Run will set PORT env var)
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV=production
ENV PORT=3000

# Run as non-root for security
USER nonroot

# Start the application
CMD ["express-server.mjs"]

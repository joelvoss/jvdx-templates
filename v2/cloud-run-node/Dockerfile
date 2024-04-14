FROM node:20-alpine

RUN addgroup -g 1001 -S nodejs
RUN adduser -S runner -u 1001

WORKDIR /app

COPY dist ./

RUN npm ci --only=production

USER runner

EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV production

CMD [ "node", "index.js" ]
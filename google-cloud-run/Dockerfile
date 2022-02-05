# Use the official lightweight Node.js 10 image.
FROM node:16-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# Copying this separately prevents re-running the dependency install process
# on every build
COPY package.json package-lock.json yarn.lock Taskfile.sh ./

# Install production dependencies.
RUN yarn --frozen-lockfile

# Copy application code
RUN mkdir ./dist
COPY ./dist ./dist

# Use special node user, so our app won't run as root.
# To install dependencies we needed root priveleges.
USER node

# Run the web service on container startup.
CMD [ "./Taskfile.sh", "start" ]
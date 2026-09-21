# Small and boring on purpose.
FROM node:22-alpine

WORKDIR /app

# Dependencies first, so a code change does not re-install them on every build.
COPY package.json package-lock.json* ./
# `npm ci` when a lockfile is present, `npm install` when it is not. A fresh
# clone that has never run `npm install` locally would otherwise fail the build
# with an error about the lockfile rather than about what is actually missing.
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY src ./src
COPY migrations ./migrations
COPY scripts ./scripts

# Do not run as root.
USER node

EXPOSE 8080
CMD ["node", "src/index.js"]

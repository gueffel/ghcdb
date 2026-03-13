FROM node:20-slim

# Install Chromium and its system dependencies via apt
RUN apt-get update && apt-get install -y \
  chromium \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Tell the scraper where to find system Chromium
ENV CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY . .

# Build the frontend
RUN cd client && npm install && npm run build

# Install server dependencies (no devDeps)
RUN cd server && npm install --omit=dev

EXPOSE 3000
CMD ["node", "--no-warnings", "server/server.js"]

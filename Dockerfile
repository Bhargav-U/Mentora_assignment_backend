# Use lightweight Node Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application source
COPY . .

# Expose API port
EXPOSE 3000

# Start the server
CMD ["node", "src/server.js"]
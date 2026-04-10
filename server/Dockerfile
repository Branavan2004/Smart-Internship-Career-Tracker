# Use Node.js 18 alpine as base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the server code
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the server using the entry point identified in package.json
CMD ["node", "src/server.js"]

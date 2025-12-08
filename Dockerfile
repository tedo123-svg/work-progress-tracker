# Dockerfile for Back4App deployment
# This file should be at the repository root
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend application files
COPY backend/ ./

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]

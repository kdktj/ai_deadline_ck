# Frontend Dockerfile for AI Deadline Forecasting Agent
# Vite 7.1.7+ requires Node.js 20.19+ or 22.12+
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose Vite default port
EXPOSE 5173

# Set environment variable to allow external connections
ENV HOST=0.0.0.0

# Development mode with hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

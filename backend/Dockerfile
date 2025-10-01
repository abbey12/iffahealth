# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm i --only=production
COPY --from=builder /app/dist ./dist

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the /app directory to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# EB single-container Docker platform expects app to run on port 80
ENV PORT=80
ENV HOST=0.0.0.0


# Expose port 80
EXPOSE 80

# Start the application
CMD ["npm", "start"]
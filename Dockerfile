# ===============================
# Stage 1: Build
# ===============================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for caching
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY ./src ./src

# Copy keys & firebase service account (make sure এই ফাইলগুলো project folder-এ আছে)
COPY firebase-service-account.json ./firebase-service-account.json
COPY ./keys ./keys

# Build TypeScript
RUN npm run build

# ===============================
# Stage 2: Production
# ===============================
FROM node:20-alpine

WORKDIR /app

# Copy only package.json & production deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy built JS from builder
COPY --from=builder /app/dist ./dist

# Copy keys & firebase service account
COPY --from=builder /app/firebase-service-account.json ./firebase-service-account.json
COPY --from=builder /app/keys ./keys

# Expose port
EXPOSE 5000

# Start app
CMD ["node", "./dist/server.js"]

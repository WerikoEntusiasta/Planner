# --- Step 1: Build Stage ---
FROM node:20-alpine AS builder

# Install build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies (dev + prod)
RUN npm install

# Copy application source files
COPY . .

# Compile frontend and backend bundle
RUN npm run build

# Prune devDependencies to keep only production node_modules
RUN npm prune --production

# --- Step 2: Production Stage ---
FROM node:20-alpine

# Install libstdc++ required by native better-sqlite3 bindings
RUN apk add --no-cache libstdc++

WORKDIR /app

# Copy production package definitions, pruned node_modules and compiled dist
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Create the /dados directory inside the container for SQLite volume mapping
RUN mkdir -p /dados

# Expose port 3000 (standard full-stack port)
EXPOSE 3000

# Configure production environment
ENV NODE_ENV=production

# Start the application
CMD ["npm", "run", "start"]

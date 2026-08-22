# --- Step 1: Build Stage ---
FROM node:22-alpine AS builder

# Install build tools for native modules
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
FROM node:22-alpine

# Install libstdc++ required by native binaries
RUN apk add --no-cache libstdc++ wget

WORKDIR /app

# Copy production package definitions, pruned node_modules and compiled dist
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Create directories for data and media uploads
RUN mkdir -p /dados /app/public/uploads

# Expose port 3000
EXPOSE 3000

# Configure production environment
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["npm", "run", "start"]

# Stage 1: Build the React application
FROM node:20-slim AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run the Node.js server
FROM node:20-slim

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy the build output and the server code
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./
COPY --from=build /app/package.json ./

# Cloud Run sets the PORT environment variable
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start the server
CMD ["node", "server.js"]

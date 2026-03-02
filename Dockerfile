# Stage 1: Build the React application
FROM node:20-slim AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
# Note: GEMINI_API_KEY must be provided as a build argument if you want it baked into the SPA
ARG GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$GEMINI_API_KEY
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine

# Copy the build output to the Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a custom Nginx configuration to handle SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run sets the PORT environment variable
# We use a shell script to replace the port in the nginx config at runtime
CMD ["/bin/sh", "-c", "sed -i 's/listen       8080;/listen       '${PORT:-8080}';/' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]

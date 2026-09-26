# --- Stage 1: Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies (layer-cached)
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Copy source and build
# Pass build-time variables as ARGs so the image can be built for different envs
ARG VITE_API_BASE_URL=http://localhost:8082
ARG VITE_WS_URL=http://localhost:8082/ws-tracker

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

COPY . .
RUN npm run build

# --- Stage 2: Production runtime (Nginx) ---
FROM nginx:stable-alpine AS runtime

# Remove default Nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# SPA routing config: all 404s fall back to index.html so React Router handles them
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    # Serve static assets with cache headers\n\
    location ~* \.(?:js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
        try_files $uri =404;\n\
    }\n\
\n\
    # SPA fallback — all unmatched routes serve index.html\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

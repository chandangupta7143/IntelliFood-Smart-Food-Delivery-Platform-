# IntelliFood — Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [MongoDB Setup](#mongodb-setup)
4. [Redis Setup](#redis-setup)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Docker Compose (Full Stack)](#docker-compose-full-stack)
8. [CORS Configuration](#cors-configuration)
9. [WebSocket (HTTPS/WSS)](#websocket)
10. [Health Verification](#health-verification)
11. [Known Limitations](#known-limitations)

---

## Prerequisites

| Tool | Minimum Version | Notes |
|------|-----------------|-------|
| Java JDK | 21 | Eclipse Temurin or OpenJDK |
| Apache Maven | 3.9 | For backend build |
| Node.js | 20 LTS | For frontend build |
| npm | 10+ | Bundled with Node 20 |
| MongoDB | 7.0 | Community or Atlas |
| Redis | 7.0 | Local, Cloud, or Docker |
| Docker | 24+ | Optional — for containerized deployment |

---

## Quick Start

### Local Development (3 Steps)

**Step 1: Start services**
```powershell
# MongoDB (Windows service)
net start MongoDB

# Redis (in PATH)
redis-server
```

**Step 2: Backend**
```powershell
cd food-delivery-backend
copy .env.example .env
# Edit .env — fill in JWT_SECRET, SURGE_TOKEN_SECRET, ADMIN_PASSWORD
mvn clean package -DskipTests
java -jar target/food-delivery-backend-0.0.1-SNAPSHOT.jar
```

**Step 3: Frontend**
```powershell
cd food-delivery-frontend
copy .env.example .env
npm install
npm run dev
```

URLs:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8082
- **Swagger UI**: http://localhost:8082/swagger-ui/index.html
- **Health**: http://localhost:8082/healthz

---

## MongoDB Setup

### Local MongoDB

```powershell
# Install MongoDB 7.0 Community Server from:
# https://www.mongodb.com/try/download/community

# Start as Windows service
net start MongoDB

# Verify connection
mongosh --eval "db.adminCommand('ping')"
```

Database name: `food_delivery` (created automatically on first connection)

Connection URI: `mongodb://localhost:27017/food_delivery`

### MongoDB Atlas (Production)

1. Create a cluster at https://cloud.mongodb.com
2. Create a database user with readWrite role on `food_delivery`
3. Add your server IP to the IP Access List
4. Get your connection string:

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/food_delivery?retryWrites=true&w=majority
```

5. Set as environment variable:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/food_delivery?retryWrites=true&w=majority
```

> **Production Note**: `auto-index-creation: false` in `application.yml`. You must create indexes manually in Atlas or via a migration script. Key indexes are defined with `@CompoundIndexes` on entity classes.

---

## Redis Setup

### Local Redis

```powershell
# Install Redis (Windows binaries from GitHub releases or WSL)
redis-server --port 6379

# Verify
redis-cli ping  # Should return: PONG
```

### Redis Cloud (Production)

Options: Redis Cloud, AWS ElastiCache, Azure Cache for Redis

```bash
# Set via environment variables:
REDIS_HOST=your-redis-host.region.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-auth-token   # If auth enabled
```

---

## Backend Deployment

### Environment Variables

Create a `.env` file (copy from `.env.example`) or set these in your deployment environment:

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/food_delivery` | Yes | MongoDB connection URI |
| `REDIS_HOST` | `localhost` | Yes | Redis hostname |
| `REDIS_PORT` | `6379` | No | Redis port (default: 6379) |
| `REDIS_PASSWORD` | *(empty)* | No | Redis password (if enabled) |
| `JWT_SECRET` | `<32+ random bytes, hex>` | **Yes** | JWT signing secret |
| `JWT_EXPIRATION` | `86400000` | No | JWT TTL in ms (default: 24h) |
| `SURGE_TOKEN_SECRET` | `<32+ random bytes, hex>` | **Yes** | HMAC quote token secret |
| `ADMIN_EMAIL` | `admin@intellifood.com` | No | Bootstrap admin email |
| `ADMIN_PASSWORD` | `<strong password>` | **Yes** | Bootstrap admin password |
| `ADMIN_NAME` | `System Admin` | No | Admin display name |
| `RESTAURANT_OWNER_EMAIL` | `owner@fooddelivery.com` | No | Bootstrap restaurant owner email |
| `RESTAURANT_OWNER_PASSWORD` | `<strong password>` | **Yes in prod** | Bootstrap restaurant owner password |
| `RESTAURANT_OWNER_NAME` | `Chef Ramesh (Owner)` | No | Restaurant owner display name |
| `CORS_ALLOWED_ORIGINS` | `https://app.intellifood.com` | **Yes in prod** | Comma-separated frontend URLs |
| `SERVER_PORT` | `8082` | No | HTTP server port |

**Generate secure secrets:**
```bash
# JWT_SECRET (64 hex chars = 256 bits)
openssl rand -hex 64

# SURGE_TOKEN_SECRET (32 hex chars = 128 bits minimum)
openssl rand -hex 32
```

### Build Backend

```powershell
cd food-delivery-backend
mvn clean package -DskipTests
```

Output: `target/food-delivery-backend-0.0.1-SNAPSHOT.jar`

### Run Backend (Native)

```powershell
java -jar target/food-delivery-backend-0.0.1-SNAPSHOT.jar
```

Or with explicit env vars:

```powershell
$env:MONGODB_URI = "mongodb://..."
$env:JWT_SECRET = "..."
$env:SURGE_TOKEN_SECRET = "..."
$env:ADMIN_PASSWORD = "..."
java -jar target/food-delivery-backend-0.0.1-SNAPSHOT.jar
```

### Run Backend (Docker)

```bash
cd food-delivery-backend
docker build -t intellifood-backend:latest .

docker run -d \
  --name intellifood-backend \
  -p 8082:8082 \
  -e MONGODB_URI="mongodb://host.docker.internal:27017/food_delivery" \
  -e REDIS_HOST=host.docker.internal \
  -e JWT_SECRET=your-jwt-secret \
  -e SURGE_TOKEN_SECRET=your-surge-secret \
  -e ADMIN_PASSWORD=your-admin-password \
  -e CORS_ALLOWED_ORIGINS=http://localhost:80 \
  intellifood-backend:latest
```

> The backend Docker image uses a non-root user (`spring:spring`) for security.

---

## Frontend Deployment

### Environment Variables

| Variable | Development | Production |
|----------|-------------|------------|
| `VITE_API_BASE_URL` | `http://localhost:8082` | `https://api.intellifood.com` |
| `VITE_WS_URL` | `http://localhost:8082/ws-tracker` | `wss://api.intellifood.com/ws-tracker` |

> **Important**: These variables are bundled into the client JavaScript. **Never put secrets here.**

### Build Frontend

```powershell
cd food-delivery-frontend

# For development/local
cp .env.example .env
# Edit .env if needed

npm install
npm run build  # Creates dist/ folder
```

### Serve Frontend (Native — Static Hosting)

The `dist/` folder contains a static SPA. Serve with any static hosting:

```bash
# Using Nginx (example config):
server {
    listen 80;
    root /path/to/food-delivery-frontend/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;  # SPA fallback
    }
}

# Or serve locally for preview:
npm run preview  # http://localhost:4173
```

### Build Frontend (Docker — Production)

The `VITE_API_BASE_URL` and `VITE_WS_URL` must be set at **build time** (they're baked into the JS bundle):

```bash
cd food-delivery-frontend

docker build \
  --build-arg VITE_API_BASE_URL=https://api.intellifood.com \
  --build-arg VITE_WS_URL=wss://api.intellifood.com/ws-tracker \
  -t intellifood-frontend:latest .

docker run -d \
  --name intellifood-frontend \
  -p 80:80 \
  intellifood-frontend:latest
```

The container serves the app from Nginx on port 80 with SPA routing support.

---

## Docker Compose (Full Stack)

Starts all four services: MongoDB, Redis, Backend, Frontend.

```bash
# From project root
cd INTELLIGENT-FOOD-DELIVERY-PLATFORM

# Set secrets (or use a .env file in project root)
export JWT_SECRET=your-jwt-secret-here
export SURGE_TOKEN_SECRET=your-surge-secret-here
export ADMIN_PASSWORD=YourSecurePassword@1

# Build and start
docker compose up --build

# Start in background
docker compose up -d --build

# View logs
docker compose logs -f backend

# Stop everything
docker compose down

# Stop and remove volumes (WARNING: deletes MongoDB data)
docker compose down -v
```

Service URLs when running via Compose:
- **Frontend**: http://localhost:80
- **Backend**: http://localhost:8082
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

> **Production Note**: For production, use managed MongoDB (Atlas) and Redis (ElastiCache / Redis Cloud). Remove the `mongo` and `redis` services from `docker-compose.yml` and set the appropriate connection URIs via environment variables.

---

## CORS Configuration

By default (development), the backend allows:
- `http://localhost:5173` (Vite dev)
- `http://localhost:4173` (Vite preview)

**Production**: Set `CORS_ALLOWED_ORIGINS` to your actual frontend URL(s):

```bash
# Single origin
CORS_ALLOWED_ORIGINS=https://app.intellifood.com

# Multiple origins (comma-separated)
CORS_ALLOWED_ORIGINS=https://app.intellifood.com,https://admin.intellifood.com
```

> **Never** use `*` for CORS in production with JWT authentication.

---

## WebSocket

### Development
```
VITE_WS_URL=http://localhost:8082/ws-tracker
```

### Production (HTTPS/WSS)
In production, all traffic must use HTTPS/WSS. Terminate TLS at a reverse proxy (Nginx, Caddy, AWS ALB):

```
VITE_WS_URL=wss://api.intellifood.com/ws-tracker
```

**Nginx reverse proxy example for WebSocket upgrade:**
```nginx
location /ws-tracker {
    proxy_pass http://backend:8082;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;
}
```

---

## Health Verification

After deployment, verify the system is healthy:

```bash
# Backend health
curl http://localhost:8082/healthz
# Expected: {"status":"UP"}

# System status (requires admin JWT)
curl -H "Authorization: Bearer <admin_jwt>" http://localhost:8082/api/admin/system/status
# Expected: mongodbConnected=true, redisConnected=true

# Swagger UI
open http://localhost:8082/swagger-ui/index.html

# OpenAPI JSON
curl http://localhost:8082/v3/api-docs
```

---

## Known Limitations

### 1. MongoDB Atlas Search (TEXT_SEARCH mode)
The `POST /api/search` endpoint with `searchMode: "TEXT_SEARCH"` uses MongoDB Atlas `$search` aggregation. On local/self-hosted MongoDB, the backend automatically falls back to a regex-based `$nearSphere` query. Fuzzy search (typo tolerance) requires Atlas.

**Resolution**: Deploy to MongoDB Atlas for full fuzzy search support.

### 2. FCM Push Notifications
Firebase Cloud Messaging (FCM) requires a service account credential file. In the current deployment, `FcmClient` logs push events to the console instead of delivering real push notifications. WebSocket in-app notifications work in all environments.

**Resolution**: Provide `GOOGLE_APPLICATION_CREDENTIALS` pointing to a Firebase service account JSON file, or implement the FCM HTTP v1 API with the credential in an environment variable.

### 3. Kafka Telemetry
`RecommendationTelemetryProducer` currently logs Kafka events to the console. Recommendation attribution and click telemetry are stored in MongoDB. No Kafka broker is required.

**Resolution**: Integrate with a real Kafka cluster if real-time telemetry streaming is required.

### 4. HTTPS Not Enforced by Application
The Spring Boot application does not enforce HTTPS. TLS must be terminated at an external reverse proxy or load balancer.

**Resolution**: Use Nginx/Caddy/AWS ALB for TLS termination. Do not expose the backend directly on port 8082 in production.

### 5. No Email Verification
User registration does not require email verification. All registered accounts are immediately active.

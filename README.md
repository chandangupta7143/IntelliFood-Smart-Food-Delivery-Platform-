# IntelliFood — Intelligent Food Delivery Platform

[![Vercel Deployment](https://img.shields.io/badge/Frontend-Vercel%20Live-brightgreen?logo=vercel)](https://intelli-food-smart-food-delivery-pl.vercel.app/)
[![Render Backend](https://img.shields.io/badge/Backend-Render%20Live-46E3B7?logo=render)](https://intellifood-smart-food-delivery-platform.onrender.com)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb)](https://cloud.mongodb.com/)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.4-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite)](https://vitejs.dev/)

> 🚀 **Production Status: LIVE & PUBLICLY ACCESSIBLE**  
> IntelliFood is a production-grade, full-stack food delivery ecosystem featuring real-time STOMP WebSocket order tracking, geospatial restaurant discovery, dynamic surge pricing, AI-powered recommendations, fraud detection, and automated delivery assignment.

---

## 🌐 Live Production Deployments

| Component | Platform | Live URL | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | **Vercel** | [https://intelli-food-smart-food-delivery-pl.vercel.app/](https://intelli-food-smart-food-delivery-pl.vercel.app/) | ✅ `Live / Ready` |
| **Backend API** | **Render** | [https://intellifood-smart-food-delivery-platform.onrender.com](https://intellifood-smart-food-delivery-platform.onrender.com) | ✅ `Live / Healthy` |
| **API Healthz** | **Render** | [https://intellifood-smart-food-delivery-platform.onrender.com/healthz](https://intellifood-smart-food-delivery-platform.onrender.com/healthz) | ✅ `HTTP 200 {"status":"UP"}` |
| **Interactive Swagger Docs** | **Render** | [https://intellifood-smart-food-delivery-platform.onrender.com/swagger-ui/index.html](https://intellifood-smart-food-delivery-platform.onrender.com/swagger-ui/index.html) | ✅ `Interactive UI` |
| **Database** | **MongoDB Atlas** | AWS `cluster0.plaz2ou.mongodb.net` (`food_delivery`) | ✅ `51 Restaurants Seeded` |

---

## 🔑 Demo Access & Role Accounts

All portals and role guards are accessible using the following pre-configured credentials:

| Role | Email | Password | Access Portal |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@fooddelivery.com` | `Admin@123` | `/admin` (KPIs, Surge, Fleet, Fraud) |
| **Restaurant Owner** | `owner@fooddelivery.com` | `Admin@123` | `/restaurant-owner` (Menu, Live Orders) |
| **Delivery Partner** | `driver@fooddelivery.com` | `Admin@123` | `/delivery` (GPS broadcasting, Order Accept) |
| **Customer** | *Self-register or use above* | *Any 8+ char* | `/customer` (Discovery, Cart, Tracking) |

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client Layer
        Customer[Customer Web Client]
        Driver[Delivery Partner Web Client]
        Admin[Operations & Admin Portal]
    end

    subgraph CDN & Edge
        Vercel[Vercel Global Edge Network]
    end

    subgraph Backend Micro-Monolith
        Render[Render Cloud Container :8082]
        Security[Spring Security + JWT HS512]
        Broker[STOMP WebSocket Broker /ws-tracker]
        Geo[Uber H3 Resolution 8 Spatial Engine]
        SurgeEngine[Dynamic Surge Pricing Engine]
        AssignEngine[Geospatial Driver Assignment]
    end

    subgraph Managed Cloud Data Layer
        Atlas[(MongoDB Atlas Cluster)]
        Redis[(Redis Cloud / Cache & Locks)]
    end

    Customer -->|HTTPS / WSS| Vercel
    Driver -->|HTTPS / WSS| Vercel
    Admin -->|HTTPS| Vercel

    Vercel -->|REST API| Render
    Render --> Security
    Security --> Broker
    Security --> Geo
    Security --> SurgeEngine
    Security --> AssignEngine

    Render -->|2dsphere Queries| Atlas
    Render -->|Distributed Locks & TTL| Redis
```

---

## 💻 Tech Stack

### Backend
| Component | Technology | Version |
| :--- | :--- | :--- |
| **Language** | Java (Eclipse Temurin / OpenJDK) | 21 LTS |
| **Framework** | Spring Boot | 3.2.4 |
| **Security** | Spring Security + JWT HS512 (Stateless) | 6.x |
| **Primary Database** | MongoDB Atlas (Spring Data MongoDB) | 7.0+ |
| **Geospatial Engine** | Uber H3 Resolution 8 (`com.uber:h3`) | 3.7.2 |
| **Cache & Locks** | Redis (Lettuce client with TLS support) | 7.x |
| **Real-time Messaging** | Spring WebSocket + STOMP (SockJS fallback) | 3.2.4 |
| **Build Tool** | Apache Maven | 3.9+ |
| **Container** | Docker Multi-stage (`eclipse-temurin:21-alpine`) | 24+ |
| **API Documentation** | Springdoc OpenAPI / Swagger UI | 2.3.0 |

### Frontend
| Component | Technology | Version |
| :--- | :--- | :--- |
| **Library** | React (SPA) | 18.3.1 |
| **Build Tool** | Vite (Rollup + esbuild) | 6.4.3 |
| **Routing** | React Router | 7.18.3 |
| **Styling** | Tailwind CSS | 4.3.3 |
| **State Management** | Zustand (Auth, Cart, Notifications, Location) | 5.0.15 |
| **Server State / Cache** | TanStack React Query | 5.102.8 |
| **Real-time Client** | `@stomp/stompjs` + `sockjs-client` | 7.3.0 / 1.6.1 |
| **Icons** | Lucide React | 1.46.0 |
| **Hosting** | Vercel Serverless Edge | Production |

---

## 🌟 Key Features

### 1. Customer Experience
- **Dynamic Location Selection**: Select your exact State, City, Village/Area or detect via GPS geolocation.
- **Strict Nearby Geofencing**: Queries only return restaurants operating within your chosen radius (default 10 km) using MongoDB `$nearSphere` geospatial queries.
- **HMAC Surge Pricing**: Dynamic surge pricing quotes signed with HMAC-SHA256, enforced with 120-second TTL countdown timers.
- **Cash on Delivery (COD) Checkout**: Production payment hardening strictly routes and confirms orders via verified Cash on Delivery.
- **Live Order Tracking**: Real-time STOMP WebSocket timeline from `ORDER_PLACED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY_FOR_PICKUP` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED`.
- **Instant In-App Notifications**: Push-style WebSocket notifications delivered directly to user queues.

### 2. Delivery Partner Portal
- **Online/Offline Availability Switch**: One-tap toggle broadcasting driver availability into H3 spatial supply pools.
- **Live GPS Broadcasting**: Periodic location updates mapped into Uber H3 Resolution 8 hexagons.
- **Order Dispatch & Acceptance**: Real-time broadcast of nearby orders with 60-second accept/reject timeout window.
- **Delivery Lifecycle**: Move order state to `OUT_FOR_DELIVERY` and complete with `DELIVERED`.

### 3. Restaurant Owner Portal
- **Menu Management**: Create, update, toggle availability, and categorize dishes.
- **Incoming Order Queue**: Real-time alerts on incoming customer orders.
- **Kitchen Flow Control**: Advance orders from `PENDING` $\rightarrow$ `PREPARING` $\rightarrow$ `READY_FOR_PICKUP`.
- **Automatic Driver Sweep**: Moving order to `READY_FOR_PICKUP` automatically sweeps nearby available drivers within 3 km $\rightarrow$ 5 km $\rightarrow$ 8 km.

### 4. Admin & Operations Intelligence
- **Real-Time KPIs**: Total orders, revenue, active fleet, online restaurants, and system diagnostics.
- **Surge Controls**: Inspect active H3 surge multipliers, apply zone overrides, or activate the emergency global killswitch.
- **Fraud Queue & Analytics**: Automated velocity checks, concurrent checkout mutex locks, and admin case approval/rejection.
- **System Health Diagnostics**: Live memory, MongoDB connection pool, Redis status, and JVM uptime statistics.

---

## 📦 Project Directory Layout

```text
INTELLIGENT-FOOD-DELIVERY-PLATFORM/
├── docker-compose.yml              # Local multi-service orchestration
├── README.md                       # This comprehensive documentation
├── DEPLOYMENT.md                   # Full production deployment guide
├── SECURITY_CHECKLIST.md           # Production security audit
│
├── food-delivery-backend/          # Spring Boot 3.2.4 Application
│   ├── Dockerfile                  # Multi-stage production container
│   ├── pom.xml                     # Maven project specification
│   ├── src/main/java/com/fooddelivery/
│   │   ├── admin/                  # Admin KPI & fraud dashboards
│   │   ├── auth/                   # JWT auth, user registration, AdminBootstrap
│   │   ├── common/                 # GlobalExceptionHandler, DTOs, HealthController
│   │   ├── config/                 # Security, CORS, WebSocket, MenuBootstrap
│   │   ├── delivery/               # Driver lifecycle, GPS & AssignmentEngine
│   │   ├── fraud/                  # Fraud detection & daily metrics
│   │   ├── notifications/          # WebSocket event dispatch & deduplication
│   │   ├── orders/                 # Order state machine & COD hardening
│   │   ├── recommendations/        # Affinity scoring & event attribution
│   │   ├── restaurants/            # Geospatial discovery & menu CRUD
│   │   ├── surge/                  # 4-stage Surge Pricing Engine & HMAC tokens
│   │   └── tracking/               # Order timeline & driver location history
│   └── src/main/resources/
│       └── application.yml         # Externalized environment configuration
│
└── food-delivery-frontend/         # React 18 + Vite 6 Application
    ├── vercel.json                 # Vercel SPA routing redirects
    ├── vite.config.js              # Vite bundler & Tailwind configuration
    ├── package.json                # Verified npm dependencies
    └── src/
        ├── api/                    # Centralized Axios client & API endpoints
        ├── components/             # Reusable UI, modals, location selector
        ├── layouts/                # Customer, Driver, and Admin layouts
        ├── pages/                  # Route views (Customer, Driver, Admin, Auth)
        ├── store/                  # Zustand stores (auth, cart, location, notification)
        └── websocket/              # Singleton STOMP/SockJS client
```

---

## ⚙️ Environment Variables Reference

### Backend (`food-delivery-backend`)
| Variable | Production Example | Description |
| :--- | :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/food_delivery` | MongoDB Atlas connection string |
| `REDIS_HOST` | `sweet-frog-1234.upstash.io` | Redis hostname (Upstash or local) |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | `<secure-redis-password>` | Redis auth password |
| `REDIS_SSL` | `true` | Enable TLS for cloud Redis |
| `JWT_SECRET` | `<64-byte-hex-string>` | HS512 secret for stateless authentication |
| `SURGE_TOKEN_SECRET` | `<32-byte-hex-string>` | HMAC-SHA256 surge quote signing key |
| `ADMIN_PASSWORD` | `Admin@123` | Password for bootstrap admin account |
| `CORS_ALLOWED_ORIGINS` | `https://*.vercel.app,http://localhost:5173` | Allowed frontend origins |
| `PORT` | `8082` | HTTP port dynamically bound by host |

### Frontend (`food-delivery-frontend`)
| Variable | Production Example | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://intellifood-smart-food-delivery-platform.onrender.com` | Base REST API URL |
| `VITE_WS_URL` | `wss://intellifood-smart-food-delivery-platform.onrender.com/ws-tracker` | Live STOMP WebSocket endpoint |

---

## 🚀 Running Locally

### 1. Prerequisites
- Java JDK 21+
- Apache Maven 3.9+
- Node.js 20+
- Local MongoDB (port 27017) or MongoDB Atlas URI
- Local Redis (port 6379)

### 2. Backend Startup
```powershell
cd food-delivery-backend
# Copy environment template if needed
copy .env.example .env
# Run with Spring Boot
mvn spring-boot:run
# Or run packaged JAR:
java -jar target/food-delivery-backend-0.0.1-SNAPSHOT.jar
```
Backend starts on: `http://localhost:8082`

### 3. Frontend Startup
```powershell
cd food-delivery-frontend
npm install
npm run dev
```
Frontend starts on: `http://localhost:5173`

---

## 🔒 Security & Data Integrity

- **Stateless Authentication**: JWT HS512 tokens with 24-hour expiration, no session state stored in RAM.
- **Password Protection**: BCrypt hashing with strength factor 10.
- **HMAC Surge Verification**: Quotes are tamper-proof and verified before orders are accepted.
- **Strict CORS**: Credentials and origin authorization mapped only to verified domains.
- **Zero Secrets in Git**: All sensitive credentials are provided through environment variables and secret stores.

---

## 📄 License & Attribution

Developed with ❤️ as part of the **IntelliFood Intelligent Food Delivery Ecosystem**.  
All rights reserved © 2026.

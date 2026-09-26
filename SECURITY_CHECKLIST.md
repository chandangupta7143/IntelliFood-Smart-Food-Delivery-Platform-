# IntelliFood — Security Checklist

**Project**: Intelligent Food Delivery Platform  
**Audit Date**: 2026-09-17  
**Status**: Phase 7 Release Engineering

---

## Secrets & Credentials

- [x] **JWT secret externalized** — `JWT_SECRET` environment variable (default is insecure dev-only placeholder)
- [x] **Surge HMAC secret externalized** — `SURGE_TOKEN_SECRET` environment variable
- [x] **Admin password externalized** — `ADMIN_PASSWORD` environment variable
- [x] **MongoDB URI externalized** — `MONGODB_URI` environment variable
- [x] **Redis password externalized** — `REDIS_PASSWORD` environment variable (empty by default for no-auth local)
- [x] **No production secrets in source code** — all defaults are development-only
- [x] **`.env` excluded from version control** — `.gitignore` lists `.env`
- [x] **`.env.example` has placeholder values only** — safe to commit

> ⚠️ **Production Action Required**: Replace all default values with cryptographically strong secrets before production deployment. Use `openssl rand -hex 64` to generate JWT_SECRET.

---

## Network & CORS

- [x] **CORS never uses wildcard** — explicit origin list only (no `*`)
- [x] **CORS production origins configurable** — via `CORS_ALLOWED_ORIGINS` environment variable (comma-separated)
- [x] **CORS default is dev-only** — `http://localhost:5173`, `http://localhost:4173`
- [ ] **HTTPS required in production** — TLS must be terminated at reverse proxy/load balancer; application does not enforce HTTPS
- [ ] **WebSocket must use `wss://` in production** — set `VITE_WS_URL=wss://your-domain/ws-tracker`

---

## Authorization (RBAC)

- [x] **Admin RBAC** — `hasRole("ADMIN")` enforced on all `/api/admin/**` endpoints
- [x] **Delivery partner endpoints restricted** — `hasAnyRole("DELIVERY_PARTNER", "ADMIN")` on `/api/delivery/**`
- [x] **Customer resource ownership** — order access verified against authenticated principal's userId
- [x] **WebSocket subscription authorization** — `StompChannelInterceptor` enforces per-topic ownership:
  - `/topic/orders/{orderId}` — only order owner, assigned driver, or admin
  - `/topic/restaurants/{restaurantId}` — only restaurant owner or admin
- [x] **Fraud case actions require admin identity** — Principal injected and verified

---

## Authentication

- [x] **JWT required on all protected endpoints** — Spring Security filter chain
- [x] **JWT validated on WebSocket CONNECT frame** — `StompChannelInterceptor.preSend()`
- [x] **Invalid/expired JWT returns HTTP 401** — `JwtAuthenticationEntryPoint`
- [x] **BCrypt password hashing** — `BCryptPasswordEncoder` (strength 10)
- [x] **Stateless session** — `SessionCreationPolicy.STATELESS` (no server-side session)

---

## Input Validation

- [x] **Jakarta Bean Validation on all request DTOs** — `@NotNull`, `@NotBlank`, `@Size`, `@Email`, `@DecimalMin`, `@DecimalMax`
- [x] **Coordinate range validation** — `deliveryLatitude` ∈ [-90, 90], `deliveryLongitude` ∈ [-180, 180]
- [x] **Fraud override reason minimum length** — `@Size(min=10)` on reason field
- [x] **Idempotency key enforced on order placement** — backend deduplicates via `idempotencyKey` with `@Indexed(unique=true)`
- [x] **`@Valid` on all controller request bodies** — validation errors return HTTP 400 with field-level messages

---

## Error Handling

- [x] **No stack traces in API error responses** — `GlobalExceptionHandler` catches all exceptions; only safe messages returned
- [x] **No internal exception class names exposed** — generic 500 response: `"An internal server error occurred. Please try again later."`
- [x] **Validation errors return field-level messages** — not stack traces
- [x] **Exception details logged server-side only** — `java.util.logging.Logger` for diagnostics

---

## HMAC Token Security

- [x] **Surge pricing quote tokens HMAC-SHA256 signed** — `HmacTokenService` using `SURGE_TOKEN_SECRET`
- [x] **Token TTL: 120 seconds** — `expiresAt` embedded in token payload
- [x] **Nonce-based replay attack prevention** — `token:used:{nonce}` stored in Redis
- [x] **`cartId` in token verified against authenticated user** — `cartId` must equal caller's `userId` at checkout
- [x] **Token payload: `userId:restaurantId:h3Index:multiplier:fee:expiresAt:nonce`** — signed as Base64URL + HMAC signature

---

## Infrastructure

- [x] **Docker backend runs as non-root user** — `spring:spring` user (addgroup/adduser in Dockerfile)
- [x] **Docker frontend served by Nginx** — no dev server in production image
- [x] **No dev dependencies in production backend Docker image** — multi-stage build discards build tooling
- [x] **Node not present in production frontend container** — only Nginx Alpine in runtime stage
- [ ] **MongoDB authentication** — should be enabled in production Atlas deployment (IP allowlist + DB user)
- [ ] **Redis authentication** — `REDIS_PASSWORD` should be set for production Redis instances
- [ ] **Log aggregation** — ELK stack, CloudWatch, or equivalent recommended for audit trail in production

---

## Logging Audit

- [x] **No JWT tokens logged** — authentication filter does not log token values
- [x] **No passwords logged** — BCrypt encoding only, never plaintext
- [x] **WebSocket debug logging disabled in production** — `import.meta.env.DEV` guard in `stompClient.js`
- [x] **Exception details server-side only** — removed `ex.printStackTrace()` from exception handler
- [x] **Order/correlation IDs logged** — orderId, userId in service-level logs for debugging

---

## Pre-Production Checklist

Before deploying to production, verify:

- [ ] `JWT_SECRET` set to 64+ random hex characters
- [ ] `SURGE_TOKEN_SECRET` set to 32+ random hex characters
- [ ] `ADMIN_PASSWORD` set to a strong password (12+ chars, mixed case, digits, symbols)
- [ ] `MONGODB_URI` pointing to production Atlas cluster with auth
- [ ] `REDIS_PASSWORD` set for production Redis
- [ ] `CORS_ALLOWED_ORIGINS` set to exact production frontend URL(s)
- [ ] TLS/HTTPS terminated at reverse proxy
- [ ] `VITE_WS_URL` using `wss://` scheme
- [ ] MongoDB Atlas IP allowlist configured
- [ ] Atlas Search index "default" created for fuzzy text search
- [ ] Firebase service account configured for FCM push (optional)
- [ ] Log aggregation pipeline configured
- [ ] Health checks verified: `/healthz`, `/api/admin/system/status`

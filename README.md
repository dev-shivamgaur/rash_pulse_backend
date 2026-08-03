# RashPulse Backend

<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-11-EA2845?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-ioredis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-AMQP-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**High-throughput flash-sale backend** built as a NestJS microservices monorepo — API Gateway, OTP auth, Redis inventory locks, RabbitMQ order pipeline, and payments.

[Architecture](#architecture) · [Services](#services) · [Getting Started](#getting-started) · [API Docs](#api-documentation) · [Scripts](#npm-scripts)

</div>

---

## Overview

RashPulse is designed for **flash-sale / high-concurrency checkout** scenarios where stock must stay consistent under heavy load.

Clients talk only to the **API Gateway**. Downstream services own their own PostgreSQL databases, share JWT verification via `libs/jwt-shared`, and coordinate through **Redis** (live stock, reservations, OTP) and **RabbitMQ** (async order & payment events).

```
Client / Swagger
       │
       ▼
┌──────────────────┐
│   API Gateway    │  :8000   proxies + flash-sale booking
│  /api/v1/*       │
└────────┬─────────┘
         │  HTTP proxy
    ┌────┼────┬─────────┬──────────┐
    ▼    ▼    ▼         ▼          ▼
  Auth Order Product Payment Notification
  :5001 :5002 :5003    :5004      :5005
    │      │     │        │
    └──────┴─────┴────────┘
         Redis + RabbitMQ + PostgreSQL (per service)
```

---

## Features

| Area | What it does |
|------|----------------|
| **Flash sale booking** | Gateway accepts book requests; Product service reserves stock in Redis with TTL locks and surge pricing |
| **Event-driven orders** | Reservation events publish over RabbitMQ; Order service consumes and persists orders |
| **OTP authentication** | Phone-number OTP login, device fingerprinting, httpOnly access/refresh cookies |
| **JWT + RBAC** | Shared JWT guards/roles (`user` / `admin`) across gateway and services |
| **Payments** | Initiate / verify flow with payment records in Prisma and payment events on RabbitMQ |
| **Unified Swagger** | Gateway hosts a multi-service docs UI; each service also exposes `/docs` and `/docs-json` |
| **Independent data stores** | Separate PostgreSQL databases per domain service |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime / Framework | Node.js 18+, NestJS 11 (monorepo via Nest CLI) |
| Language | TypeScript 5 |
| Databases | PostgreSQL + Prisma 7 (per-service schemas) |
| Cache / locks | Redis (`ioredis`) |
| Messaging | RabbitMQ (`amqplib` / `amqp-connection-manager`) |
| Auth | JWT (`@nestjs/jwt`, Passport), cookie-parser |
| Gateway | `http-proxy-middleware` reverse proxy |
| Docs | `@nestjs/swagger` + shared `@rash-pulse/swagger` lib |
| Load testing | `autocannon` (`load-test.js`) |
| Infra (local) | Docker Compose (RabbitMQ management) |

---

## Services

| Service | Default port | Gateway route | Responsibility |
|---------|--------------|---------------|----------------|
| **api-gateway** | `8000` | `/api/v1/flash-sale` | Entry point, proxying, flash-sale `book` |
| **auth-service** | `5001` | `/api/v1/auth` | OTP request/verify, refresh tokens, users |
| **order-service** | `5002` | `/api/v1/orders` | Order persistence, status, details |
| **product-service** | `5003` | `/api/v1/products` | Flash-sale start, live stock/price in Redis |
| **payment-service** | `5004` | `/api/v1/payments` | Payment initiate / verify / records |
| **notification-service** | `5005` | `/api/v1/notifications` | Notifications (scaffold) |

### Shared libraries

| Library | Path | Purpose |
|---------|------|---------|
| `@rash-pulse/swagger` | `libs/swagger` | Microservice + gateway Swagger helpers |
| `jwt-shared` | `libs/jwt-shared` | JWT strategy, guards, roles, decorators |

---

## Flash-sale flow (happy path)

1. **Admin** starts a sale → `POST /api/v1/products/products/start` (JWT + `admin` role) — Product service loads stock/price into Redis.
2. **User** books → `POST /api/v1/flash-sale/book` on the gateway (JWT) — reservation token + stock lock in Redis.
3. Product service publishes `reservation_created` on the flash-sale RabbitMQ exchange.
4. **Order service** consumes the event, creates an order (`PENDING_PAYMENT`), tracks reservation / queue IDs.
5. **User** pays → Payment service `initiate` / `verify`; payment success/failure events update order state (including refunds).

---

## Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 9
- **PostgreSQL** ≥ 14 (local or remote) — create databases such as:
  - `rashpulse_auth`
  - `rashpulse_orders`
  - `rashpulse_products`
  - `rashpulse_payments`
- **Redis** ≥ 6 (`redis://localhost:6379`)
- **RabbitMQ** ≥ 3 (or use Docker Compose below)
- **Docker** + **Docker Compose** (recommended for RabbitMQ)

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/dev-shivamgaur/rash_pulse_backend.git
cd rash_pulse_backend
npm install
```

### 2. Start RabbitMQ

```bash
docker compose up -d
```

- AMQP: `amqp://localhost:5672`
- Management UI: [http://localhost:15672](http://localhost:15672) (default guest/guest)

Ensure **Redis** and **PostgreSQL** are running on your machine (or point env vars to remote instances).

### 3. Configure environment

Each app has its own `.env` under `apps/<service>/`. Copy from `.env.example` where available and set at least:

**Root (JWT secrets used across services):**

```env
JWT_ACCESS_SECRET=change-me-access
JWT_REFRESH_SECRET=change-me-refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
```

**Per service (examples):**

```env
# apps/api-gateway/.env
PORT=8000
AUTH_SERVICE_URL=http://localhost:5001
ORDER_SERVICE_URL=http://localhost:5002
PRODUCT_SERVICE_URL=http://localhost:5003
PAYMENT_SERVICE_URL=http://localhost:5004
NOTIFICATION_SERVICE_URL=http://localhost:5005
REDIS_URL=redis://localhost:6379
SWAGGER_ENABLED=true

# apps/auth-service/.env
PORT=5001
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/rashpulse_auth?schema=public
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:8000

# apps/order-service/.env
PORT=5002
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/rashpulse_orders?schema=public
REDIS_URL=redis://localhost:6379

# apps/product-service/.env
PORT=5003
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/rashpulse_products?schema=public
REDIS_URL=redis://localhost:6379

# apps/payment-service/.env
PORT=5004
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/rashpulse_payments?schema=public
REDIS_URL=redis://localhost:6379

# apps/notification-service/.env
PORT=5005
CORS_ORIGIN=http://localhost:8000
```

> Never commit real secrets. Keep production secrets in a vault / CI secrets store.

### 4. Database migrations

From each Prisma-backed service directory (or with the correct schema path):

```bash
# Auth
npx prisma migrate dev --schema=apps/auth-service/prisma/schema.prisma

# Products
npx prisma migrate dev --schema=apps/product-service/prisma/schema.prisma

# Orders
npx prisma migrate dev --schema=apps/order-service/prisma/schema.prisma

# Payments
npx prisma migrate dev --schema=apps/payment-service/prisma/schema.prisma
```

Generate clients if needed after schema changes (each service uses `generated/prisma` output).

### 5. Run services

**All services (recommended for local full stack):**

```bash
npm run start:all
```

**Individually:**

```bash
npm run start:gateway
npm run start:auth
npm run start:order
npm run start:product
npm run start:payment
npm run start:notification
```

**Gateway only (default `start:dev`):**

```bash
npm run start:dev
```

Once up:

| Resource | URL |
|----------|-----|
| API Gateway | http://localhost:8000 |
| Unified Swagger | http://localhost:8000/api/v1/docs |
| Auth (direct) | http://localhost:5001/docs |
| Orders (direct) | http://localhost:5002/docs |
| Products (direct) | http://localhost:5003/docs |
| Payments (direct) | http://localhost:5004/docs |
| Notifications (direct) | http://localhost:5005/docs |

---

## API Documentation

### Gateway (recommended)

Open **[http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)** and pick a service from the dropdown. “Try it out” requests go through the gateway prefixes.

### Key endpoints (via gateway)

#### Auth — `/api/v1/auth`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/request-otp` | Send OTP to phone number |
| `POST` | `/verify-otp` | Verify OTP; sets `accessToken` / `refreshToken` cookies |
| `POST` | `/refresh` | Issue new access token from refresh cookie |
| `GET` | `/allusers` | List users (protected / role-gated) |

#### Flash sale — `/api/v1/flash-sale`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Gateway health |
| `POST` | `/book` | Book flash-sale item (JWT) |

#### Products — `/api/v1/products`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/products/health` | Health check |
| `POST` | `/products/start` | Admin: start flash sale (JWT + admin) |
| `GET` | `/products/sale-info/:prid` | Live Redis price/stock (JWT + admin) |

#### Orders — `/api/v1/orders`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/status/:trackingId` | Order status by tracking/queue id (JWT) |
| `GET` | `/get-order/:id` | Order details for current user (JWT) |

#### Payments — `/api/v1/payments`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/initiate` | Start payment for an order (JWT) |
| `POST` | `/verify` | Verify payment (JWT) |
| `POST` | `/create` | Create payment record (utility / dummy entry) |

Exact request bodies are documented in Swagger DTOs.

---

## Project Structure

```
rash-pulse-backend/
├── apps/
│   ├── api-gateway/          # Reverse proxy + flash-sale book API
│   ├── auth-service/         # OTP auth, devices, refresh tokens (Prisma)
│   ├── order-service/        # Orders + RabbitMQ consumers (Prisma)
│   ├── product-service/      # Catalog + Redis flash-sale inventory (Prisma)
│   ├── payment-service/      # Payments + payment events (Prisma)
│   └── notification-service/ # Notification service
├── libs/
│   ├── swagger/              # Shared Swagger setup (@rash-pulse/swagger)
│   └── jwt-shared/           # Shared JWT module, guards, roles
├── docker-compose.yml        # RabbitMQ (+ management UI)
├── load-test.js              # Autocannon load test for /flash-sale/book
├── nest-cli.json             # Monorepo project definitions
├── webpack.config.js
└── package.json
```

---

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run start:all` | Watch-mode all six apps via `concurrently` |
| `npm run start:gateway` | API Gateway (watch) |
| `npm run start:auth` | Auth service (watch) |
| `npm run start:order` | Order service (watch) |
| `npm run start:product` | Product service (watch) |
| `npm run start:payment` | Payment service (watch) |
| `npm run start:notification` | Notification service (watch) |
| `npm run start:dev` | Gateway only (watch) |
| `npm run build` | Build all applications |
| `npm run start:prod` | Run built gateway |
| `npm run start:prod:*` | Run built auth / product / order / payment / notification |
| `npm run lint` | ESLint with auto-fix |
| `npm run format` | Prettier on `apps/**` and `libs/**` |
| `npm run test` | Jest unit tests |
| `npm run test:cov` | Coverage report |

Production entry examples:

```bash
npm run build
npm run start:prod
npm run start:prod:auth
# ...
```

---

## Load Testing

`load-test.js` hammers the flash-sale book endpoint with **autocannon** (high concurrency).

```bash
node load-test.js
```

Adjust `url`, `connections`, `duration`, and body `productId` in `load-test.js` to match a live sale you started via Product service.

> Auth is required in normal flow; configure headers/cookies in the script if you load-test a protected route.

---

## Architecture notes

- **Database-per-service** — Auth, Products, Orders, and Payments each have their own Prisma schema and `DATABASE_URL`.
- **Redis** — Live stock counters, reservation locks (`NX` + TTL), surge price keys, OTP storage.
- **RabbitMQ** — Flash-sale exchange / `reservation_created` routing; payment success/failure publishing for order updates.
- **Gateway proxy** — Strips `/api/v1/<service>` and forwards to the internal service URL; also proxies `/docs-json` for aggregated Swagger.
- **Cookies** — Access + refresh tokens set as httpOnly cookies on OTP verify; CORS uses credentials against the gateway origin.

---

## Security checklist

- [ ] Rotate `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` for every environment
- [ ] Use strong DB passwords; never commit `.env`
- [ ] Enable HTTPS and `secure` cookies in production
- [ ] Restrict `CORS_ORIGIN` to real frontend origins
- [ ] Protect RabbitMQ and Redis with auth in non-local environments
- [ ] Keep flash-sale admin endpoints behind `admin` role only

---

## Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| `ECONNREFUSED` on Postgres | Check `DATABASE_URL` and that the DB exists |
| Redis connection errors | Start Redis; verify `REDIS_URL` |
| RabbitMQ connection errors | `docker compose up -d`; verify `amqp://localhost:5672` |
| Gateway 502 / proxy errors | Start the target microservice; match ports in gateway `.env` |
| Swagger empty for a service | Ensure that service is running and `SWAGGER_ENABLED=true` |
| Port already in use | Change `PORT` in the service `.env` or free the port |

---

## Contributing

1. Create a feature branch from `main`
2. Keep changes scoped to the relevant service / shared lib
3. Run `npm run lint` and relevant tests before opening a PR
4. Document new env vars and endpoints in this README / Swagger

---

## License

Private / **UNLICENSED** (see `package.json`). Contact the maintainer for usage rights.

---

## Author

**Shivam Gaur** — [GitHub](https://github.com/dev-shivamgaur)

Issues: [github.com/dev-shivamgaur/rash_pulse_backend/issues](https://github.com/dev-shivamgaur/rash_pulse_backend/issues)

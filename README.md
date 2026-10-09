# TicketRush 🎟️⚡

> A high-concurrency, distributed ticket booking engine engineered to handle massive traffic spikes and prevent double-booking using pessimistic locking and in-memory rate limiting.

## 📖 Overview

TicketRush is a robust backend system designed for the ticketing industry. When highly anticipated events go on sale, thousands of users attempt to purchase the same seat simultaneously. This project solves the resulting race conditions and database bottlenecks by offloading rate limiting to Redis and delegating concurrency control to PostgreSQL via row-level locks.

## 🎯 Problem Solved

Traditional CRUD applications handle ticket sales by querying capacity and updating a counter. Under heavy load (e.g., 10,000 req/sec), this leads to **race conditions** and **double-booking** (overselling). TicketRush solves this by pre-generating ticket rows and leveraging `SELECT ... FOR UPDATE SKIP LOCKED` to serialize concurrent requests without deadlocks.

## 🛠️ Tech Stack
- Domain: Node.js, TypeScript, Clean Architecture, Domain-Driven Design (DDD).

- Database: PostgreSQL (Driver pg).

- Caching / Rate Limiting: Redis.

- Security: JWT, Zod (Input Validation), Helmet.

- Observability: Pino (Structured Logging), Prometheus (Metrics).

- DevOps: Docker, Docker Compose (Multi-stage builds), GitHub Actions.

## 🏗️ Architecture

```
                    ┌───────────────┐
                    │    Client     │
                    └───────┬───────┘
                            │ (JWT Auth & DTO Validation)
                     ┌──────▼──────┐
                     │ API Gateway │ (Express.js)
                     └──────┬──────┘
                            │
             ┌──────────────┼──────────────┐
             │                             │
      ┌──────▼──────┐               ┌──────▼───────┐
      │ PostgreSQL  │               │    Redis     │
      │ (ACID DB)   │               │ (In-Memory)  │
      └─────────────┘               └──────────────┘
    - Pessimistic Locks           - Distributed Rate Limiter
    - Row-level isolation         - Session/Health State
```

## 🚀 Local Development
```
# 1. Clone the repository
git clone https://github.com/cdgonzalez/TicketRush.git
cd ticketrush-booking-engine

# 2. Setup environment variables
cp .env.example .env

# 3. Start infrastructure (PostgreSQL & Redis) and API
docker-compose up -d

# 4. Run database migrations (Available via npm script)
npm run db:migrate
```

## 📜 License
MIT License

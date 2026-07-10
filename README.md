# RashPulse Backend API

<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-EA2845?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

A modern, scalable healthcare backend API built with **NestJS**, featuring enterprise-grade architecture, secure authentication, caching, message queuing, and microservices support.

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [API Documentation](#api-documentation) • [Architecture](#architecture)

</div>

---

## Overview

RashPulse is a modern healthcare backend API designed to provide secure, scalable, and reliable services for healthcare applications. Built with industry best practices, it leverages cutting-edge technologies to ensure performance, security, and maintainability.

The project utilizes a **monorepo structure** to organize multiple microservices and shared libraries, making it easy to scale and maintain as the healthcare system grows.

---

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based Authentication** - Secure token-based user authentication
- **Role-Based Access Control (RBAC)** - Fine-grained permission management
- **Secure Password Hashing** - Industry-standard bcrypt encryption
- **Token Refresh Mechanism** - Automatic token renewal for improved security
- **OAuth 2.0 Ready** - Architecture supports third-party authentication providers

### ⚡ Performance & Caching
- **Redis Caching** - In-memory data caching for lightning-fast responses
- **Cache Invalidation Strategies** - Automatic cache management
- **Rate Limiting** - Protect APIs from abuse
- **Query Optimization** - Efficient database queries with Prisma

### 📨 Message Queuing & Async Processing
- **RabbitMQ Integration** - Robust message broker for asynchronous operations
- **Event-Driven Architecture** - Publish-subscribe pattern support
- **Background Job Processing** - Handle long-running tasks asynchronously
- **Message Retry Logic** - Ensure reliable message delivery
- **Dead Letter Queues** - Handle failed messages gracefully

### 🏗️ Microservices Architecture
- **Monorepo Structure** - Organize multiple services in a single repository
- **Shared Libraries** - Reusable code across microservices
- **Inter-Service Communication** - RabbitMQ-based service-to-service messaging
- **Independent Scaling** - Each microservice can scale independently
- **Service Discovery Ready** - Architecture supports service discovery patterns

### 📊 Data Management
- **Prisma ORM** - Type-safe database access with auto-generated types
- **Database Migrations** - Version-controlled schema changes
- **Seeding Support** - Initialize database with sample data
- **Multi-Database Support** - Works with PostgreSQL, MySQL, and other databases
- **Transaction Support** - ACID compliance for critical operations

### 🧪 Testing & Quality
- **Unit Testing** - Comprehensive test coverage with Jest
- **E2E Testing** - End-to-end testing framework
- **Test Coverage Reports** - Monitor code coverage metrics
- **Load Testing** - Performance testing with built-in load test scripts

### 📝 API Documentation
- **Swagger/OpenAPI Integration** - Auto-generated API documentation
- **API Endpoints Catalog** - Discover and explore all available endpoints
- **Request/Response Examples** - Clear examples for each endpoint
- **Reusable Swagger Configuration** - Centralized documentation setup

### 🔧 Developer Experience
- **Hot Module Reloading** - Instant code reload during development
- **ESLint Configuration** - Code quality and style enforcement
- **Prettier Integration** - Automatic code formatting
- **TypeScript Support** - Full type safety across the codebase
- **Monorepo Tooling** - Nx or similar monorepo management tools

### 🚀 Deployment & DevOps
- **Docker Support** - Container-based deployment
- **Docker Compose** - Multi-container orchestration for local development
- **Environment Configuration** - Flexible configuration management
- **Production-Ready** - Optimized builds for production deployment
- **Health Checks** - Service health monitoring endpoints

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | NestJS 10+ |
| **Language** | TypeScript 5+ |
| **Database** | PostgreSQL / MySQL (Prisma ORM) |
| **Caching** | Redis |
| **Message Broker** | RabbitMQ |
| **Authentication** | JWT (jsonwebtoken) |
| **API Documentation** | Swagger/OpenAPI |
| **Testing** | Jest, Supertest |
| **Code Quality** | ESLint, Prettier |
| **Containerization** | Docker & Docker Compose |
| **Package Manager** | npm |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **Docker** v20.10+ (for containerized development)
- **Docker Compose** v2.0+ (optional, for multi-container setup)
- **PostgreSQL** v12+ or **MySQL** v8+ (if not using Docker)
- **Redis** v6+ (if not using Docker)
- **RabbitMQ** v3.8+ (if not using Docker)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/dev-shivamgaur/rash_pulse_backend.git
cd rash_pulse_backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
APP_PORT=3000
APP_HOST=localhost

# Database
DATABASE_URL=
# Or for MySQL:
# DATABASE_URL=

# Redis
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_URL=

# JWT
JWT_SECRET=
JWT_EXPIRATION=

# CORS
CORS_ORIGIN=h

# Log Level
LOG_LEVEL=
```

### 4. Database Setup

#### Option A: Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- RabbitMQ message broker

#### Option B: Manual Setup

If you prefer to set up services manually, install PostgreSQL, Redis, and RabbitMQ on your system.

### 5. Initialize Database

Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

Seed the database with sample data:

```bash
npm run seed
```

### 6. Start the Application

#### Development Mode (with hot reload)

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

#### Production Mode

```bash
npm run build
npm run start:prod
```

#### Watch Mode (rebuild on file changes)

```bash
npm run start
```

---

## 📚 API Documentation

### Swagger Documentation

Once the application is running, access the Swagger UI at:

```
http://localhost:3000/api/docs
```

### API Endpoints Overview

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

#### User Management
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account

#### Healthcare Services (Example)
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments/:id` - Get appointment details
- `PATCH /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

#### Health Monitoring
- `GET /api/health` - Service health check
- `GET /api/health/database` - Database connection status
- `GET /api/health/redis` - Redis connection status

---

## 🧪 Testing

### Run Unit Tests

```bash
npm run test
```

### Run E2E Tests

```bash
npm run test:e2e
```

### Generate Test Coverage Report

```bash
npm run test:cov
```

Coverage report will be available in `coverage/` directory.

---

## 📊 Load Testing

RashPulse includes a built-in load testing script to evaluate API performance.

### Run Load Test

```bash
npm run load-test
```

Or manually:

```bash
node load-test.js
```

The load test will:
- Make concurrent requests to specified endpoints
- Measure response times
- Generate performance metrics
- Report any errors or bottlenecks

### Configure Load Test

Edit `load-test.js` to customize:
- Number of concurrent users
- Request duration
- Endpoint URLs
- Request payloads

---

## 🏗️ Project Structure

```
rash_pulse_backend/
├── apps/                           # Microservices
│   ├── api-gateway/               # API Gateway service
│   ├── auth-service/              # User management service
│   ├── order-service/             # Order Service management
│   └── product-service/           # Product  service
│
├── libs/                           # Shared libraries
│   ├── swagger/                   # Swagger configuration
│   ├── common/                    # Common utilities
│   └── database/                  # Database configuration
│
├── prisma/                        # Prisma ORM
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Database migrations
│
├── src/                          # Main application
│   ├── modules/                  # Feature modules
│   ├── guards/                   # Route guards
│   ├── interceptors/             # Request/response interceptors
│   ├── filters/                  # Exception filters
│   ├── pipes/                    # Data transformation pipes
│   └── main.ts                   # Application entry point
│
├── test/                         # Test files
│   ├── unit/                    # Unit tests
│   └── e2e/                     # End-to-end tests
│
├── docker-compose.yml           # Docker Compose configuration
├── .env.example                 # Environment variables template
├── package.json                 # Project dependencies
├── tsconfig.json               # TypeScript configuration
├── eslint.config.mjs           # ESLint configuration
├── webpack.config.js           # Webpack configuration
└── README.md                   # This file
```

---

## 🔄 Workflow & Best Practices

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Write Code & Tests**
   - Implement feature in relevant module
   - Write unit tests
   - Ensure code passes linting

3. **Format & Lint**
   ```bash
   npm run lint
   npm run format
   ```

4. **Run Tests Locally**
   ```bash
   npm run test
   ```

5. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

### Code Quality Standards

- **Type Safety**: Always use TypeScript types
- **Error Handling**: Implement proper exception handling
- **Documentation**: Add JSDoc comments for complex functions
- **Testing**: Aim for >80% code coverage
- **Security**: Follow OWASP guidelines

---

## 🔒 Security Best Practices

### Implemented Security Measures

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Prevent brute force attacks
- **CORS Configuration** - Controlled cross-origin access
- **Environment Variables** - Sensitive data in .env
- **SQL Injection Prevention** - Prisma ORM parameterized queries
- **XSS Protection** - Helmet.js middleware

### Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Enable HTTPS in production
- [ ] Configure CORS for production domains
- [ ] Use strong database passwords
- [ ] Enable Redis password authentication
- [ ] Configure RabbitMQ security
- [ ] Regular security audits
- [ ] Keep dependencies updated

---

## 📦 Docker Deployment

### Build Docker Image

```bash
docker build -t rash-pulse-backend:latest .
```

### Run with Docker Compose

```bash
docker-compose up -d
```

### View Logs

```bash
docker-compose logs -f api
```

### Stop Services

```bash
docker-compose down
```

---

## 🐛 Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED
```

**Solution**: Ensure PostgreSQL/MySQL is running and DATABASE_URL is correct.

### Redis Connection Error

```
Error: Redis connection refused
```

**Solution**: Start Redis or update REDIS_HOST and REDIS_PORT.

### RabbitMQ Connection Error

```
Error: connect ECONNREFUSED on amqp://
```

**Solution**: Start RabbitMQ or update RABBITMQ_URL.

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Clear Node Modules Cache

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 📈 Performance Optimization

### Tips for Better Performance

1. **Redis Caching**
   - Cache frequently accessed data
   - Set appropriate TTL values
   - Monitor cache hit rates

2. **Database Optimization**
   - Create indexes on frequently queried columns
   - Use pagination for large datasets
   - Optimize N+1 queries

3. **Async Processing**
   - Use RabbitMQ for heavy operations
   - Process emails/notifications asynchronously
   - Implement background job scheduling

4. **API Rate Limiting**
   - Protect endpoints from abuse
   - Implement per-user limits
   - Use tiered rate limiting

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the Repository**
2. **Create a Feature Branch** (`git checkout -b feature/amazing-feature`)
3. **Commit Changes** (`git commit -m 'Add amazing feature'`)
4. **Push to Branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow the code style defined by ESLint
- Write tests for new features
- Update documentation
- Ensure all tests pass
- Get code reviewed

---

## 📋 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

For support, documentation, and inquiries:

- **Issues** - [GitHub Issues](https://github.com/dev-shivamgaur/rash_pulse_backend/issues)
- **Discussions** - [GitHub Discussions](https://github.com/dev-shivamgaur/rash_pulse_backend/discussions)

---

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-gen ORM
- [Redis](https://redis.io/) - In-memory data store
- [RabbitMQ](https://www.rabbitmq.com/) - Message broker
- [Docker](https://www.docker.com/) - Containerization platform

---

<div align="center">

**Made with ❤️ by Shivam Gaur**

⭐ If this project helps you, please consider giving it a star! ⭐

</div>
# Deployment Guide

This document provides instructions for deploying the AI Insurance Platform.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL 15+ (if not using Docker)
- Node.js 18+ (for local development)
- OpenAI API key

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://insurance_user:insurance_password@postgres:5432/insurance_platform"

# OpenAI
OPENAI_API_KEY="your-openai-api-key-here"

# JWT Secrets (Change these in production!)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"

# API Configuration
PORT=4000
NODE_ENV="production"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

## Docker Deployment (Recommended)

### 1. Build and Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 2. Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **API Health Check**: http://localhost:4000/api/health
- **PostgreSQL**: localhost:5432

### 3. Stop Services

```bash
docker-compose down

# Stop and remove volumes (caution: deletes data)
docker-compose down -v
```

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

```bash
# Generate Prisma Client
cd packages/database
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 3. Start Development Servers

```bash
# Start all services in development mode
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- API: http://localhost:4000

### 4. Database Management

```bash
# Open Prisma Studio
make db-studio

# Create a new migration
cd packages/database
npx prisma migrate dev --name migration_name

# Reset database (caution: deletes all data)
npx prisma migrate reset
```

## Production Deployment

### Using Docker Compose (Production)

1. Update environment variables in `.env`
2. Build production images:

```bash
docker-compose build
```

3. Start services:

```bash
docker-compose up -d
```

### Manual Deployment

#### Backend API

```bash
cd apps/api

# Install dependencies
npm ci

# Generate Prisma Client
cd ../../packages/database
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build
cd ../../apps/api
npm run build

# Start
npm start
```

#### Frontend

```bash
cd apps/web

# Install dependencies
npm ci

# Build
npm run build

# Start
npm start
```

## Database Migrations

### Creating a Migration

```bash
cd packages/database
npx prisma migrate dev --name your_migration_name
```

### Applying Migrations in Production

```bash
cd packages/database
npx prisma migrate deploy
```

## Scaling Considerations

### Horizontal Scaling

The API is stateless and can be scaled horizontally:

```bash
docker-compose up -d --scale api=3
```

### Database Scaling

For production:
- Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
- Enable connection pooling
- Configure read replicas for read-heavy workloads

### Caching

Consider adding Redis for:
- Session storage
- API response caching
- Rate limiting
- Job queues

## Monitoring

### Health Checks

- API Health: `GET /api/health`
- Database: Check PostgreSQL connection
- Monitor Docker container health

### Logging

Application logs are available via:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f web
```

### Metrics

Consider integrating:
- Application Performance Monitoring (APM): New Relic, Datadog
- Error Tracking: Sentry
- Analytics: Google Analytics, Mixpanel

## Security Checklist

- [ ] Change default JWT secrets
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database backups
- [ ] Implement log rotation
- [ ] Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- [ ] Enable firewall rules
- [ ] Regular security updates

## Backup and Recovery

### Database Backup

```bash
# Backup
docker exec insurance-db pg_dump -U insurance_user insurance_platform > backup.sql

# Restore
docker exec -i insurance-db psql -U insurance_user insurance_platform < backup.sql
```

### Automated Backups

Set up cron jobs or use cloud provider backup solutions:

```bash
# Example cron job (daily at 2 AM)
0 2 * * * docker exec insurance-db pg_dump -U insurance_user insurance_platform > /backups/insurance_$(date +\%Y\%m\%d).sql
```

## Troubleshooting

### Container Issues

```bash
# View logs
docker-compose logs -f [service_name]

# Restart a service
docker-compose restart [service_name]

# Rebuild a service
docker-compose up -d --build [service_name]
```

### Database Connection Issues

```bash
# Check if database is running
docker-compose ps postgres

# Test connection
docker exec -it insurance-db psql -U insurance_user -d insurance_platform
```

### API Issues

```bash
# Check API health
curl http://localhost:4000/api/health

# View API logs
docker-compose logs -f api
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review environment variables
3. Ensure all services are running: `docker-compose ps`
4. Check database connectivity
5. Verify OpenAI API key is valid

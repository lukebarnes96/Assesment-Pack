# Docker Deployment - Quick Start Guide

## 🚀 One-Command Deployment

```bash
./deploy.sh
```

That's it! The script will:
- ✅ Check Docker installation
- ✅ Validate environment configuration
- ✅ Build Docker images
- ✅ Start all services
- ✅ Run database migrations

---

## 📋 Prerequisites

1. **Docker Desktop** installed
   - Download from: https://docs.docker.com/get-docker/
   - Ensure Docker is running

2. **OpenAI API Key**
   - Get from: https://platform.openai.com/api-keys
   - Already configured in `.env` file

---

## 🎯 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Assesment-Pack
git checkout claude/ai-insurance-platform-01PjYREiVC8DdPan4ZqoCRcT
```

### 2. Deploy

```bash
./deploy.sh
```

### 3. Access the Platform

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Database**: localhost:5432

### 4. Create Your Account

1. Go to http://localhost:3000
2. Click "Register"
3. Fill in your details
4. Start using the platform!

---

## 🛠️ Management Scripts

All scripts are in the `scripts/` directory:

### View Logs
```bash
./scripts/logs.sh          # All services
./scripts/logs.sh api      # API only
./scripts/logs.sh web      # Frontend only
./scripts/logs.sh postgres # Database only
```

### Check Status
```bash
./scripts/status.sh
```

### Restart Services
```bash
./scripts/restart.sh
```

### Stop Services
```bash
./scripts/stop.sh
```

### Backup Database
```bash
./scripts/backup-db.sh
```

### Clean Everything (⚠️ Deletes all data!)
```bash
./scripts/clean.sh
```

---

## 📦 What's Running?

The Docker setup includes 3 containers:

### 1. **PostgreSQL Database** (`postgres`)
- Port: 5432
- Database: `insurance_platform`
- User: `insurance_user`
- Persistent volume for data

### 2. **Backend API** (`api`)
- Port: 4000
- Express.js + TypeScript
- All AI services integrated
- Automatic migrations on startup

### 3. **Frontend Web** (`web`)
- Port: 3000
- Next.js 14 + TypeScript
- Responsive dashboard
- Real-time API integration

---

## 🔍 Troubleshooting

### Services Not Starting

```bash
# Check Docker is running
docker --version

# View logs for errors
./scripts/logs.sh

# Check service status
./scripts/status.sh
```

### Port Already in Use

If ports 3000, 4000, or 5432 are already in use:

1. Stop the conflicting service, or
2. Edit `docker-compose.yml` to use different ports:
   ```yaml
   ports:
     - '3001:3000'  # Change host port
   ```

### Database Connection Issues

```bash
# Check if database is running
docker compose exec postgres pg_isready

# View database logs
./scripts/logs.sh postgres

# Restart services
./scripts/restart.sh
```

### API Not Responding

```bash
# Check API health
curl http://localhost:4000/api/health

# View API logs
./scripts/logs.sh api

# Check environment variables
docker compose exec api env | grep -E 'DATABASE_URL|OPENAI_API_KEY'
```

---

## 🔐 Security Notes

### Production Deployment

Before deploying to production, update `.env`:

```bash
# Generate strong secrets
JWT_SECRET="$(openssl rand -base64 32)"
JWT_REFRESH_SECRET="$(openssl rand -base64 32)"

# Use production database
DATABASE_URL="postgresql://user:password@your-db-host:5432/db"

# Set production mode
NODE_ENV="production"
```

### Backup Your Data

Regular backups are crucial:

```bash
# Manual backup
./scripts/backup-db.sh

# Setup automated backups (cron job)
0 2 * * * /path/to/Assesment-Pack/scripts/backup-db.sh
```

---

## 📊 Monitoring

### View Real-Time Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
```

### Check Resource Usage

```bash
docker stats
```

### Database Access

```bash
# Connect to database
docker compose exec postgres psql -U insurance_user -d insurance_platform

# Run SQL query
docker compose exec postgres psql -U insurance_user -d insurance_platform -c "SELECT COUNT(*) FROM \"User\";"
```

---

## 🚀 Scaling

### Scale API Servers

```bash
docker compose up -d --scale api=3
```

### Use Production Database

Update `.env`:
```bash
DATABASE_URL="postgresql://user:pass@production-db:5432/db"
```

Then redeploy:
```bash
docker compose up -d
```

---

## 🧪 Testing

### Test API Endpoints

```bash
# Health check
curl http://localhost:4000/api/health

# Register user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **API Documentation**: See `API.md`
- **Feature Guide**: See `FEATURES.md`
- **Deployment Guide**: See `DEPLOYMENT.md`

---

## 💡 Tips

1. **First Time Setup**: Run `./deploy.sh` - it handles everything
2. **View Logs**: Use `./scripts/logs.sh` to debug issues
3. **Regular Backups**: Run `./scripts/backup-db.sh` periodically
4. **Clean Restart**: Use `./scripts/clean.sh` then `./deploy.sh` for fresh start
5. **Production**: Use managed database services (AWS RDS, etc.)

---

## 🎉 Success!

Once deployed, your AI Insurance Platform is ready to use:

✅ Full authentication system
✅ AI-powered risk assessment
✅ Smart policy recommendations
✅ Claims processing with fraud detection
✅ Document intelligence
✅ Conversational AI chatbot
✅ Complete insurance operations

**Start exploring at:** http://localhost:3000

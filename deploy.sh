#!/bin/bash

# AI Insurance Platform - Docker Deployment Script
# This script will deploy the entire platform using Docker

set -e

echo "🚀 AI Insurance Platform - Docker Deployment"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not available${NC}"
    echo "Please install Docker Compose or update Docker to latest version"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env and add your OPENAI_API_KEY${NC}"
    echo ""
    read -p "Press enter to continue after updating .env file..."
fi

# Validate OpenAI API key is set
if grep -q "your-openai-api-key-here" .env; then
    echo -e "${RED}❌ Please set your OPENAI_API_KEY in .env file${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose down 2>/dev/null || true
echo ""

# Build and start services
echo "🏗️  Building Docker images..."
docker compose build

echo ""
echo "🚀 Starting services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "Access your platform at:"
echo -e "${GREEN}  Frontend:${NC} http://localhost:3000"
echo -e "${GREEN}  API:${NC}      http://localhost:4000"
echo -e "${GREEN}  Database:${NC} localhost:5432"
echo ""
echo "📝 View logs with: docker compose logs -f"
echo "🛑 Stop services with: docker compose down"
echo ""
echo "🔐 Default Login (after registration):"
echo "   Create your account at: http://localhost:3000/register"
echo ""

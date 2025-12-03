#!/bin/bash
# Restart all services

echo "🔄 Restarting all services..."
docker compose restart

echo "✅ Services restarted"
docker compose ps

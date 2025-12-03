#!/bin/bash
# Clean up all Docker resources (WARNING: This will delete all data!)

echo "⚠️  WARNING: This will stop all services and remove all data!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo "🧹 Cleaning up Docker resources..."
docker compose down -v --remove-orphans

echo "✅ Cleanup complete"

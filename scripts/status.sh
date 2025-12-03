#!/bin/bash
# Check status of all services

echo "📊 Service Status:"
echo ""
docker compose ps

echo ""
echo "🔍 Health Checks:"
echo ""

# Check API health
echo -n "API: "
if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Not responding"
fi

# Check Web
echo -n "Frontend: "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Not responding"
fi

# Check Database
echo -n "Database: "
if docker compose exec -T postgres pg_isready > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Not responding"
fi

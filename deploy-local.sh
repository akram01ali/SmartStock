#!/bin/bash

echo "🚀 Deploying SmartStock locally with Docker Compose..."

# Get local IP address for network deployment
LOCAL_IP=$(ip route get 1.1.1.1 | grep -oP 'src \K[0-9.]+')
export LOCAL_IP
echo "🌐 Local IP detected: $LOCAL_IP"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker is running"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Remove existing volumes to ensure fresh database
echo "🗑️ Removing existing database volumes..."
docker volume rm smartstock_postgres_data 2>/dev/null || true

# Build and start all services
echo "🔨 Building and starting SmartStock services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Check service health
echo "🔍 Checking service status..."
docker-compose ps

# Wait for database to be ready
echo "⏳ Waiting for database initialization..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec backend prisma db push
docker-compose exec backend prisma generate

# Load latest backup data
echo "📥 Loading latest backup data..."
LATEST_BACKUP=$(ls -t smartstock_backup_*.sql 2>/dev/null | head -1)
if [ -n "$LATEST_BACKUP" ]; then
    echo "🔄 Found latest backup: $LATEST_BACKUP"
    echo "📤 Importing backup data..."
    docker-compose exec -T postgres psql -U postgres -d smartstock < "$LATEST_BACKUP"
    if [ $? -eq 0 ]; then
        echo "✅ Backup data loaded successfully!"
    else
        echo "⚠️  Backup import completed with warnings (this is often normal)"
    fi
else
    echo "⚠️  No backup files found. Starting with empty database."
fi

echo ""
echo "🎉 SmartStock is now running!"
echo ""
echo "📱 Access your applications:"
echo "   Admin Dashboard: http://$LOCAL_IP (or http://$LOCAL_IP:3000)"
echo "   API Backend: http://$LOCAL_IP:8000"
echo "   API Health: http://$LOCAL_IP:8000/health"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop all: docker-compose down"
echo "   Restart: docker-compose restart"
echo ""
echo "📱 For mobile app:"
echo "   Update apps/smartstock-mobile/services/api.ts"
echo "   Set API_BASE_URL to 'http://$LOCAL_IP:8000'"
echo ""
echo "🌐 Network Access:"
echo "   Other devices on your network can access:"
echo "   - Admin Dashboard: http://$LOCAL_IP"
echo "   - API: http://$LOCAL_IP:8000"
echo ""

# Show container status
echo "📊 Container Status:"
docker-compose ps 
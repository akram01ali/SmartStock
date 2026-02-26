#!/bin/bash

echo "🚀 Deploying SmartStock locally with Docker Compose..."
echo "🌐 Using static IP: 10.0.0.99"

# Generate new JWT secret for security
echo "🔐 Generating secure JWT secret..."
JWT_SECRET=$(openssl rand -hex 32)
echo "✅ JWT secret generated: ${JWT_SECRET:0:16}..."

# Update server .env file
echo "📝 Updating server/.env with new JWT secret..."
if [ -f "server/.env" ]; then
    sed -i "s/^JWT_SECRET=.*/JWT_SECRET=\"$JWT_SECRET\"/" server/.env
else
    echo "JWT_SECRET=\"$JWT_SECRET\"" >> server/.env
fi

# Update docker-compose.yml with new JWT secret
echo "📝 Updating docker-compose.yml with new JWT secret..."
sed -i "s/JWT_SECRET: .*/JWT_SECRET: $JWT_SECRET/" docker-compose.yml

echo "✅ JWT secret updated in configuration files"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker is running"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down

# Remove existing volumes to ensure fresh database
echo "🗑️ Removing existing database volumes..."
docker volume rm smartstock_postgres_data 2>/dev/null || true

# Build and start all services
echo "🔨 Building and starting SmartStock services..."
docker compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Check service health
echo "🔍 Checking service status..."
docker compose ps

# Wait for database to be ready
echo "⏳ Waiting for database initialization..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
docker compose exec backend prisma db push
docker compose exec backend prisma generate

# Load latest backup data
echo "📥 Loading backup data..."
if [ -f "smartstock_backup.sql" ]; then
    echo "🔄 Found backup: smartstock_backup.sql"
    echo "📤 Importing backup data..."
    sudo docker compose exec -T postgres psql -U postgres -d smartstock < smartstock_backup.sql
    if [ $? -eq 0 ]; then
        echo "✅ Backup data loaded successfully!"
    else
        echo "⚠️  Backup import completed with warnings (this is often normal)"
    fi
else
    echo "⚠️  smartstock_backup.sql not found. Starting with empty database."
fi

echo ""
echo "🎉 SmartStock is now deployed!"
echo ""
echo "🔐 Security:"
echo "   ✅ New JWT secret generated and configured"
echo "   🔑 Secret: ${JWT_SECRET:0:16}... (truncated for security)"
echo ""
echo "📱 Access your applications:"
echo "   Admin Dashboard: http://10.0.0.99 (or http://10.0.0.99:3000)"
echo "   API Backend: http://10.0.0.99:8000"
echo "   API Health: http://10.0.0.99:8000/health"
echo ""
echo "🌐 Custom Domain Access (if DNS configured):"
echo "   Admin Dashboard: http://admin.iacs.com"
echo "   API Backend: http://admin.iacs.com:8000"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker compose logs -f"
echo "   Stop all: docker compose down"
echo "   Restart: docker compose restart"
echo ""
echo "📱 Mobile App Configuration:"
echo "   ✅ Already configured for http://10.0.0.99:8000"
echo "   No changes needed in mobile app settings"
echo ""
echo "🌐 Network Access:"
echo "   Other devices on your network can access:"
echo "   - Admin Dashboard: http://10.0.0.99"
echo "   - API: http://10.0.0.99:8000"
echo ""

# Show container status
echo "📊 Container Status:"

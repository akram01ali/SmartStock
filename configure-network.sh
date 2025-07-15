#!/bin/bash

echo "🌐 Configuring SmartStock for local network deployment..."

# Get local IP address
LOCAL_IP=$(ip route get 1.1.1.1 | grep -oP 'src \K[0-9.]+')
echo "🔍 Detected local IP: $LOCAL_IP"

# Update admin dashboard .env
echo "📝 Updating admin dashboard configuration..."
echo "VITE_API_URL=http://$LOCAL_IP:8000" > apps/admin-dashboard/.env

# Update docker-compose.yml with current IP
echo "🔧 Updating Docker Compose configuration..."
sed -i "s/VITE_API_URL: http:\/\/[0-9.]*\.[0-9.]*\.[0-9.]*\.[0-9.]*:8000/VITE_API_URL: http:\/\/$LOCAL_IP:8000/g" docker-compose.yml

# Update mobile app API URL if it exists
if [ -f "apps/smartstock-mobile/services/api.ts" ]; then
    echo "📱 Updating mobile app configuration..."
    sed -i "s/http:\/\/[0-9.]*\.[0-9.]*\.[0-9.]*\.[0-9.]*:8000/http:\/\/$LOCAL_IP:8000/g" apps/smartstock-mobile/services/api.ts
fi

echo "✅ Network configuration updated!"
echo ""
echo "🚀 Your SmartStock will be accessible at:"
echo "   Admin Dashboard: http://$LOCAL_IP"
echo "   API Backend: http://$LOCAL_IP:8000"
echo ""
echo "📱 Mobile app will connect to: http://$LOCAL_IP:8000"
echo ""
echo "🔄 Run './deploy-local.sh' to start the deployment" 
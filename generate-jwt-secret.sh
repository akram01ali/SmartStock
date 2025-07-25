#!/bin/bash

echo "🔐 Generating new JWT Secret..."
echo ""

NEW_SECRET=$(openssl rand -hex 32)

echo "🔑 New JWT Secret generated:"
echo "$NEW_SECRET"
echo ""

echo "📝 To update your configuration:"
echo ""
echo "1. Update docker-compose.yml:"
echo "   JWT_SECRET: $NEW_SECRET"
echo ""
echo "2. Update server/.env:"
echo "   JWT_SECRET=\"$NEW_SECRET\""
echo ""
echo "⚠️  Important Notes:"
echo "   - This will invalidate all existing user sessions"
echo "   - Users will need to log in again after the change"
echo "   - Keep this secret safe and never share it publicly"
echo ""
echo "🚀 After updating, restart your services:"
echo "   docker-compose restart backend"
echo "" 
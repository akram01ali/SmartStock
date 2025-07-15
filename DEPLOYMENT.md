# SmartStock Local Network Deployment

This guide explains how to deploy SmartStock locally and make it accessible across your local network.

## Quick Start

1. **Configure Network Settings** (optional - auto-detected):
   ```bash
   ./configure-network.sh
   ```

2. **Deploy SmartStock**:
   ```bash
   ./deploy-local.sh
   ```

That's it! SmartStock will be running and accessible from any device on your network.

## What Gets Deployed

- **PostgreSQL Database**: Stores all your inventory data
- **FastAPI Backend**: REST API server  
- **React Admin Dashboard**: Web interface for inventory management
- **Nginx Reverse Proxy**: Routes traffic and serves the dashboard

## Access Points

After deployment, access your applications at:
- **Admin Dashboard**: `http://YOUR_IP` (port 80)
- **API Backend**: `http://YOUR_IP:8000`
- **API Health Check**: `http://YOUR_IP:8000/health`

## Automatic Features

### Network Configuration
- Auto-detects your local IP address
- Configures CORS for local network access
- Updates mobile app connection settings

### Database Management
- Automatically loads the latest backup file (`smartstock_backup_*.sql`)
- Creates fresh database on each deployment
- Runs Prisma migrations

### Service Health Monitoring
- Health checks for all services
- Automatic service restart on failure
- Container status monitoring

## Mobile App Connection

The mobile app will automatically be configured to connect to your local server. 
If you need to manually update it:

1. Edit `apps/smartstock-mobile/services/api.ts`
2. Set `API_BASE_URL` to `http://YOUR_IP:8000`
3. Rebuild the mobile app

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View container status
docker-compose ps

# Access database directly
docker-compose exec postgres psql -U postgres -d smartstock
```

## Backup Management

### Creating Backups
```bash
docker-compose exec postgres pg_dump -U postgres smartstock > smartstock_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Backup Files
- Latest backup is automatically loaded on deployment
- Backup files are named with timestamps: `smartstock_backup_YYYYMMDD_HHMMSS.sql`
- Old backup files can be safely deleted after confirming new deployment works

## Troubleshooting

### Services Won't Start
```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]
```

### Network Access Issues
1. Check firewall settings - ensure ports 80 and 8000 are open
2. Verify IP address with: `ip route get 1.1.1.1 | grep -oP 'src \K[0-9.]+'`
3. Run `./configure-network.sh` to update configuration

### Database Issues
1. Check if backup file exists and is valid
2. Verify database connection: `docker-compose logs postgres`
3. Access database directly: `docker-compose exec postgres psql -U postgres -d smartstock`

## File Structure

```
SmartStock/
├── deploy-local.sh          # Main deployment script
├── configure-network.sh     # Network configuration script  
├── docker-compose.yml       # Docker services configuration
├── nginx.conf              # Nginx reverse proxy config
├── smartstock_backup_*.sql  # Database backup files
├── server/                 # FastAPI backend
│   ├── Dockerfile
│   └── .env               # Database connection config
└── apps/
    └── admin-dashboard/    # React admin interface
        ├── Dockerfile
        └── .env           # API URL configuration
```

## Security Notes

- Default passwords are included for local development
- For production deployment, update all passwords and secrets
- CORS is configured for local network access (10.0.0.*, 192.168.*, 172.*)
- JWT secret should be changed for production use 
# SmartStock

A comprehensive inventory management system with web dashboard and mobile app for real-time stock tracking.

## Repository Structure

```
SmartStock/
├── server/                    # FastAPI backend
│   ├── main.py               # Main API server
│   ├── models.py             # Pydantic models
│   ├── prisma/               # Database schema and migrations
│   └── requirements.txt      # Python dependencies
├── apps/
│   ├── admin-dashboard/      # React web dashboard
│   │   └── src/              # Dashboard source code
│   └── smartstock-mobile/    # Expo React Native mobile app
└── README.md
```

## Applications

### 🖥️ Admin Dashboard (Web)

React-based web application for comprehensive inventory management:

- Component hierarchy visualization with React Flow
- Real-time stock monitoring
- User authentication and management
- CRUD operations for components and relationships

### 📱 SmartStock Mobile (Expo)

React Native mobile app for field operations:

- Quick stock updates
- Barcode scanning (planned)
- Offline capability (planned)
- Real-time sync with backend

### 🔧 Backend API (FastAPI)

Python-based REST API with PostgreSQL database:

- JWT authentication
- Component and relationship management
- Real-time stock tracking
- Multi-user support

## Quick Start

### Backend Setup

```bash
# Start PostgreSQL in Docker
docker run --name mydb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=kamehameha \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 \
  -d postgres:15

# Install dependencies and start server
cd server
pip install -r requirements.txt
prisma db push
prisma generate
uvicorn main:app --reload
```

### Admin Dashboard

```bash
cd apps/admin-dashboard
npm install --force
npm install @xyflow/react --force
npm start
```

### Mobile App (Expo)

```bash
cd apps/smartstock-mobile
npm install
npm start
npm install @react-navigation/native @types/react-navigation
# Scan QR code with Expo Go app on your phone
```

**Note**: Update the API URL in `apps/smartstock-mobile/services/api.ts` to match your server:
```typescript
const API_BASE_URL = 'http://your-server-ip:8000'; // For testing on physical device
// or
const API_BASE_URL = 'http://localhost:8000'; // For emulator/simulator
```

## Environment Variables

### Server (.env)

```
DATABASE_URL="postgresql://postgres:kamehameha@localhost:5432/mydb"
JWT_SECRET_KEY="your-secret-key-change-this-in-production"
```

### Admin Dashboard (.env)

```
VITE_API_URL=http://localhost:8000
```

## Development Workflow

1. **Backend**: FastAPI server runs on `http://localhost:8000`
2. **Web Dashboard**: React app runs on `http://localhost:3000`
3. **Mobile App**: Expo development server with QR code for device testing

## Database Schema

After making changes to `schema.prisma`:

```bash
npx prisma migrate dev --name describe_your_changes
```

## Tech Stack

- **Backend**: FastAPI, PostgreSQL, Prisma ORM, JWT Auth
- **Web**: React 19, TypeScript, Chakra UI, React Flow
- **Mobile**: React Native, Expo, TypeScript
- **Database**: PostgreSQL with Prisma ORM

```bash
npm install --force
npm install @xyflow/react --force
```

## Run FastAPI Locally with Dockerized PostgreSQL (Recommended for Fast Iteration)

### 1. Start PostgreSQL in Docker

Run this command to start a PostgreSQL container named `mydb`:

```bash
docker run --name mydb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=kamehameha \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 \
  -d postgres:15

# Initialize Prisma schema (if not done already)
prisma db push

# Generate Prisma client
prisma generate

```

### 2. Update your `.env` file

Make sure your `server/.env` contains:

```
DATABASE_URL="postgresql://postgres:kamehameha@localhost:5432/mydb"
```

### 3. Install Python dependencies

From the `server` directory:

```bash
pip install -r requirements.txt
```

### 4. Run the FastAPI app locally (with auto-reload)

From the `server` directory:

```bash
uvicorn main:app --reload
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- The app will be available at [http://localhost:8000](http://localhost:8000)
- The `--reload` flag enables auto-reloading on code changes for fast development.

### 5. (Optional) Stopping the Database

To stop the database container:

```bash
docker stop mydb
```

To remove it:

```bash
docker rm mydb
```

---

If you need help with database migrations, Prisma, or connecting to the DB, see the relevant sections below or ask for help!

```bash
npx prisma migrate dev --name describe_your_changes
```

### 6. Importing the data into the database:

```bash
docker-compose exec -T postgres psql -U postgres -d smartstock < backup.sql
``

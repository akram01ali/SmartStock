# SmartStock

# SmartStock FastAPI Development Setup

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
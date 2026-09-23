# Semaine 1: Foundation Setup

## Database Setup (PostgreSQL + PostGIS)

### Local Development
```bash
# Install PostgreSQL 15
# macOS: brew install postgresql@15
# Ubuntu: sudo apt install postgresql-15
# Windows: https://www.postgresql.org/download/windows/

# Start PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE mojazine_db;
CREATE EXTENSION postgis;
GRANT ALL PRIVILEGES ON DATABASE mojazine_db TO postgres;

# Verify
\c mojazine_db
SELECT PostGIS_version();
```

### Environment
```bash
# .env (local)
DATABASE_URL="postgresql://postgres:password@localhost:5432/mojazine_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="dev-secret-key-123456"
NODE_ENV="development"
```

### Prisma Setup
```bash
npm run db:generate    # Generate Prisma client
npm run db:push       # Create tables
npm run db:seed       # Seed demo data
npm run db:studio     # Visual database browser
```

## API Routes Created

✓ POST `/api/auth/register` - Create user + organization
✓ POST `/api/auth/login` - JWT token generation
✓ GET `/api/health` - Database health check

## Real-time Setup

✓ Socket.IO connected via `/api/socket`
✓ Events: `vehicle-gps`, `join-fleet`, `gps-update`
✓ Real-time GPS broadcast (60s intervals)

## Authentication

✓ JWT tokens (7-day expiry)
✓ Password hashing (bcryptjs)
✓ Zustand auth store
✓ User/Organization relationship

## State Management

✓ `useAuthStore` - Login/logout + user state
✓ `useFleetStore` - Vehicle locations + status
✓ React Query hooks for server sync

## Next Week (Semaine 2)

- [ ] Vehicle CRUD endpoints
- [ ] Fleet dashboard API
- [ ] Delivery task management
- [ ] GPS tracking real-time broadcast
- [ ] Telemetry data collection
- [ ] Dashboard UI components

---

**Setup Time**: ~1 hour
**Status**: Phase 0 Week 1 ✓ COMPLETE

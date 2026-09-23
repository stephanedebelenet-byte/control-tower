# Mojazine SaaS — Production Deployment Guide

## Phase 1: GitHub Repository (PENDING)
- [ ] Push to GitHub: `https://github.com/affanesalim1-bot/Control-tower.git`
- [ ] Use Personal Access Token or SSH key for push

```bash
cd C:\Users\Administrateur\mojazine-saas
git push -u origin master
```

## Phase 2: AWS RDS PostgreSQL Database

### Create RDS Instance
- **Engine**: PostgreSQL 15+
- **Instance class**: db.t3.micro (free tier eligible)
- **Storage**: 20 GB
- **Backup retention**: 7 days
- **Multi-AZ**: No (dev/staging), Yes (production)

### Connection Details (after creation)
```
Endpoint: [RDS_ENDPOINT]
Port: 5432
Database: mojazine_db
Master username: postgres
Master password: [SECURE_PASSWORD]
```

### Create Database URL
```
postgresql://postgres:[PASSWORD]@[ENDPOINT]:5432/mojazine_db
```

## Phase 3: Vercel Deployment

### Prerequisites
1. GitHub repo pushed (Phase 1)
2. AWS RDS endpoint & credentials (Phase 2)

### Deploy Steps
1. Go to https://vercel.com
2. Click "New Project"
3. Import GitHub repo: `affanesalim1-bot/Control-tower`
4. Set environment variables (see below)
5. Deploy

### Required Environment Variables
```
DATABASE_URL = postgresql://postgres:[PASSWORD]@[RDS_ENDPOINT]:5432/mojazine_db
REDIS_URL = [OPTIONAL: For production caching]
JWT_SECRET = [GENERATE: Use openssl rand -base64 32]
NEXT_PUBLIC_API_URL = https://[VERCEL_URL]
NEXT_PUBLIC_SOCKET_URL = https://[VERCEL_URL]
NODE_ENV = production
```

### Generate JWT Secret
```bash
openssl rand -base64 32
# Output: (copy this to JWT_SECRET)
```

## Phase 4: Database Migration

After Vercel deploy, run Prisma migration:

```bash
# Via Vercel CLI (after deploy)
vercel env pull
npx prisma migrate deploy
```

Or use Vercel's post-deployment scripts (recommended).

## Phase 5: Health Checks

After deployment, verify:
```bash
curl https://[VERCEL_URL]/api/health
# Expected: 200 OK
```

### Production Checklist
- [ ] GitHub repo pushed
- [ ] AWS RDS running
- [ ] Vercel project created
- [ ] Environment variables set
- [ ] Database migration completed
- [ ] Health endpoint responding
- [ ] API tests passing
- [ ] SSL/HTTPS enabled (automatic on Vercel)

## Monitoring

After production:
- Vercel Analytics: https://vercel.com/dashboard
- RDS Monitoring: AWS Console > RDS > Databases
- Error tracking: Set up Sentry (optional)

## Rollback Plan
- Vercel: Redeploy previous commit
- Database: RDS automated backups (7 days retention)

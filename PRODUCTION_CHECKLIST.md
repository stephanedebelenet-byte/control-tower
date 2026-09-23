# Mojazine Production Deployment Checklist

## 1. Infrastructure Setup

### AWS RDS PostgreSQL
- [ ] Create AWS account (if needed)
- [ ] Create RDS instance:
  - Engine: PostgreSQL 15+
  - Instance: db.t3.micro (free tier)
  - Database name: `mojazine_db`
  - Master user: `postgres`
  - Storage: 20 GB with automated backups
  - Public accessibility: No (Vercel accesses via VPC/security groups)
- [ ] Create security group allowing port 5432 from Vercel IP ranges
- [ ] Note endpoint, port, master password
- [ ] Test connection from local machine

### Optional: Redis (for job queue & caching)
- [ ] AWS ElastiCache OR Upstash Redis
- [ ] Not required for MVP, add later if needed

## 2. GitHub Repository

- [ ] Push code to: https://github.com/affanesalim1-bot/Control-tower
- [ ] Branch strategy: `main` for production, `develop` for staging
- [ ] Add CODEOWNERS file (optional)

## 3. Vercel Deployment

### Connect GitHub
- [ ] Go to https://vercel.com/dashboard
- [ ] Click "New Project"
- [ ] Import GitHub repository
- [ ] Select `affanesalim1-bot/Control-tower`
- [ ] Framework: Next.js (auto-detected)
- [ ] Root directory: `.` (default)

### Environment Variables
Set in Vercel Console > Settings > Environment Variables:

```
DATABASE_URL=postgresql://postgres:PASSWORD@ENDPOINT:5432/mojazine_db
JWT_SECRET=<GENERATE: openssl rand -base64 32>
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://[PROJECT].vercel.app
NEXT_PUBLIC_SOCKET_URL=https://[PROJECT].vercel.app
```

Generate secure JWT:
```bash
openssl rand -base64 32
# Copy output to JWT_SECRET
```

### Build Settings
- Build Command: `npm run build`
- Start Command: `npm start`
- Install Command: `npm install`

## 4. Database Migration

### Option A: Vercel Post-Deploy
Update `vercel.json` to run Prisma migration after deploy (recommended):

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret",
    "NEXT_PUBLIC_API_URL": "https://$VERCEL_URL"
  }
}
```

Then in `package.json` add:
```json
"scripts": {
  ...
  "vercel-build": "npm run build && npx prisma migrate deploy"
}
```

### Option B: Manual Migration
After Vercel deploys:
```bash
vercel env pull  # Get Vercel env vars locally
npx prisma migrate deploy  # Run migrations
```

## 5. Health Check

After deployment succeeds:

```bash
curl https://[PROJECT].vercel.app/api/health
# Expected response:
# {"status":"ok","database":"connected"}
```

If database fails:
- Check DATABASE_URL in Vercel Console
- Verify RDS security group allows Vercel IPs
- Run Prisma migration manually

## 6. Security Hardening

- [ ] **JWT Secret**: Generated & set (never use default)
- [ ] **SSL/TLS**: Automatic via Vercel (*.vercel.app)
- [ ] **CORS**: Configure if frontend on different domain
- [ ] **Rate Limiting**: Add to API routes if needed
- [ ] **SQL Injection**: Prisma ORM handles parameterization
- [ ] **Password Hashing**: bcryptjs configured (10 rounds)

### Environment Variable Security
- [ ] No `.env.production` committed to Git
- [ ] All secrets in Vercel Console only
- [ ] JWT_SECRET never hardcoded
- [ ] Database credentials hidden

## 7. Monitoring & Logs

### Vercel
- [ ] Check Vercel Analytics: https://vercel.com/dashboard
- [ ] Set up error tracking (Sentry recommended)
- [ ] Enable deployment notifications

### AWS RDS
- [ ] CloudWatch metrics: CPU, connections, storage
- [ ] Enable automated backups (7-day retention)
- [ ] Test backup restoration

### Application Logs
- [ ] Check Vercel logs for build errors
- [ ] Monitor API error rates
- [ ] Set up alerts for 5xx errors

## 8. Testing (Pre-Production)

- [ ] API health check: GET `/api/health` → 200 OK
- [ ] Authentication: POST `/api/auth/login` → valid token
- [ ] Registration: POST `/api/auth/register` → user created
- [ ] Database connectivity: Query returns data
- [ ] Real-time: Socket.IO connections working

### Load Testing (Optional)
```bash
npm run test:e2e  # Playwright tests
```

## 9. DNS & Custom Domain (Optional)

- [ ] Add custom domain to Vercel project
- [ ] Configure DNS records (Vercel provides template)
- [ ] SSL certificate auto-generated
- [ ] Verify HTTPS working

## 10. Rollback Plan

### If deployment fails:
1. Vercel: Revert to previous working deployment
2. Database: Rollback migration (Prisma backups)
3. DNS: Point to previous version

### Database Backup
- [ ] RDS automated backups enabled (7 days)
- [ ] Test restore procedure
- [ ] Document rollback steps

## Estimated Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| GitHub setup | 5 min | ⏳ |
| AWS RDS | 10-15 min | ⏳ |
| Vercel config | 5 min | ⏳ |
| DB migration | 2 min | ⏳ |
| Health check | 1 min | ⏳ |
| **Total** | **~30 min** | ⏳ |

## Next: Phase 4 - Advanced Features

After production stabilizes:
- [ ] ML maintenance prediction
- [ ] External traffic API integration
- [ ] Driver gamification system
- [ ] SMS/Email notifications

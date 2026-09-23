# Vercel Deployment Guide

## Overview
This guide deploys Mojazine SaaS to Vercel with automated database migrations.

## Prerequisites
- ✅ GitHub repository pushed to `https://github.com/affanesalim1-bot/Control-tower`
- ✅ AWS RDS PostgreSQL database created
- ✅ JWT secret generated
- ✅ Vercel account at https://vercel.com

## Step 1: Connect GitHub to Vercel

1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Select "Import Git Repository"
4. Search for: `affanesalim1-bot/Control-tower`
5. Click Import
6. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `.` (default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

## Step 2: Add Environment Variables

Before deploying, set environment variables:

1. Click "Environment Variables"
2. Add each variable (select "Production" environment):

```bash
DATABASE_URL
Value: postgresql://postgres:PASSWORD@ENDPOINT:5432/mojazine_db

JWT_SECRET
Value: <Use generated secret from setup-production.sh>

NODE_ENV
Value: production

NEXT_PUBLIC_API_URL
Value: https://mojazine-saas.vercel.app
(Replace with your actual Vercel project URL)

NEXT_PUBLIC_SOCKET_URL
Value: https://mojazine-saas.vercel.app
```

### Generate JWT Secret if not yet done
```bash
# Mac/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

## Step 3: Deploy

1. Click "Deploy"
2. Wait for build to complete (3-5 minutes)
3. Check deployment logs for errors
4. Once complete, you'll get a live URL

## Step 4: Run Database Migration

After successful deployment, run Prisma migrations:

### Option A: Via Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Pull environment variables
vercel env pull

# Run migrations
npx prisma migrate deploy

# Verify database connection
npx prisma db execute --stdin < /dev/null
```

### Option B: Via Vercel Console
1. Vercel Dashboard > Project > Deployments
2. Click latest deployment
3. Click "Runtime logs"
4. Check for Prisma migration output

## Step 5: Test Deployment

### Health Check
```bash
curl https://mojazine-saas.vercel.app/api/health
# Expected: {"status":"ok","database":"connected"}
```

### Authentication Test
```bash
# Register user
curl -X POST https://mojazine-saas.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "name": "Test User"
  }'

# Login
curl -X POST https://mojazine-saas.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
# Expected: JWT token in response
```

## Step 6: Configure Custom Domain (Optional)

1. Vercel Dashboard > Project > Settings > Domains
2. Click "Add"
3. Enter domain (e.g., `api.mojazine.com`)
4. Configure DNS records (Vercel provides template)
5. SSL certificate auto-generated in ~5 minutes

## Step 7: Enable Analytics & Monitoring

### Vercel Analytics
1. Dashboard > Project > Analytics
2. View deployment metrics:
   - Page load time
   - API response time
   - Database queries
   - Function execution

### Error Tracking (Optional)
Integrate Sentry for error tracking:

1. Create Sentry project: https://sentry.io
2. Add Vercel integration: https://sentry.io/integrations/vercel/
3. Set `SENTRY_DSN` in Vercel environment variables

### CloudWatch Logs (AWS)
RDS Dashboard > mojazine-db > Monitoring > CloudWatch Logs

## Step 8: Set Up CI/CD

### Automatic Deployments
- Production: Deploy on push to `main` branch
- Preview: Deploy on all pull requests
- Staging: Deploy on push to `develop` branch

Configure in Vercel Project Settings > Git Configuration.

### Branch Rules
```
main → Production (https://mojazine-saas.vercel.app)
develop → Staging (https://mojazine-saas-staging.vercel.app)
* → Preview (PR-specific URLs)
```

## Troubleshooting

### Build Fails
```
Error: "Cannot find module '@prisma/client'"
```
**Solution**: 
1. Check `package.json` has `@prisma/client` dependency
2. Run `npm install` locally
3. Commit `package-lock.json` to Git
4. Redeploy

### Database Connection Error
```
Error: "P1000: Can't reach database server"
```
**Solution**:
1. Verify DATABASE_URL in Vercel console
2. Check RDS security group allows Vercel IPs
3. Test connection locally:
   ```bash
   psql postgresql://postgres:PASSWORD@ENDPOINT:5432/mojazine_db
   ```

### API Timeout
```
Error: "Function timeout"
```
**Solution**:
1. Increase Vercel Function timeout (max 60s)
2. Optimize database queries
3. Add database indexes
4. Use caching (Redis via Upstash)

### SSL Certificate Issues
```
Error: "SSL certificate not valid"
```
**Solution**:
1. Wait 5-10 minutes for certificate generation
2. Clear browser cache and restart
3. Vercel > Settings > Domains > Force HTTPS enabled

## Performance Optimization

### Image Optimization
```typescript
import Image from 'next/image'

// Good
<Image src="/icon.png" width={32} height={32} />

// Bad
<img src="/icon.png" />
```

### Database Indexing
Already configured in Prisma schema:
```prisma
@@index([organizationId])
@@index([vehicleId, timestamp])
```

### API Caching
```typescript
export const revalidate = 3600 // Revalidate every hour
```

### Bundle Analysis
```bash
npm install --save-dev @next/bundle-analyzer
# Then check bundle size
```

## Production Monitoring Checklist

- [ ] Health endpoint responding (200 OK)
- [ ] Database connected and querying
- [ ] JWT tokens generating correctly
- [ ] API authentication working
- [ ] No console errors in browser
- [ ] Vercel Analytics showing requests
- [ ] CloudWatch showing database metrics
- [ ] Error tracking configured
- [ ] Custom domain working (if applicable)
- [ ] SSL certificate valid

## Rollback Plan

If issues arise:

### Vercel Rollback
1. Dashboard > Deployments
2. Click problematic deployment
3. Actions > Rollback to Previous
4. Confirms rollback to stable version

### Database Rollback
```bash
# RDS automated backup (7-day retention)
AWS Console > RDS > Automated backups > Restore
# Restore to point in time
```

### Emergency Downgrade
```bash
git revert <COMMIT_HASH>
git push origin main
# Vercel auto-redeploys new commit
```

## Security Checklist

- [ ] JWT_SECRET is strong (32+ bytes)
- [ ] DATABASE_URL never exposed in logs
- [ ] HTTPS enforced (Vercel default)
- [ ] Environment variables protected
- [ ] No secrets in `.env.production` file
- [ ] Rate limiting configured
- [ ] CORS restricted to trusted domains

## Next Steps

After successful deployment:
1. ✅ Monitor logs for errors
2. ✅ Load test API endpoints
3. ✅ Set up alerting/notifications
4. ✅ Document API endpoints
5. ✅ Create runbook for incidents
6. ✅ Plan Phase 4: Advanced features

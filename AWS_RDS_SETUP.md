# AWS RDS PostgreSQL Setup Guide

## Prerequisites
- AWS account with billing configured
- RDS access (not restricted by IAM policies)
- Security group management access

## Step 1: Create RDS Instance (AWS Console)

### Navigate
1. Go to https://console.aws.amazon.com/rds/
2. Click "Create database"

### Configuration

| Setting | Value |
|---------|-------|
| Database creation method | Standard create |
| Engine | PostgreSQL |
| Engine version | 15.x (latest 15) |
| Templates | Free tier (eligible for 750 hours/month) |
| DB instance identifier | `mojazine-db` |
| Credentials > Master username | `postgres` |
| Credentials > Password | [STRONG_PASSWORD] |
| DB instance class | db.t3.micro |
| Allocated storage | 20 GB |
| Storage type | GP3 |
| Backup retention | 7 days |
| Multi-AZ | No (dev/staging), Yes (production) |

### Network & Security
- **VPC**: Default VPC
- **Public accessibility**: Yes (for initial setup), No (for production)
- **Security group**: Create new or select existing
  - Allow inbound TCP port 5432
  - From Vercel IP range (or your IP initially)

### Additional settings
- **Database name**: `mojazine_db`
- **Parameter group**: Default
- **Option group**: Default
- **Backup window**: 03:00-04:00 UTC
- **Maintenance window**: sun:04:00-sun:05:00 UTC
- **Enable encryption**: Yes (AWS KMS)
- **Monitoring**: Enable enhanced monitoring (optional)

### Create
Click "Create database" and wait 5-10 minutes for creation.

## Step 2: Get Connection Details

After RDS finishes creating:

1. Go to RDS > Databases > `mojazine-db`
2. Copy these values:
   - **Endpoint** (host): `mojazine-db.xyz123.us-east-1.rds.amazonaws.com`
   - **Port**: `5432`
   - **Master username**: `postgres`
   - **Password**: [STORED_SECURELY]

## Step 3: Test Connection (Optional)

### From Local Machine
```bash
# Install psql (macOS)
brew install postgresql

# Connect to RDS
psql -h mojazine-db.xyz123.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d mojazine_db \
     -p 5432

# Enter master password when prompted
# If connected, type: \q (to quit)
```

### Create test database
```sql
CREATE DATABASE mojazine_db;
\q
```

## Step 4: Configure Security Group

For production Vercel deployment:

### Get Vercel IP Ranges
Visit: https://vercel.com/docs/concepts/edge-network/regions

### Add Inbound Rule to RDS Security Group
1. AWS Console > RDS > Databases > mojazine-db
2. Click Security Group link
3. Inbound rules > Edit
4. Add rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: `0.0.0.0/0` (dev) OR Vercel IP ranges (production)
5. Save

## Step 5: Build Connection URL

```
postgresql://postgres:PASSWORD@ENDPOINT:5432/mojazine_db
```

Example:
```
postgresql://postgres:MySecurePass123@mojazine-db.xyz123.us-east-1.rds.amazonaws.com:5432/mojazine_db
```

## Step 6: Set in Vercel

1. Vercel Dashboard > Project Settings
2. Environment Variables
3. Add variable:
   - Name: `DATABASE_URL`
   - Value: `postgresql://postgres:PASSWORD@ENDPOINT:5432/mojazine_db`
   - Environments: Production, Preview, Development

## Step 7: Run Prisma Migration

After Vercel deployment:

```bash
# Download Vercel environment variables
vercel env pull

# Run migrations
npx prisma migrate deploy

# Or use Prisma Studio
npx prisma studio
```

## Monitoring

### AWS Console
- RDS > Databases > mojazine-db > Monitoring
- Check CPU, connections, storage, IOPS

### CloudWatch Metrics
- Database connections
- Replication lag
- Free storage space
- CPU utilization

### Backup Status
- RDS > Automated backups > mojazine-db
- Retention: 7 days
- Test restoration (optional)

## Cost Estimation

| Item | Cost |
|------|------|
| db.t3.micro (750 hrs/month) | Free (12 months) |
| Storage (20 GB) | ~$2/month |
| Backup (7-day retention) | ~$0.10/day |
| **Total (Free Tier)** | **Free** |
| **Total (After 12 months)** | **~$2.50/month** |

## Troubleshooting

### Cannot connect from Vercel
- [ ] Check RDS security group allows port 5432
- [ ] Verify DATABASE_URL in Vercel has correct format
- [ ] Check RDS endpoint is correct (no trailing `/`)

### Prisma migration fails
- [ ] Check database `mojazine_db` exists
- [ ] Verify DATABASE_URL in Vercel environment
- [ ] Run `prisma db push` to sync schema

### Slow queries
- [ ] Check CloudWatch metrics
- [ ] Add indexes to frequently-queried fields
- [ ] Consider scaling to larger instance

## Security Best Practices

- ✅ Use strong master password (20+ chars, mixed)
- ✅ Store password in AWS Secrets Manager (not Vercel)
- ✅ Enable encryption at rest (RDS KMS)
- ✅ Use VPC + private security group (production)
- ✅ Enable automated backups
- ✅ Regular backup testing
- ✅ Monitor CloudWatch for unauthorized access

## Disaster Recovery

### Automated Backups
- Retention: 7 days
- Point-in-time restore: Within 7 days
- Restore time: 5-30 minutes

### Manual Backup
```bash
# Create snapshot via AWS Console
RDS > Snapshots > Create snapshot
```

### Restore from Backup
1. RDS > Snapshots
2. Select snapshot
3. Actions > Restore DB instance
4. Choose new identifier: `mojazine-db-restored`
5. Select latest snapshot
6. Restore and update DATABASE_URL

## Next Steps

- [ ] RDS instance created
- [ ] Connection tested locally
- [ ] DATABASE_URL configured in Vercel
- [ ] Prisma migration deployed
- [ ] Health check endpoint responding
- [ ] Monitoring configured

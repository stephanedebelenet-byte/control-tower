#!/bin/bash
# Mojazine Production Setup Helper

echo "🚀 Mojazine Production Setup"
echo "=============================="
echo ""

# 1. Generate JWT Secret
echo "1️⃣  Generating JWT Secret..."
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET: $JWT_SECRET"
echo "   ↳ Copy this to Vercel Environment Variables"
echo ""

# 2. Database URL template
echo "2️⃣  Database URL Template:"
echo "DATABASE_URL=postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/mojazine_db"
echo "   Replace:"
echo "   - PASSWORD: Your RDS master password"
echo "   - RDS_ENDPOINT: Your RDS endpoint (e.g., mojazine.cxyz123.us-east-1.rds.amazonaws.com)"
echo ""

# 3. Environment variables to set
echo "3️⃣  Environment Variables to Set in Vercel:"
cat << 'EOF'
DATABASE_URL=postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/mojazine_db
JWT_SECRET=<GENERATED_ABOVE>
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://[VERCEL_PROJECT].vercel.app
NEXT_PUBLIC_SOCKET_URL=https://[VERCEL_PROJECT].vercel.app
EOF

echo ""
echo "4️⃣  After Vercel Deployment, run:"
echo "    vercel env pull"
echo "    npx prisma migrate deploy"
echo ""

echo "✅ Setup complete! Next steps:"
echo "   1. Create RDS database on AWS"
echo "   2. Push code to GitHub"
echo "   3. Deploy to Vercel"
echo "   4. Run Prisma migration"
echo "   5. Test /api/health endpoint"

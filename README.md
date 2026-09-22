# Mojazine SaaS - TMS/WMS/GMAO Platform

Complete Transport Management System (TMS) + Warehouse Management System (WMS) + GMAO (Maintenance) platform for logistics fleet management in Morocco.

## Phase 0: Foundation (4 weeks)

### Stack
- **Frontend**: Next.js 14 (App Router), React 18, Zustand, React Query
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL 15 + PostGIS
- **Real-time**: Socket.IO
- **Job Queue**: Bull (Redis)
- **Authentication**: JWT
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

### Directory Structure
```
mojazine-saas/
├── app/                     # Next.js App Router
│   ├── api/                # API routes
│   │   ├── auth/
│   │   ├── vehicles/
│   │   ├── fleet/
│   │   ├── deliveries/
│   │   └── ws/             # WebSocket routes
│   ├── dashboard/          # UI pages
│   └── layout.tsx
├── prisma/
│   └── schema.prisma       # Database schema (50+ tables)
├── lib/
│   ├── db.ts              # Prisma client
│   ├── auth.ts            # JWT utilities
│   └── socket.ts          # Socket.IO setup
├── stores/                # Zustand stores
│   ├── fleet.ts
│   ├── telemetry.ts
│   ├── alerts.ts
│   └── ui.ts
├── types/                 # TypeScript types
├── components/            # React components
├── public/               # Static assets
├── .github/workflows/    # CI/CD
├── package.json
├── tsconfig.json
├── next.config.js
└── vercel.json
```

### Key Features (Phase 0)
- [x] Prisma schema with 50+ tables
- [x] Vehicle tracking (GPS, telemetry)
- [x] Real-time alerts
- [x] Delivery task management
- [x] Warehouse management
- [x] Fuel tracking
- [x] Maintenance scheduling
- [x] Eco-driving scoring algorithm
- [x] User authentication
- [x] Organizations (multi-tenant)
- [ ] Socket.IO real-time updates
- [ ] API endpoints (CRUD)
- [ ] Dashboard UI components
- [ ] Zustand state management
- [ ] CI/CD GitHub Actions
- [ ] Vercel deployment

### Getting Started

1. **Prerequisites**
   - Node.js 18+
   - PostgreSQL 15+
   - Redis (for Bull queue)

2. **Setup**
   ```bash
   npm install
   cp .env.example .env
   npm run db:push
   npm run dev
   ```

3. **Database**
   - PostgreSQL with PostGIS extension
   - Prisma migrations
   - Seed data for development

### Deployment
- Vercel (auto-deploy on push to main)
- PostgreSQL Neon or AWS RDS
- Redis Cloud or AWS ElastiCache

### Timeline
- Week 1: Setup + Prisma schema + Auth
- Week 2: API endpoints + Socket.IO
- Week 3: Dashboard UI + Zustand stores
- Week 4: CI/CD + Testing + Deployment

---

**Author**: Claude Code  
**License**: MIT  
**Organization**: Mojazine Logistics

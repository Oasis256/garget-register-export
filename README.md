# Garget Register — Complete Project Export

## Contents

```
garget-register-export/
├── source/                  ← Full project source code
│   ├── client/              ← React 19 frontend (Vite + Tailwind 4)
│   ├── server/              ← Express + tRPC backend
│   ├── drizzle/             ← Database schema & migrations
│   ├── shared/              ← Shared types, constants, category catalog
│   ├── package.json
│   └── ...
└── database/
    └── garget-register-db-export.sql  ← Full MySQL/TiDB dump (schema + data)
```

## Tech Stack

- **Frontend:** React 19, Vite 7, Tailwind CSS 4, shadcn/ui, Wouter, tRPC client
- **Backend:** Node.js, Express 4, tRPC 11, Drizzle ORM
- **Database:** MySQL / TiDB (compatible with any MySQL 8.0+ server)
- **Auth:** Manus OAuth
- **Payments:** Flutterwave (MTN Uganda + Airtel Money)
- **QR Codes:** html5-qrcode (scanner) + qrcode (generator)

## Database Import

```bash
# Import into any MySQL 8.0+ server:
mysql -h <host> -u <user> -p <database_name> < database/garget-register-db-export.sql
```

## Local Development Setup

```bash
cd source
# Create a .env file with the variables listed below
pnpm install
pnpm dev               # Starts on http://localhost:3000
```

## Environment Variables Required

| Variable | Description |
|---|---|
| DATABASE_URL | MySQL connection string (mysql://user:pass@host:port/dbname) |
| JWT_SECRET | Session signing secret (any long random string) |
| FLUTTERWAVE_SECRET_KEY | Flutterwave API key — get from dashboard.flutterwave.com |
| VITE_APP_ID | Manus OAuth App ID |
| OAUTH_SERVER_URL | Manus OAuth backend URL |
| VITE_OAUTH_PORTAL_URL | Manus login portal URL |
| BUILT_IN_FORGE_API_KEY | Manus built-in API key (server-side) |
| BUILT_IN_FORGE_API_URL | Manus built-in API URL |
| VITE_FRONTEND_FORGE_API_KEY | Manus built-in API key (frontend) |
| VITE_FRONTEND_FORGE_API_URL | Manus built-in API URL (frontend) |

## Key Features

- Asset registration for 22 categories (vehicles, phones, laptops, motorcycles, generators, etc.)
- Dynamic parts checklist per category (engine, battery, screen, doors, tyres, etc.)
- QR code generation per asset + camera-based QR scanning on mobile
- Real-time ownership verification (CLEAN / STOLEN / PENDING / UNVERIFIED)
- Stolen item reporting with UPF (Uganda Police Force) + UCC Simu Klear IMEI blacklist
- Mobile Money payments (MTN Uganda + Airtel Money via Flutterwave)
- Subscription tiers: Free (2 assets), Premium (20 assets, UGX 10,000/yr), Business (200 assets, UGX 35,000/yr)
- Role-based access: Owner, Buyer, Law Enforcement, Admin
- NIN (National ID Number) verification flow
- SHA-256 hashed evidence file uploads with signed URL serving
- Parent-child asset hierarchy (vehicle + its registered parts)
- Ownership transfer workflow with NIN confirmation
- Law enforcement portal with Google Maps for stolen asset locations
- Admin panel with user management, fraud monitoring, and category analytics

## Live URL

https://gargetreg-4quqvcg9.manus.space

## Test Suite

```bash
cd source
pnpm test   # 25 tests across 3 test files — all pass
```

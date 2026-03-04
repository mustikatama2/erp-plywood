# Deployment Guide — Mustikatama ERP

## Architecture Overview

```
╔═══════════════════════════════════════════════════════════╗
║              COMPANY LAN (No internet for users)          ║
║                                                           ║
║  User PC / Tablet                                         ║
║      │ http://192.168.1.50  (or hostname erp.local)       ║
║      ▼                                                    ║
║  ┌─────────────────────────────────────────────────┐      ║
║  │           On-Prem Server (Docker)               │      ║
║  │  ┌─────────────┐  ┌──────────────┐             │      ║
║  │  │  React App  │  │  Node.js API │             │      ║
║  │  │  (Nginx:80) │  │  (port 3001) │             │      ║
║  │  └──────┬──────┘  └──────┬───────┘             │      ║
║  │         │  /api proxy    │                     │      ║
║  │         └────────────────┘                     │      ║
║  │                     │                          │      ║
║  │              ┌──────▼──────┐                   │      ║
║  │              │ PostgreSQL  │ ← Primary DB       │      ║
║  │              │ (port 5432) │                   │      ║
║  │              └─────────────┘                   │      ║
║  │                     │                          │      ║
║  │         ┌───────────▼────────────┐             │      ║
║  │         │  Sync Daemon           │ ← Server-side║      ║
║  │         │  (when internet avail) │   only       │      ║
║  └─────────┴────────────────────────┴─────────────┘      ║
╚════════════════════════╤══════════════════════════════════╝
                         │ HTTPS (server only, when online)
                         ▼
              ╔══════════════════════╗
              ║   Supabase Cloud     ║
              ║   (backup + sync)    ║
              ╚══════════════════════╝
                         │
                         ▼ (optional, management only)
              ╔══════════════════════╗
              ║   Vercel (external)  ║
              ║   erp-plywood.vercel ║
              ╚══════════════════════╝
```

---

## Prerequisites

On the server machine (Windows/Linux/Mac):
- **Docker Desktop** or Docker Engine + Compose
- Minimum: 2 CPU, 4GB RAM, 50GB disk
- Static LAN IP (e.g., 192.168.1.50) — set in router DHCP reservation

---

## Installation Steps

### Step 1 — Get the code

```bash
# Option A: Clone from GitHub
git clone https://github.com/mustikatama2/erp-plywood.git
cd erp-plywood

# Option B: Copy files to server via USB/LAN (no internet needed after initial setup)
```

### Step 2 — Configure environment

```bash
cp .env.example .env
nano .env   # or edit with any text editor
```

Minimum settings to change:
```env
DB_PASSWORD=YourStrongPassword123!
JWT_SECRET=YourVeryLongRandomSecretString_AtLeast32Chars

# Optional — only if you want Supabase sync:
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=your_service_role_key
```

### Step 3 — Start the system

```bash
# First time (builds everything, takes 2-5 min on first run)
docker compose up -d

# Check logs to confirm everything started
docker compose logs -f

# You should see:
#   ✅ ERP API running on port 3001
#   ✅ DB: db/erp
```

### Step 4 — Access the app

Open a browser on any computer in the LAN:
```
http://192.168.1.50       (replace with your server's IP)
```

Or set up a hostname:
- Add `192.168.1.50  erp.mustikatama.local` to DNS/hosts file
- Access via `http://erp.mustikatama.local`

---

## Enable Supabase Cloud Sync (Optional)

Only the **server** needs internet access. Users never do.

```bash
# Start with sync enabled
docker compose --profile sync up -d

# The sync daemon will:
# - Check internet every 5 minutes
# - Push unsynced records to Supabase
# - Pull any cloud-side changes back
# - Skip silently if offline
```

---

## Default Login Credentials

| Username | Password    | Role       |
|----------|-------------|------------|
| admin    | admin123    | Full access |
| sari     | sari123     | Finance    |
| budi     | budi123     | Sales      |
| wahyu    | wahyu123    | Purchasing |
| doni     | doni123     | Warehouse  |
| rini     | rini123     | HR         |
| viewer   | viewer123   | Read-only  |

⚠️ **Change all passwords** after first login via Settings → Users.

---

## Common Operations

```bash
# Stop the system (data preserved)
docker compose down

# Restart
docker compose restart

# View logs
docker compose logs -f app    # Nginx (web)
docker compose logs -f api    # Node API
docker compose logs -f db     # PostgreSQL
docker compose logs -f sync   # Sync daemon

# Backup the database
docker compose exec db pg_dump -U erp erp > backup_$(date +%Y%m%d).sql

# Restore from backup
cat backup_20260304.sql | docker compose exec -T db psql -U erp erp

# Update app (after code changes)
git pull
docker compose build app api
docker compose up -d
```

---

## Network / Firewall Notes

On the server, only port 80 needs to be accessible on the LAN.
PostgreSQL (5432) should **NOT** be exposed to LAN (it's only internal between containers).

```
# Windows Firewall — allow port 80 inbound:
netsh advfirewall firewall add rule name="ERP App" protocol=TCP dir=in localport=80 action=allow

# Linux (ufw):
ufw allow 80/tcp
```

---

## Upgrade Path

When you're ready to add more features or migrate to a bigger server:
1. `docker compose exec db pg_dump -U erp erp > full_backup.sql`
2. Move to new server, run Step 1–3
3. `cat full_backup.sql | docker compose exec -T db psql -U erp erp`
4. All data intact ✅

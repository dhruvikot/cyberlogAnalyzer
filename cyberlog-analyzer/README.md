# CyberLog Analyzer

A full-stack security log analysis platform for SOC and MDR teams. Upload Nginx or ZScaler proxy logs and get automated threat detection with AI-powered explanations in under 60 seconds.

---

## Overview

CyberLog Analyzer parses raw security logs, runs five statistical detection rules, and uses Claude AI to explain every flagged anomaly in plain English with MITRE ATT&CK mapping. Built for analysts who need answers fast, not dashboards that require a manual.

**What it detects:**
- Brute force attacks and account takeovers
- C2 beaconing (malware checking in with command-and-control servers)
- Data exfiltration via unusual outbound transfer volumes
- Vulnerability scanning and path traversal attempts
- Abnormal request spikes from individual IPs

**Key features:**
- Auto-detects log format (Nginx or ZScaler) — no configuration required
- Cross-log correlation when multiple files are uploaded in the same session
- AI-generated executive summary per file written for SOC managers
- Multi-user with private isolated reports per account
- Full history with delete, timeline chart, filterable event table

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Backend | Node.js, Express, TypeScript (via tsx) |
| Database | PostgreSQL, Prisma ORM |
| AI | Anthropic Claude Haiku |
| Auth | JWT in httpOnly cookies, bcrypt |
| Infrastructure | Docker (local), Railway (backend), Vercel (frontend) |

---

## Prerequisites

- Node.js 18 or higher
- Docker Desktop
- Anthropic API key ([get one here](https://console.anthropic.com))

---

## Local Setup

**1. Clone the repository**

```bash
git clone https://github.com/yourusername/cyberlog-analyzer.git
cd cyberlog-analyzer
```

**2. Start the database**

```bash
docker-compose up -d
```

**3. Configure and run the backend**

```bash
cd backend
cp .env.example .env
```

Open `.env` and set your `ANTHROPIC_API_KEY`. All other defaults work for local development.

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Backend is running at `http://localhost:4000`

**4. Run the frontend** (new terminal)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend is running at `http://localhost:3000`

---

## Demo Credentials

```
Email:    admin@cyberlog.com
Password: password123
```

---

## Environment Variables

**Backend** (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/cyberlog` |
| `JWT_SECRET` | Min 32 character signing secret | — |
| `JWT_EXPIRY` | Token expiry | `24h` |
| `ANTHROPIC_API_KEY` | Anthropic API key | — |
| `PORT` | Backend port | `4000` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `UPLOAD_DIR` | File storage path | `./uploads` |
| `MAX_FILE_SIZE_MB` | Upload limit | `50` |

**Frontend** (`frontend/.env.local`)

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:4000` |

---

## Sample Log Files

Two sample files with embedded attack patterns are included in `/sample_logs/` for testing:

| File | Lines | Embedded Anomalies |
|---|---|---|
| `sample_nginx.log` | 1,182 | Brute force + account takeover, path scanning (/.env, /.git), IP request spike |
| `sample_zscaler.csv` | 1,054 | C2 beaconing (300s intervals), 245MB data exfiltration, IP request spike |

Upload both files in the same session to trigger cross-log correlation. IP `10.0.0.5` appears anomalously in both files and surfaces in the Correlations tab.

---

## Anomaly Detection

Detection uses a two-layer architecture: deterministic rule-based detection followed by AI explanation. The two layers are independent — if the AI layer is unavailable, anomalies still display with full rule-based detail.

### Rule-Based Detection

**Rule 1 — IP Request Spike** _(Nginx + ZScaler)_
Groups requests by source IP in 5-minute windows. Computes mean and standard deviation across all IPs in the file. Flags any IP exceeding the mean by more than 2.5 standard deviations (z-score method). Self-calibrating — no hardcoded thresholds, adapts to each client's traffic baseline automatically.

**Rule 2 — Suspicious Path Scanning** _(Nginx)_
Pattern matches request targets against known attack signatures: `/.env`, `/.git`, `/wp-admin`, `/phpmyadmin`, path traversal sequences, SQL injection strings, and XSS payloads. Confidence fixed at 0.95 — a pattern match is near-certain evidence of malicious intent.

**Rule 3 — Data Exfiltration** _(ZScaler)_
Computes the 95th percentile of all `bytes_sent` values as a per-file baseline. Flags any transfer exceeding 3x that baseline. Self-calibrating per file — distinguishes genuinely large transfers from normal behavior for that specific environment.

**Rule 4 — C2 Beaconing** _(ZScaler)_
Groups requests by `(source IP, destination domain)` and calculates intervals between consecutive requests. Computes coefficient of variation (`stddev / mean`). A CV below 0.1 with more than 20 requests indicates highly regular automated communication — consistent with malware C2 check-ins. This is the same methodology used by commercial tools like Darktrace.

**Rule 5 — Brute Force** _(Nginx)_
Counts 401 and 403 responses per IP in 10-minute windows. Flags if count exceeds 20 failed attempts. Elevates severity to CRITICAL if a successful 200 response follows — indicating probable account takeover.

### AI Explanation (Claude Haiku)

After rules flag anomalies, results are sent to `claude-haiku-4-5-20251001` in batches of 10. For each anomaly Claude returns:

- Plain English explanation (2 sentences, written for junior analysts)
- MITRE ATT&CK technique ID and name (e.g. `T1071.001 — Web Protocols`)
- Recommended immediate action
- Confidence adjustment (±0.1)

One executive summary per file is also generated — a 3-sentence brief written for SOC managers with specific IPs, domains, and numbers.

**Cost:** ~$0.0001 per file at Claude Haiku pricing.

---

## API Reference

**Auth**
```
POST  /api/auth/signup
POST  /api/auth/login
POST  /api/auth/logout
GET   /api/auth/me
```

**Sessions**
```
POST    /api/sessions
GET     /api/sessions
GET     /api/sessions/:id
GET     /api/sessions/:id/correlations
DELETE  /api/sessions/:id
```

**Files**
```
POST    /api/sessions/:id/files
GET     /api/files/:id
GET     /api/files/:id/analysis
GET     /api/files/:id/anomalies
GET     /api/files/:id/entries
DELETE  /api/files/:id
```

---

## Project Structure

```
cyberlog-analyzer/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   └── src/
│       ├── config/          # env validation, database singleton
│       ├── middleware/       # auth guard, file upload, error handler
│       └── modules/
│           ├── auth/         # login, signup, JWT
│           ├── sessions/     # session management, correlations
│           ├── files/        # upload, status, entries, analysis
│           ├── parsers/      # nginx parser, zscaler parser, auto-detector
│           ├── anomaly/      # 5 detection rules, orchestrator
│           └── ai/           # claude service, batch explanation, summary
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # landing page
│   │   ├── login/
│   │   ├── signup/
│   │   ├── upload/
│   │   ├── history/
│   │   └── dashboard/[fileId]/
│   ├── components/
│   │   ├── dashboard/        # KPI cards, timeline, anomaly cards, tables
│   │   ├── upload/           # dropzone, processing status
│   │   └── ui/               # badge, confidence bar
│   ├── services/
│   │   └── api.ts            # all backend calls, auth error handling
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── usePolling.ts
│   └── middleware.ts          # route protection
└── sample_logs/
    ├── sample_nginx.log
    └── sample_zscaler.csv
```

---

## Security

- **Passwords** — bcrypt with 12 salt rounds (~250ms per hash, brute force impractical)
- **Session tokens** — JWT stored in httpOnly cookies, inaccessible to JavaScript (XSS resistant)
- **File validation** — magic bytes checked in addition to extension and MIME type
- **Rate limiting** — upload endpoint rate limited per user
- **SQL injection** — all queries via Prisma parameterized statements
- **CORS** — origin whitelist only, no wildcard

---

## Scaling Considerations

The prototype processes files synchronously in a single thread. The production evolution path:

- **Next step:** BullMQ worker queue — uploads return immediately, processing runs in background workers
- **File storage:** Replace local filesystem with S3 — required for multi-instance deployments
- **Real-time ingestion:** Replace batch upload with Kafka or Kinesis stream for live MDR use cases
- **Caching:** Redis for analysis results to avoid re-querying on every dashboard load
- **Database:** Read replicas for dashboard queries, keep writes on primary

The five detection rules require no changes in any of these scenarios. Only the ingestion and trigger layer changes.

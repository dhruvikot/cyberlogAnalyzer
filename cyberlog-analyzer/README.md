# CyberLog Analyzer

A full-stack cybersecurity log analysis platform with AI-powered anomaly detection.

## Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **AI**: Anthropic Claude API
- **Frontend**: Next.js (coming soon)

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- npm

### 1. Start the database

```bash
docker-compose up -d
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Run database migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Start the backend server

```bash
npm run dev
```

The server runs at `http://localhost:4000`.  
Health check: `http://localhost:4000/api/health`

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your values.

| Variable           | Description                          |
|--------------------|--------------------------------------|
| DATABASE_URL       | PostgreSQL connection string         |
| JWT_SECRET         | Secret key for JWT signing (32+ chars) |
| JWT_EXPIRY         | Token expiry duration (e.g. `24h`)   |
| ANTHROPIC_API_KEY  | Your Anthropic API key               |
| PORT               | Backend port (default: 4000)         |
| UPLOAD_DIR         | Directory for uploaded log files     |
| MAX_FILE_SIZE_MB   | Max upload size in MB (default: 50)  |
| NODE_ENV           | `development` / `production` / `test` |

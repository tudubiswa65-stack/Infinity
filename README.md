# InfiniteBoard v3

A shared infinite canvas where anyone can write and draw anywhere, forever. No accounts required.

## Features

- **Infinite Canvas**: Pan and zoom across an endless 2D space
- **Write Mode**: Click anywhere to leave a persistent text message
- **Draw Mode**: Drag to draw freehand strokes
- **Anonymous Identity**: Auto-generated 8-char ID stored in localStorage
- **Real-time Updates**: Supabase Realtime for live collaboration
- **Permanent**: No edit or delete — the canvas only grows

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (dark theme)
- **Database**: Supabase (PostgreSQL + Realtime)
- **Rate Limiting**: Upstash Redis

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd Infinity
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |

Optional:

| Variable | Description |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (falls back to anon key) |

### 3. Set up Supabase database

Run the migration in your Supabase SQL editor:

```bash
# Copy and run supabase/migrations/001_initial.sql in Supabase SQL Editor
```

Enable Realtime for the `messages` and `strokes` tables in your Supabase dashboard.

### 4. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Deployment (Railway)

1. Create a new Railway project
2. Connect your GitHub repository
3. Add environment variables in Railway dashboard
4. Railway auto-detects Next.js — it will run `npm run build` and `npm start`

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/messages` | GET | Fetch messages in viewport |
| `/api/messages` | POST | Post a new message |
| `/api/strokes` | GET | Fetch recent strokes |
| `/api/strokes` | POST | Post a new stroke |

### Rate Limits (per user per minute)
- Messages: 10
- Strokes: 5

## Database Schema

See `supabase/migrations/001_initial.sql` for the full schema.

## Security

- All user inputs validated and sanitized in API routes
- Content-Security-Policy headers set
- Rate limiting on all write endpoints
- No authentication — identity is client-side only (tracking, not auth)
- No UPDATE or DELETE access in database (permanence enforced at DB level)

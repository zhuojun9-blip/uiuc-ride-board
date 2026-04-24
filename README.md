# UIUC Ride Board MVP

A local MVP for a UIUC intercity ride-board platform built with React, Vite, and Tailwind CSS.

## Stack

- React
- Vite
- Tailwind CSS
- lucide-react
- framer-motion

## Product Scope

This MVP is a listing and request platform for intercity rides around UIUC and Chicago-area routes.

Included sections:
- Hero landing section
- Route search section
- Driver listings section
- Ride requests section
- Driver application form
- Trust/safety section
- Contact/support section

Sample route focus:
- UIUC → ORD
- ORD → UIUC
- UIUC → Midway
- UIUC → Downtown Chicago

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Run dev server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Preview production build:

```bash
npm run preview
```

## Netlify Deployment

This project includes a `netlify.toml` with:
- Build command: `npm run build`
- Publish directory: `dist`

### Option A: Deploy from Git

1. Push project to GitHub.
2. In Netlify, click **Add new site** → **Import an existing project**.
3. Select the repository.
4. Confirm settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Deploy.

### Option B: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --build --prod
```

## Connect Frontend to Backend

The frontend reads API/WebSocket endpoints from environment variables:

- `VITE_BACKEND_URL` (example: `https://your-backend.onrender.com`)
- `VITE_WS_URL` (example: `wss://your-backend.onrender.com`)

### Local frontend + local backend

Create `.env` in project root:

```bash
VITE_BACKEND_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### Netlify frontend + deployed backend

In Netlify Site settings → Environment variables, set:

- `VITE_BACKEND_URL=https://your-backend-domain`
- `VITE_WS_URL=wss://your-backend-domain`

Then trigger a new deploy.

### Backend CORS

Backend allows:

- `FRONTEND_URL` from backend `.env`
- local dev origins (`http://localhost:5173`, `http://localhost:3000`)
- all `*.netlify.app` origins

## Files to Extend Later

- `src/App.jsx`: Main MVP UI and sample data.
- `src/index.css`: Tailwind layers and global base styles.
- `netlify.toml`: Netlify build/publish config.

You can later connect forms and listings to Supabase or Firebase with minimal changes to the current structure.

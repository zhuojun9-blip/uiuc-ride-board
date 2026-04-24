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

## Files to Extend Later

- `src/App.jsx`: Main MVP UI and sample data.
- `src/index.css`: Tailwind layers and global base styles.
- `netlify.toml`: Netlify build/publish config.

You can later connect forms and listings to Supabase or Firebase with minimal changes to the current structure.

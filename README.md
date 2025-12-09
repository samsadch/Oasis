# Oasis Mathamangalam Club - Developer Guide

This project consists of a Node.js/Express backend (`server`) and a React/Vite frontend (`client`). It now supports PostgreSQL for production (Vercel) with a local SQLite fallback for development.

## 1. Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation
1.  **Backend Dependencies**:
    ```bash
    cd server
    npm install
    ```
2.  **Frontend Dependencies**:
    ```bash
    cd ../client
    npm install
    ```

## 2. Running the Application

### Start the Server (Backend)
The server runs on port 3000 by default.
```bash
cd server
node index.js
```
*The database file `oasis.db` will be automatically created in the `server` directory if it doesn't exist.*

### Start the Client (Frontend)
The frontend runs on port 5173.
```bash
cd client
npm run dev
```

## 3. Database Guide (PostgreSQL on Vercel)

The backend uses PostgreSQL when the `DATABASE_URL` environment variable is present (recommended for Vercel). If `DATABASE_URL` is not set, it falls back to a local **SQLite** file at `server/oasis.db` for development.

Schema is initialized automatically in `server/database.js` for both PostgreSQL and SQLite. When using Postgres, tables are created on cold start if they do not exist.

Key tables: users, officials, events, messages, posts, post_likes, post_comments, comment_likes.

### Migrating Existing SQLite data to Postgres (optional)
If you have existing data in `server/oasis.db` and want to migrate it to PostgreSQL:

1. Export SQLite to CSV per table (using DB Browser for SQLite or CLI).
2. Create a hosted Postgres (Neon/Supabase/Render) and get the `DATABASE_URL`.
3. Use your Postgres dashboard to import CSVs into the corresponding tables (ensure column order matches). Alternatively, run INSERT scripts after creating tables once the app initializes them on first run.
4. Set `DATABASE_URL` in Vercel. Re-deploy and verify data.

## 4. Server API Structure

-   `server/index.js`: Main entry point. Loads routes and connects to DB.
-   `server/routes/`: Contains API route handlers.
    -   `auth.js`: Registration, Login, Profile updates.
    -   `officials.js`: Managing club officials.
    -   `events.js`: Managing programs and messages.
    -   `admin.js`: Administrative tasks (e.g., blood donor search).

## 5. Deployment to Vercel (API + SPA)

The repository contains a `vercel.json` configured to:
- Build the server as a serverless function from `server/index.js`.
- Build the client using Vite (`client/`) and serve it as a static SPA.
- Route `/api/*` requests to the serverless function and all other routes to `index.html`.

### Required environment variables (Vercel → Project Settings → Environment Variables)
- NODE_ENV=production
- DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME (Neon/Supabase/etc.)
- JWT_SECRET=your-secret
- CLOUDINARY_CLOUD_NAME=...
- CLOUDINARY_API_KEY=...
- CLOUDINARY_API_SECRET=...
- Optionally: CORS_ORIGIN with your frontend origin (if you need to restrict CORS)

On the client, prefer relative API calls like `/api/...` so it works in both dev and prod without extra configuration.

### Notes for Vercel
- The serverless filesystem is read-only. This project uses Cloudinary for uploads. We conditionally avoid serving the local `/uploads` folder on Vercel.
- Ensure `DATABASE_URL` is set so the app uses Postgres; otherwise it would attempt SQLite which is not persistent on Vercel.

### Deploy
1. Push the repo to GitHub/GitLab/Bitbucket.
2. In Vercel, import the project (root directory).
3. Add the environment variables listed above.
4. Deploy. You can test locally with `vercel dev` as well.

## 6. Troubleshooting: DNS ENOTFOUND for Supabase host

If you see an error like `getaddrinfo ENOTFOUND db.<project-ref>.supabase.co` from the backend on Vercel:

- Ensure `DATABASE_URL` is the Postgres URI from Supabase (Settings → Database → Connection info → URI), not the REST URL.
  - Must start with `postgres://` or `postgresql://` and host should be `db.<project-ref>.supabase.co`.
  - Include `?sslmode=require` at the end.
- Avoid hidden spaces/newlines when pasting into Vercel env vars.
- After deploying, check the Serverless Function logs: the app now logs the parsed DB protocol and host and performs a DNS preflight.
  - If protocol isn’t `postgres` or host isn’t `db.*.supabase.co`, fix `DATABASE_URL` in Vercel and redeploy.
  - If DNS fails, double‑check the host spelling and that you didn’t paste the REST URL.

Example correct value:

```
DATABASE_URL=postgres://postgres:<YOUR_DB_PASSWORD>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
```


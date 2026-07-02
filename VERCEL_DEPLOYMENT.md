# Vercel Deployment

Deploy this repository as one Vercel project from the repository root.

## Project Settings

- Framework Preset: Other
- Root Directory: leave blank / repository root
- Install Command: `npm install && npm install --prefix frontend && npm install --prefix backend`
- Build Command: `npm run build --prefix frontend`
- Output Directory: `frontend/dist`

These values are also defined in `vercel.json`, so Vercel should pick them up automatically.

## Environment Variables

Set these in Vercel Project Settings > Environment Variables.

For Supabase on Vercel, use the **Transaction pooler** connection details from Supabase Dashboard > Connect, not the direct `db.[project-ref].supabase.co:5432` URL. The direct URL is commonly IPv6-only on free Supabase projects, while Vercel serverless functions should use the IPv4 Supavisor transaction pooler.

```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[URL_ENCODED_PASSWORD]@[POOLER_HOST]:6543/postgres
DB_HOST=[POOLER_HOST]
DB_NAME=postgres
DB_USER=postgres.[PROJECT_REF]
DB_PASSWORD=[PASSWORD]
DB_PORT=6543
DB_SSL=true
SESSION_SECRET=[random-secret-at-least-32-characters]
COOKIE_NAME=tailor.sid
COOKIE_SECURE=true
CORS_ORIGIN=https://your-vercel-domain.vercel.app
NODE_ENV=production
BCRYPT_SALT_ROUNDS=12
BACKUP_DIRECTORY=/tmp/backups
```

If your password contains special characters such as `@`, URL-encode them in `DATABASE_URL` or use the separate `DB_*` variables instead. For example, `@` becomes `%40` in a URL.

For reliable login sessions on Vercel serverless functions, add Redis/Upstash too:

```env
REDIS_URL=rediss://default:[PASSWORD]@[HOST]:6379
```

Alternatively, provide split Redis variables:

```env
REDIS_HOST=[host]
REDIS_PORT=6379
REDIS_PASSWORD=[password]
REDIS_DB=0
REDIS_TLS=true
```

The frontend already uses relative API requests (`/api/v1`), so do not set `VITE_API_URL` unless you intentionally deploy the frontend and backend on separate domains.

## Deploy

1. Push the Vercel changes to GitHub.
2. In Vercel, choose Add New > Project.
3. Import the GitHub repository.
4. Confirm the root directory is the repository root.
5. Add the environment variables above.
6. Deploy.

After deployment, test:

- `https://your-vercel-domain.vercel.app/api/health`
- the login page
- one protected dashboard route after login

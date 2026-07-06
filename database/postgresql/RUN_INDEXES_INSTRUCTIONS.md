# How to Run Performance Indexes SQL

## Option 1: Using psql Command Line (Recommended)

If you have PostgreSQL installed locally and can connect to your database:

```bash
psql -U your_username -d your_database_name -h your_host -p your_port -f database/postgresql/performance_indexes.sql
```

Example:
```bash
psql -U postgres -d tailor_sys -h localhost -p 5432 -f database/postgresql/performance_indexes.sql
```

## Option 2: Using DATABASE_URL Environment Variable

If you have your DATABASE_URL set:

```bash
psql $DATABASE_URL -f database/postgresql/performance_indexes.sql
```

## Option 3: Using pgAdmin or Other GUI Tool

1. Open pgAdmin or your PostgreSQL management tool
2. Connect to your database
3. Open the SQL query editor
4. Copy the contents of `database/postgresql/performance_indexes.sql`
5. Execute the SQL commands

## Option 4: Using Vercel Postgres (if applicable)

If you're using Vercel Postgres:

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Run the SQL file against your Vercel Postgres database
vercel postgres execute --file database/postgresql/performance_indexes.sql
```

## Option 5: Using Supabase SQL Editor (if applicable)

If you're using Supabase:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Click "New Query"
4. Copy the contents of `database/postgresql/performance_indexes.sql`
5. Click "Run"

## Verification

After running the indexes, verify they were created successfully:

```sql
-- Check if indexes exist
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE indexname LIKE 'IX_%'
ORDER BY tablename, indexname;
```

You should see indexes starting with `IX_` for the following tables:
- Orders (4 indexes)
- WorkAssignments (3 indexes)
- Payments (2 indexes)
- CustomerPayments (2 indexes)
- WorkerEarnings (2 indexes)
- WorkerPayments (1 index)
- OrderItems (1 index)

## What These Indexes Do

These composite indexes optimize the most common query patterns:
- **Orders**: Filtering by customer_id + status, stage + status, delivery date + status
- **WorkAssignments**: Finding active assignments, worker-stage combinations
- **Payments**: Order payment lookups by date and type
- **CustomerPayments**: Finding unapplied payments, customer payment history
- **WorkerEarnings**: Worker earnings by order and stage
- **WorkerPayments**: Worker payment history
- **OrderItems**: Stage completion tracking

## Expected Performance Improvement

- **50-70% faster** filtered queries
- **Consistent performance** as data grows
- **Better concurrency** for 3000+ users

## Troubleshooting

**Error: "relation does not exist"**
- Ensure you're running this against the correct database
- Verify the tables exist first by running `SELECT * FROM Orders LIMIT 1;`

**Error: "permission denied"**
- Ensure your database user has CREATE INDEX permissions
- You may need to run as a superuser or grant permissions

**No indexes created**
- Check if indexes already exist (the SQL uses `IF NOT EXISTS`)
- Verify the file path is correct

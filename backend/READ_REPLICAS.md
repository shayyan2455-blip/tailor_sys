# Read Replicas Setup for Scaling

## Overview
Read replicas allow you to scale your database read operations by creating read-only copies of your primary database. This is essential for applications with high read-to-write ratios.

## Benefits of Read Replicas
- **Improved performance**: Offload read queries from primary database
- **Better availability**: Primary database can focus on write operations
- **Geographic distribution**: Place replicas closer to users
- **Backup isolation**: Run analytics/reporting queries without affecting production

## Azure SQL Read Replicas Setup

### Step 1: Enable Read Replicas
1. Go to your Azure SQL Database in Azure Portal
2. Click "Compute + storage" under Settings
3. Select "General Purpose" or "Business Critical" tier (required for replicas)
4. Click "Configure" and enable read replicas

### Step 2: Create Replica
1. In your SQL Database resource, click "Replicas" under Settings
2. Click "Create replica"
3. Configure:
   - **Replica server**: Create new or use existing
   - **Replica name**: `tailor-erp-replica`
   - **Location**: Choose region (can be different from primary)
   - **Compute tier**: Match or lower than primary
4. Click "Create"

### Step 3: Configure Application
Update your database configuration to use read replicas for read operations:

```javascript
// backend/src/config/db.js
const { sql } = require('mssql');
const env = require('./env');

// Primary database (writes)
const primaryConfig = {
  server: env.DB_SERVER,
  database: env.DB_NAME,
  port: env.DB_PORT,
  options: {
    encrypt: env.DB_ENCRYPT,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Read replica (reads)
const replicaConfig = {
  server: env.DB_REPLICA_SERVER || env.DB_SERVER,
  database: env.DB_NAME,
  port: env.DB_PORT,
  options: {
    encrypt: env.DB_ENCRYPT,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 20, // More connections for reads
    min: 5,
    idleTimeoutMillis: 30000
  }
};

let primaryPool, replicaPool;

function getPrimaryPool() {
  if (!primaryPool) {
    primaryPool = sql.connect(primaryConfig);
  }
  return primaryPool;
}

function getReplicaPool() {
  if (!replicaPool) {
    replicaPool = sql.connect(replicaConfig);
  }
  return replicaPool;
}

// Use for write operations
async function queryWrite(req, text, params = {}) {
  const pool = await getPrimaryPool();
  const ctx = contextFromReq(req);
  const request = pool.request();
  request.input('__ctx_user_id', sql.Int, ctx.userId);
  request.input('__ctx_role', sql.NVarChar(20), ctx.role);
  request.input('__ctx_worker_id', sql.Int, ctx.workerId);
  applyInputs(request, params);
  return request.query(withSessionBatch(text));
}

// Use for read operations
async function queryRead(req, text, params = {}) {
  const pool = await getReplicaPool();
  const ctx = contextFromReq(req);
  const request = pool.request();
  request.input('__ctx_user_id', sql.Int, ctx.userId);
  request.input('__ctx_role', sql.NVarChar(20), ctx.role);
  request.input('__ctx_worker_id', sql.Int, ctx.workerId);
  applyInputs(request, params);
  return request.query(withSessionBatch(text));
}

module.exports = {
  sql,
  getPrimaryPool,
  getReplicaPool,
  queryWrite,
  queryRead,
  query: queryRead // Default to read for backward compatibility
};
```

### Step 4: Update Controllers
Update controllers to use `queryWrite` for write operations and `queryRead` for read operations:

```javascript
// Example in customer.controller.js
const { queryWrite, queryRead } = require('../config/db');

// Read operation
const list = asyncHandler(async (req, res) => {
  const result = await queryRead(req, 'SELECT * FROM dbo.Customers;');
  res.json({ data: result.recordset });
});

// Write operation
const create = asyncHandler(async (req, res) => {
  const result = await queryWrite(req, 'INSERT INTO dbo.Customers (...) VALUES (...);');
  res.json({ data: result.recordset[0] });
});
```

### Step 5: Environment Variables
Add to your `.env` or cloud platform configuration:

```env
DB_REPLICA_SERVER=your-replica-server.database.windows.net
```

## AWS RDS Read Replicas Setup

### Step 1: Enable Multi-AZ Deployment
1. Go to your RDS instance in AWS Console
2. Click "Modify"
3. Enable "Multi-AZ deployment"
4. Apply changes

### Step 2: Create Read Replica
1. In RDS console, select your instance
2. Click "Actions" → "Create read replica"
3. Configure:
   - **DB instance identifier**: `tailor-erp-replica`
   - **Instance class**: Match or lower than primary
   - **Availability zone**: Choose different AZ
4. Click "Create read replica"

### Step 3: Update Connection String
Use the replica endpoint for read operations in your application.

## Load Balancing Read Operations

### Simple Round-Robin
```javascript
const replicas = [
  env.DB_REPLICA_SERVER_1,
  env.DB_REPLICA_SERVER_2,
  env.DB_REPLICA_SERVER_3
];

let currentReplica = 0;

function getReplicaServer() {
  const server = replicas[currentReplica];
  currentReplica = (currentReplica + 1) % replicas.length;
  return server;
}
```

### Connection Pooling
Configure appropriate pool sizes:
- Primary: 10-20 connections (writes are less frequent)
- Replicas: 20-50 connections each (reads are more frequent)

## Monitoring Read Replicas

### Azure Portal Metrics
- **Replication lag**: Time delay between primary and replica
- **CPU usage**: Monitor replica performance
- **Storage usage**: Track replica storage growth
- **Connection count**: Monitor replica connections

### AWS CloudWatch Metrics
- `ReadLag`
- `CPUUtilization`
- `DatabaseConnections`
- `FreeableMemory`

## Failover Strategy

### Automatic Failover
Azure SQL and AWS RDS support automatic failover:
- If primary fails, replica can be promoted
- Application needs retry logic
- Update connection string after failover

### Manual Failover
```sql
-- Promote replica to primary (Azure)
ALTER DATABASE [TailorERP] SET PARTNER OFFLINE;
```

## Best Practices

1. **Read-only queries only**: Never write to replicas
2. **Monitor replication lag**: Keep it under 1 second
3. **Use appropriate consistency level**: Eventual consistency is acceptable for most reads
4. **Scale replicas based on load**: Add more replicas as needed
5. **Geographic distribution**: Place replicas in different regions for global apps
6. **Cost optimization**: Use lower-tier replicas for non-critical reads
7. **Test failover**: Regularly test failover procedures
8. **Connection pooling**: Reuse connections to replicas
9. **Query optimization**: Ensure queries are optimized before scaling
10. **Index synchronization**: Ensure indexes exist on replicas

## Cost Considerations

- **Azure SQL**: Replicas cost ~50-100% of primary depending on tier
- **AWS RDS**: Replicas cost same as primary instance
- **Storage**: Additional storage costs for replicas
- **Data transfer**: Costs for data transfer between regions

## When to Use Read Replicas

**Use when:**
- High read-to-write ratio (> 10:1)
- Reporting/analytics queries
- Geographic distribution needed
- Need to scale read operations
- Want to isolate reporting workload

**Don't use when:**
- Low traffic (single instance sufficient)
- High write workload
- Real-time consistency required
- Cost constraints

## Troubleshooting

**Replication lag high:**
- Check network latency between regions
- Monitor primary database performance
- Reduce write load on primary
- Consider increasing replica tier

**Connection failures:**
- Verify replica is accessible
- Check security group/firewall rules
- Verify connection string is correct
- Check replica status in cloud console

**Data inconsistency:**
- Verify replication is working
- Check for long-running transactions
- Monitor replication lag
- Consider consistency level requirements

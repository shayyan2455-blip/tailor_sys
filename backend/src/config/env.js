const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const schema = z.object({
  DB_SERVER: z.string().min(1).default('localhost'),
  DB_NAME: z.string().min(1).default('TailorERP'),
  DB_USER: z.string().optional().default(''),
  DB_PASSWORD: z.string().optional().default(''),
  DB_PORT: z.coerce.number().int().positive().default(1433),
  DB_ENCRYPT: z.coerce.boolean().default(false),
  SESSION_SECRET: z.string().min(16),
  COOKIE_NAME: z.string().min(1).default('tailor.sid'),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),
  BACKUP_DIRECTORY: z.string().min(1).default('C:\\SqlBackups')
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid environment: ${details}`);
}

module.exports = parsed.data;

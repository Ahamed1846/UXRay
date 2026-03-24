import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { join } from 'path';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL || `file:${join(process.cwd(), 'uxray.db')}`,
  },
});
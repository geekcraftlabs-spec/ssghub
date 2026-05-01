// prisma/prisma.config.ts

import "dotenv/config";  // loads .env automatically
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",  // path to your schema

  migrations: {
    path: "prisma/migrations",     // default
  },

  datasource: {
    url: env("DATABASE_URL"),      // pooled or direct — Prisma uses this for db push / migrate / runtime
  },
});
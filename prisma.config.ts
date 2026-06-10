import { defineConfig } from "prisma/config";
import { resolve } from "path";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: `file:${resolve("./prisma/dev.db")}`,
  },
});

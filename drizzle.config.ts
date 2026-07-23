import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/6bd1bbd36102d3d7563fc392927ee45bb125373caf4916508eed67b19d1e5cac.sqlite",
  },
});

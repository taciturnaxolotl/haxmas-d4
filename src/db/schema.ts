import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"

export const snowflakes = sqliteTable("snowflakes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pattern: text("pattern").notNull(),
  size: integer("size").notNull(),
  melted: integer("melted").notNull().default(0),
  createdAt: integer("created_at").notNull(),
})

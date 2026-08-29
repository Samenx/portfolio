import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** The single, live content document served to every portfolio visitor. */
export const portfolioContent = pgTable("portfolio_content", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

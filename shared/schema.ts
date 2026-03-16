import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Room plans stored on server for sharing
export const roomPlans = pgTable("room_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  data: jsonb("data").notNull(), // full plan JSON
});

export const insertRoomPlanSchema = createInsertSchema(roomPlans).omit({
  id: true,
});

export type InsertRoomPlan = z.infer<typeof insertRoomPlanSchema>;
export type RoomPlan = typeof roomPlans.$inferSelect;

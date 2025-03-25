import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseId: text("firebase_id").unique().notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const artifacts = pgTable("artifacts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  timePeriod: text("time_period").notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const research = pgTable("research", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: integer("user_id").references(() => users.id),
  artifactId: integer("artifact_id").references(() => artifacts.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertArtifactSchema = createInsertSchema(artifacts);
export const selectArtifactSchema = createSelectSchema(artifacts);
export const insertResearchSchema = createInsertSchema(research);
export const selectResearchSchema = createSelectSchema(research);

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertArtifact = typeof artifacts.$inferInsert;
export type SelectArtifact = typeof artifacts.$inferSelect;
export type InsertResearch = typeof research.$inferInsert;
export type SelectResearch = typeof research.$inferSelect;

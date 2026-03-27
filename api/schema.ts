import { pgTable, text, serial, boolean, integer, date, timestamp } from "drizzle-orm/pg-core";

export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  useCase: text("use_case").array(),
  province: text("province").array(),
  website: text("website"),
  national: boolean("national").default(false),
  stage: text("stage").array(),
  fundingType: text("funding_type"),
  fundingMaxCad: integer("funding_max_cad"),
  status: text("status").default("unverified"),
  mentorship: boolean("mentorship"),
  cohortBased: boolean("cohort_based"),
  intakeFrequency: text("intake_frequency"),
  deadlineNotes: text("deadline_notes"),
  productionSystems: text("production_systems").array(),
  techDomains: text("tech_domains").array(),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  programName: text("program_name").notNull(),
  bestFor: text("best_for").notNull(),
  submitterName: text("submitter_name").notNull(),
  submitterEmail: text("submitter_email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

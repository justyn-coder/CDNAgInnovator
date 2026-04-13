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
  featured: boolean("featured").default(false),
  // Date fields (Part A migration)
  eventStartDate: date("event_start_date"),
  eventEndDate: date("event_end_date"),
  applicationDeadline: date("application_deadline"),
  dateVerified: boolean("date_verified").default(false),
  dateSource: text("date_source"),
  // Conference/event extension fields
  eventLocation: text("event_location"),
  eventCity: text("event_city"),
  eventFormat: text("event_format"),
  registrationUrl: text("registration_url"),
  registrationDeadline: date("registration_deadline"),
  eventCostMin: integer("event_cost_min"),
  eventCostMax: integer("event_cost_max"),
  eventCostNote: text("event_cost_note"),
  expectedAttendanceMin: integer("expected_attendance_min"),
  expectedAttendanceMax: integer("expected_attendance_max"),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  programName: text("program_name").notNull(),
  bestFor: text("best_for").notNull(),
  submitterName: text("submitter_name").notNull(),
  submitterEmail: text("submitter_email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

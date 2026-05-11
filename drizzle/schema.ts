import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users & Auth ───────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  nin: varchar("nin", { length: 30 }), // National ID Number
  ninVerified: boolean("ninVerified").default(false).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["owner", "buyer", "law_enforcement", "admin"]).default("owner").notNull(),
  status: mysqlEnum("status", ["active", "suspended", "banned"]).default("active").notNull(),
  planId: int("planId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Subscription Plans ──────────────────────────────────────────────────────

export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(), // FREE, PREMIUM, BUSINESS
  name: varchar("name", { length: 64 }).notNull(),
  priceUgx: int("priceUgx").default(0).notNull(),
  billingPeriod: mysqlEnum("billingPeriod", ["monthly", "yearly", "once"]).default("yearly").notNull(),
  assetLimit: int("assetLimit").default(2).notNull(),
  userLimit: int("userLimit").default(1).notNull(),
  features: json("features").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;

// ─── Assets ──────────────────────────────────────────────────────────────────

export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  parentId: int("parentId"), // for child parts
  category: mysqlEnum("category", [
    "smartphone", "laptop", "tablet", "vehicle", "motorcycle",
    "bicycle", "camera", "television", "generator", "refrigerator",
    "washing_machine", "audio_system", "printer", "projector",
    "power_tools", "solar_system", "agri_equipment", "medical_equipment",
    "high_value_item", "other_electronics", "desktop", "other"
  ]).notNull(),
  partType: varchar("partType", { length: 64 }), // e.g. 'engine', 'battery', 'screen' — null for top-level assets
  partLabel: varchar("partLabel", { length: 256 }), // display label for the part
  vin: varchar("vin", { length: 64 }), // Vehicle Identification Number / Chassis Number
  plateNumber: varchar("plateNumber", { length: 32 }), // Vehicle plate number
  yearOfManufacture: int("yearOfManufacture"),
  label: varchar("label", { length: 256 }).notNull(),
  make: varchar("make", { length: 128 }),
  model: varchar("model", { length: 128 }),
  color: varchar("color", { length: 64 }),
  serialNumber: varchar("serialNumber", { length: 256 }),
  imei: varchar("imei", { length: 20 }),
  qrPublicId: varchar("qrPublicId", { length: 64 }).unique(),
  qrSecretHash: varchar("qrSecretHash", { length: 128 }),
  status: mysqlEnum("status", ["active", "stolen", "pending", "retired", "disputed"]).default("active").notNull(),
  proofFileKey: text("proofFileKey"),
  proofFileSha256: varchar("proofFileSha256", { length: 64 }),
  metadata: json("metadata").$type<Record<string, string>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;

// ─── Ownership Intervals ─────────────────────────────────────────────────────

export const ownershipIntervals = mysqlTable("ownership_intervals", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull(),
  ownerUserId: int("ownerUserId").notNull(),
  acquiredAt: timestamp("acquiredAt").defaultNow().notNull(),
  releasedAt: timestamp("releasedAt"),
  acquisitionMethod: mysqlEnum("acquisitionMethod", ["purchase", "gift", "manufacture", "transfer", "other"]).default("purchase").notNull(),
  isCurrent: boolean("isCurrent").default(true).notNull(),
  evidenceFileKey: text("evidenceFileKey"),
  evidenceFileSha256: varchar("evidenceFileSha256", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OwnershipInterval = typeof ownershipIntervals.$inferSelect;

// ─── Transfer Events ──────────────────────────────────────────────────────────

export const transferEvents = mysqlTable("transfer_events", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull(),
  fromOwnerUserId: int("fromOwnerUserId").notNull(),
  toOwnerUserId: int("toOwnerUserId"),
  toUserNin: varchar("toUserNin", { length: 30 }),
  initiatedByUserId: int("initiatedByUserId").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "rejected", "cancelled"]).default("pending").notNull(),
  completedAt: timestamp("completedAt"),
  transferType: mysqlEnum("transferType", ["sale", "gift", "inheritance", "other"]).default("sale").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TransferEvent = typeof transferEvents.$inferSelect;

// ─── Verification Requests ────────────────────────────────────────────────────

export const verificationRequests = mysqlTable("verification_requests", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull(),
  ownerUserId: int("ownerUserId").notNull(),
  buyerUserId: int("buyerUserId"),
  scanChannel: mysqlEnum("scanChannel", ["qr", "imei", "serial", "manual"]).default("qr").notNull(),
  scanToken: varchar("scanToken", { length: 128 }),
  scannerRisk: mysqlEnum("scannerRisk", ["normal", "high_velocity", "blocked"]).default("normal").notNull(),
  geoBucket: varchar("geoBucket", { length: 32 }),
  requestStatus: mysqlEnum("requestStatus", ["created", "delivered", "approved", "rejected", "expired", "cancelled"]).default("created").notNull(),
  resultCode: mysqlEnum("resultCode", ["CLEAN", "STOLEN", "PENDING", "UNVERIFIED"]),
  receiptPayload: json("receiptPayload").$type<Record<string, unknown>>(),
  receiptSha256: varchar("receiptSha256", { length: 64 }),
  expiresAt: timestamp("expiresAt"),
  decidedAt: timestamp("decidedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VerificationRequest = typeof verificationRequests.$inferSelect;

// ─── Stolen Reports ───────────────────────────────────────────────────────────

export const stolenReports = mysqlTable("stolen_reports", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("assetId").notNull(),
  reporterUserId: int("reporterUserId").notNull(),
  reportBasis: mysqlEnum("reportBasis", ["police_report", "witness_signatures", "self_report"]).default("police_report").notNull(),
  policeCaseNumber: varchar("policeCaseNumber", { length: 64 }),
  upfCaseNumber: varchar("upfCaseNumber", { length: 64 }),
  uccBlacklistStatus: mysqlEnum("uccBlacklistStatus", ["not_submitted", "processing", "blacklisted", "failed"]).default("not_submitted").notNull(),
  status: mysqlEnum("status", ["draft", "submitted", "verified", "active", "resolved", "revoked", "disputed"]).default("draft").notNull(),
  lastKnownLat: decimal("lastKnownLat", { precision: 10, scale: 7 }),
  lastKnownLng: decimal("lastKnownLng", { precision: 10, scale: 7 }),
  lastKnownAt: timestamp("lastKnownAt"),
  description: text("description"),
  submittedAt: timestamp("submittedAt"),
  activatedAt: timestamp("activatedAt"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StolenReport = typeof stolenReports.$inferSelect;

// ─── Stolen Evidence Files ────────────────────────────────────────────────────

export const stolenEvidenceFiles = mysqlTable("stolen_evidence_files", {
  id: int("id").autoincrement().primaryKey(),
  stolenReportId: int("stolenReportId").notNull(),
  fileKey: text("fileKey").notNull(),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }),
  originalName: varchar("originalName", { length: 256 }),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type StolenEvidenceFile = typeof stolenEvidenceFiles.$inferSelect;

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "scan_alert", "stolen_alert", "verification_request",
    "transfer_request", "transfer_confirmed", "report_activated",
    "report_resolved", "system"
  ]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  body: text("body").notNull(),
  data: json("data").$type<Record<string, unknown>>(),
  isRead: boolean("isRead").default(false).notNull(),
  channel: mysqlEnum("channel", ["push", "sms", "email", "in_app"]).default("in_app").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ─── Law Enforcement ──────────────────────────────────────────────────────────

export const lawEnforcementProfiles = mysqlTable("law_enforcement_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  badgeId: varchar("badgeId", { length: 64 }).notNull(),
  agency: varchar("agency", { length: 128 }).default("Uganda Police Force").notNull(),
  jurisdiction: varchar("jurisdiction", { length: 128 }),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LawEnforcementProfile = typeof lawEnforcementProfiles.$inferSelect;

export const warrantRecords = mysqlTable("warrant_records", {
  id: int("id").autoincrement().primaryKey(),
  officerUserId: int("officerUserId").notNull(),
  warrantNumber: varchar("warrantNumber", { length: 64 }).notNull(),
  warrantType: mysqlEnum("warrantType", ["asset_lookup", "identity_subpoena", "evidence_export"]).notNull(),
  targetRef: varchar("targetRef", { length: 256 }),
  status: mysqlEnum("status", ["pending", "approved", "executed", "expired"]).default("pending").notNull(),
  issuedAt: timestamp("issuedAt"),
  expiresAt: timestamp("expiresAt"),
  scope: json("scope").$type<Record<string, unknown>>(),
  caseLog: json("caseLog").$type<Array<{ timestamp: string; action: string; detail: string }>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WarrantRecord = typeof warrantRecords.$inferSelect;

// ─── Fraud Events ─────────────────────────────────────────────────────────────

export const fraudEvents = mysqlTable("fraud_events", {
  id: int("id").autoincrement().primaryKey(),
  subjectType: mysqlEnum("subjectType", ["user", "asset", "scan"]).notNull(),
  subjectId: int("subjectId").notNull(),
  flagType: varchar("flagType", { length: 64 }).notNull(),
  riskScore: int("riskScore").default(0).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["open", "reviewed", "dismissed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FraudEvent = typeof fraudEvents.$inferSelect;

// ─── Payments ────────────────────────────────────────────────────────────────

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planCode: varchar("planCode", { length: 32 }).notNull(), // FREE, PREMIUM, BUSINESS
  amountUgx: int("amountUgx").notNull(),
  currency: varchar("currency", { length: 8 }).default("UGX").notNull(),
  txRef: varchar("txRef", { length: 128 }).notNull().unique(), // our unique reference
  flwRef: varchar("flwRef", { length: 128 }), // Flutterwave reference
  flwTransactionId: varchar("flwTransactionId", { length: 64 }), // Flutterwave transaction ID
  provider: mysqlEnum("provider", ["MTN", "AIRTEL", "CARD", "MANUAL"]).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "successful", "failed", "cancelled"]).default("pending").notNull(),
  redirectUrl: text("redirectUrl"), // Flutterwave redirect URL for USSD authorization
  webhookPayload: json("webhookPayload").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // one active subscription per user
  planCode: varchar("planCode", { length: 32 }).notNull().default("FREE"),
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // null = never expires (FREE plan)
  lastPaymentId: int("lastPaymentId"),
  assetLimit: int("assetLimit").default(2).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;


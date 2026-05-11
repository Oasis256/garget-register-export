import { and, desc, eq, isNull, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  InsertPayment,
  assets,
  fraudEvents,
  lawEnforcementProfiles,
  notifications,
  ownershipIntervals,
  payments,
  plans,
  stolenEvidenceFiles,
  stolenReports,
  subscriptions,
  transferEvents,
  users,
  verificationRequests,
  warrantRecords,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserProfile(userId: number, data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ─── Plans ───────────────────────────────────────────────────────────────────

export async function getPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(plans);
}

// ─── Assets ──────────────────────────────────────────────────────────────────

export async function createAsset(data: {
  ownerId: number;
  parentId?: number | null;
  category: "smartphone" | "laptop" | "tablet" | "vehicle" | "motorcycle" | "bicycle" | "camera" | "television" | "generator" | "refrigerator" | "washing_machine" | "audio_system" | "printer" | "projector" | "power_tools" | "solar_system" | "agri_equipment" | "medical_equipment" | "high_value_item" | "other_electronics" | "desktop" | "other";
  partType?: string | null;
  partLabel?: string | null;
  vin?: string | null;
  plateNumber?: string | null;
  yearOfManufacture?: number | null;
  label: string;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  serialNumber?: string | null;
  imei?: string | null;
  qrPublicId: string;
  qrSecretHash: string;
  proofFileKey?: string | null;
  proofFileSha256?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(assets).values(data);
  const rows = result as unknown as Array<{ insertId: number }>;
  const insertId = rows[0]?.insertId ?? 0;

  await db.insert(ownershipIntervals).values({
    assetId: insertId,
    ownerUserId: data.ownerId,
    isCurrent: true,
    acquisitionMethod: "purchase",
  });

  return insertId;
}

export async function getAssetsByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assets).where(and(eq(assets.ownerId, ownerId), isNull(assets.parentId))).orderBy(desc(assets.createdAt));
}

export async function getAssetById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
  return result[0];
}

export async function getAssetByQrId(qrPublicId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(assets).where(eq(assets.qrPublicId, qrPublicId)).limit(1);
  return result[0];
}

export async function getAssetByImei(imei: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(assets).where(eq(assets.imei, imei)).limit(1);
  return result[0];
}

export async function getChildAssets(parentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assets).where(eq(assets.parentId, parentId));
}

export async function updateAssetStatus(assetId: number, status: "active" | "stolen" | "pending" | "retired" | "disputed") {
  const db = await getDb();
  if (!db) return;
  await db.update(assets).set({ status }).where(eq(assets.id, assetId));
}

export async function getAllAssets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assets).orderBy(desc(assets.createdAt));
}

// ─── Verification Requests ────────────────────────────────────────────────────

export async function createVerificationRequest(data: {
  assetId: number;
  ownerUserId: number;
  buyerUserId?: number | null;
  scanChannel: "qr" | "imei" | "serial" | "manual";
  scanToken?: string | null;
  scannerRisk: "normal" | "high_velocity" | "blocked";
  geoBucket?: string | null;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(verificationRequests).values(data);
  const rows = result as unknown as Array<{ insertId: number }>;
  return rows[0]?.insertId ?? 0;
}

export async function getVerificationRequestsByOwner(ownerUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(verificationRequests)
    .where(and(eq(verificationRequests.ownerUserId, ownerUserId), eq(verificationRequests.requestStatus, "created")))
    .orderBy(desc(verificationRequests.createdAt));
}

export async function updateVerificationRequest(id: number, data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return;
  await db.update(verificationRequests).set(data).where(eq(verificationRequests.id, id));
}

export async function getVerificationRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(verificationRequests).where(eq(verificationRequests.id, id)).limit(1);
  return result[0];
}

export async function getVerificationsByBuyer(buyerUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(verificationRequests).where(eq(verificationRequests.buyerUserId, buyerUserId)).orderBy(desc(verificationRequests.createdAt));
}

// ─── Stolen Reports ───────────────────────────────────────────────────────────

export async function createStolenReport(data: {
  assetId: number;
  reporterUserId: number;
  reportBasis: "police_report" | "witness_signatures" | "self_report";
  policeCaseNumber?: string | null;
  description?: string | null;
  lastKnownLat?: string | null;
  lastKnownLng?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(stolenReports).values({
    ...data,
    status: "submitted",
    submittedAt: new Date(),
  });
  const rows = result as unknown as Array<{ insertId: number }>;
  const insertId = rows[0]?.insertId ?? 0;
  await updateAssetStatus(data.assetId, "stolen");
  return insertId;
}

export async function getStolenReportsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stolenReports).where(eq(stolenReports.reporterUserId, userId)).orderBy(desc(stolenReports.createdAt));
}

export async function getStolenReportByAsset(assetId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(stolenReports)
    .where(and(eq(stolenReports.assetId, assetId), or(eq(stolenReports.status, "active"), eq(stolenReports.status, "submitted"))))
    .limit(1);
  return result[0];
}

export async function updateStolenReport(id: number, data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return;
  await db.update(stolenReports).set(data).where(eq(stolenReports.id, id));
}

export async function getAllStolenReports() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stolenReports).orderBy(desc(stolenReports.createdAt));
}

// ─── Evidence Files ───────────────────────────────────────────────────────────

export async function addEvidenceFile(data: {
  stolenReportId: number;
  fileKey: string;
  sha256: string;
  mimeType?: string | null;
  originalName?: string | null;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(stolenEvidenceFiles).values(data);
}

export async function getEvidenceFiles(stolenReportId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(stolenEvidenceFiles).where(eq(stolenEvidenceFiles.stolenReportId, stolenReportId));
}

// ─── Transfer Events ──────────────────────────────────────────────────────────

export async function createTransferEvent(data: {
  assetId: number;
  fromOwnerUserId: number;
  toUserNin: string;
  initiatedByUserId: number;
  transferType: "sale" | "gift" | "inheritance" | "other";
  notes?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(transferEvents).values(data);
  const rows = result as unknown as Array<{ insertId: number }>;
  return rows[0]?.insertId ?? 0;
}

export async function getTransfersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transferEvents)
    .where(or(eq(transferEvents.fromOwnerUserId, userId), eq(transferEvents.toOwnerUserId, userId)))
    .orderBy(desc(transferEvents.createdAt));
}

export async function updateTransferEvent(id: number, data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return;
  await db.update(transferEvents).set(data).where(eq(transferEvents.id, id));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function createNotification(data: {
  userId: number;
  type: "scan_alert" | "stolen_alert" | "verification_request" | "transfer_request" | "transfer_confirmed" | "report_activated" | "report_resolved" | "system";
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  channel?: "push" | "sms" | "email" | "in_app";
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function getNotificationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ─── Fraud Events ─────────────────────────────────────────────────────────────

export async function createFraudEvent(data: {
  subjectType: "user" | "asset" | "scan";
  subjectId: number;
  flagType: string;
  riskScore: number;
  description?: string | null;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(fraudEvents).values(data);
}

export async function getRecentFraudEvents(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fraudEvents).orderBy(desc(fraudEvents.createdAt)).limit(limit);
}

// ─── Law Enforcement ──────────────────────────────────────────────────────────

export async function createLEProfile(data: {
  userId: number;
  badgeId: string;
  agency?: string | null;
  jurisdiction?: string | null;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(lawEnforcementProfiles).values({ ...data, agency: data.agency ?? "Uganda Police Force" });
}

export async function getLEProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lawEnforcementProfiles).where(eq(lawEnforcementProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function createWarrant(data: {
  officerUserId: number;
  warrantNumber: string;
  warrantType: "asset_lookup" | "identity_subpoena" | "evidence_export";
  targetRef?: string | null;
  scope?: Record<string, unknown> | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(warrantRecords).values({
    officerUserId: data.officerUserId,
    warrantNumber: data.warrantNumber,
    warrantType: data.warrantType,
    targetRef: data.targetRef ?? null,
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  const rows = result as unknown as Array<{ insertId: number }>;
  return rows[0]?.insertId ?? 0;
}

export async function getWarrantsByOfficer(officerUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(warrantRecords).where(eq(warrantRecords.officerUserId, officerUserId)).orderBy(desc(warrantRecords.createdAt));
}

export async function updateWarrant(id: number, data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return;
  await db.update(warrantRecords).set(data).where(eq(warrantRecords.id, id));
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalAssets: 0, stolenActive: 0, verifications: 0 };

  const [allUsers, allAssets, activeStolenReports, allVerifications] = await Promise.all([
    db.select().from(users),
    db.select({ id: assets.id, category: assets.category, status: assets.status, parentId: assets.parentId }).from(assets),
    db.select().from(stolenReports).where(eq(stolenReports.status, "active")),
    db.select().from(verificationRequests),
  ]);

  // Category breakdown (top-level assets only, not parts)
  const topLevelAssets = allAssets.filter((a) => !a.parentId);
  const categoryBreakdown: Record<string, number> = {};
  for (const a of topLevelAssets) {
    categoryBreakdown[a.category] = (categoryBreakdown[a.category] ?? 0) + 1;
  }

  return {
    totalUsers: allUsers.length,
    totalAssets: topLevelAssets.length,
    totalParts: allAssets.length - topLevelAssets.length,
    stolenActive: activeStolenReports.length,
    verifications: allVerifications.length,
    categoryBreakdown,
  };
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(payments).values(data);
  const rows = result as unknown as Array<{ insertId: number }>;
  return rows[0]?.insertId ?? 0;
}

export async function updatePayment(id: number, data: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) return;
  await db.update(payments).set(data).where(eq(payments.id, id));
}

export async function getPaymentByTxRef(txRef: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments).where(eq(payments.txRef, txRef)).limit(1);
  return result[0];
}

export async function getPaymentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return result[0];
}

export async function getPaymentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt)).limit(20);
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function upsertSubscription(data: {
  userId: number;
  planCode: string;
  status: "active" | "expired" | "cancelled";
  startedAt: Date;
  expiresAt: Date | null;
  lastPaymentId: number | null;
  assetLimit: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(subscriptions).values(data).onDuplicateKeyUpdate({
    set: {
      planCode: data.planCode,
      status: data.status,
      startedAt: data.startedAt,
      expiresAt: data.expiresAt,
      lastPaymentId: data.lastPaymentId,
      assetLimit: data.assetLimit,
    },
  });
}

export async function getSubscriptionByUser(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result[0];
}

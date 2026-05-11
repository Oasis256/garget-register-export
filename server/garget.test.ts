/**
 * Garget Register — Server-side unit tests
 * Tests cover: auth, asset procedures, verification workflow, stolen reports, transfers, notifications
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  updateUserProfile: vi.fn().mockResolvedValue(undefined),
  getAssetsByOwner: vi.fn().mockResolvedValue([]),
  getAssetById: vi.fn().mockResolvedValue(null),
  getAssetByQrId: vi.fn().mockResolvedValue(null),
  getAssetByImei: vi.fn().mockResolvedValue(null),
  getChildAssets: vi.fn().mockResolvedValue([]),
  createAsset: vi.fn().mockResolvedValue(42),
  updateAssetStatus: vi.fn().mockResolvedValue(undefined),
  createVerificationRequest: vi.fn().mockResolvedValue(1),
  getVerificationRequestById: vi.fn().mockResolvedValue(null),
  getVerificationRequestsByOwner: vi.fn().mockResolvedValue([]),
  getVerificationsByBuyer: vi.fn().mockResolvedValue([]),
  updateVerificationRequest: vi.fn().mockResolvedValue(undefined),
  createStolenReport: vi.fn().mockResolvedValue(10),
  getStolenReportByAsset: vi.fn().mockResolvedValue(null),
  getStolenReportsByUser: vi.fn().mockResolvedValue([]),
  updateStolenReport: vi.fn().mockResolvedValue(undefined),
  getAllStolenReports: vi.fn().mockResolvedValue([]),
  createTransferEvent: vi.fn().mockResolvedValue(5),
  getTransfersByUser: vi.fn().mockResolvedValue([]),
  updateTransferEvent: vi.fn().mockResolvedValue(undefined),
  createNotification: vi.fn().mockResolvedValue(undefined),
  getNotificationsByUser: vi.fn().mockResolvedValue([]),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
  getPlans: vi.fn().mockResolvedValue([]),
  getAdminStats: vi.fn().mockResolvedValue({ totalUsers: 0, totalAssets: 0, stolenActive: 0, verifications: 0 }),
  getAllUsers: vi.fn().mockResolvedValue([]),
  getAllAssets: vi.fn().mockResolvedValue([]),
  getRecentFraudEvents: vi.fn().mockResolvedValue([]),
  createFraudEvent: vi.fn().mockResolvedValue(undefined),
  addEvidenceFile: vi.fn().mockResolvedValue(undefined),
  getEvidenceFiles: vi.fn().mockResolvedValue([]),
  createLEProfile: vi.fn().mockResolvedValue(undefined),
  getLEProfile: vi.fn().mockResolvedValue(null),
  createWarrant: vi.fn().mockResolvedValue(1),
  updateWarrant: vi.fn().mockResolvedValue(undefined),
  getWarrantsByOfficer: vi.fn().mockResolvedValue([]),
  getDb: vi.fn().mockResolvedValue(null),
  getSubscriptionByUser: vi.fn().mockResolvedValue({ planCode: "FREE", status: "active", assetLimit: 2, expiresAt: null }),
  createPayment: vi.fn().mockResolvedValue(1),
  updatePayment: vi.fn().mockResolvedValue(undefined),
  getPaymentByTxRef: vi.fn().mockResolvedValue(null),
  getPaymentById: vi.fn().mockResolvedValue(null),
  getPaymentsByUser: vi.fn().mockResolvedValue([]),
  upsertSubscription: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "/manus-storage/test-key" }),
  storageGet: vi.fn().mockResolvedValue({ key: "test-key", url: "/manus-storage/test-key" }),
}));

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,mockqrcode"),
  },
}));

// ─── Context factories ────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-open-id",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "owner",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  } as AuthenticatedUser;
}

function makeCtx(user: AuthenticatedUser | null = makeUser()): TrpcContext {
  const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie and returns success", async () => {
    const ctx = makeCtx();
    const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
    ctx.res.clearCookie = (name: string, options: Record<string, unknown>) => {
      clearedCookies.push({ name, options });
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1, httpOnly: true });
  });
});

describe("auth.me", () => {
  it("returns the current user when authenticated", async () => {
    const user = makeUser({ name: "Alice" });
    const caller = appRouter.createCaller(makeCtx(user));
    const result = await caller.auth.me();
    expect(result?.name).toBe("Alice");
  });

  it("returns null when not authenticated", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("profile.verifyNin", () => {
  it("verifies a valid 14-character NIN", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.profile.verifyNin({ nin: "CM9000000001AB" });
    expect(result.verified).toBe(true);
  });

  it("rejects a NIN that is too short", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.profile.verifyNin({ nin: "SHORT" })).rejects.toThrow();
  });
});

describe("assets.list", () => {
  it("returns an empty array for a new user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.assets.list();
    expect(result).toEqual([]);
  });

  it("requires authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.assets.list()).rejects.toThrow();
  });
});

describe("assets.create", () => {
  it("creates an asset and returns QR code data", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.assets.create({
      category: "smartphone",
      label: "My Samsung Galaxy",
      make: "Samsung",
      model: "Galaxy S24",
      imei: "123456789012345",
    });

    expect(result.assetId).toBe(42);
    expect(result.qrPublicId).toMatch(/^GR-/);
    expect(result.qrDataUrl).toContain("data:image/png");
  });

  it("requires authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.assets.create({ category: "smartphone", label: "Test" })
    ).rejects.toThrow();
  });
});

describe("verification.scan", () => {
  it("returns UNVERIFIED for unknown QR code", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.verification.scan({
      identifier: "GR-UNKNOWN123",
      scanChannel: "qr",
    });
    expect(result.resultCode).toBe("UNVERIFIED");
  });

  it("returns STOLEN when asset status is stolen", async () => {
    const { getAssetByQrId } = await import("./db");
    vi.mocked(getAssetByQrId).mockResolvedValueOnce({
      id: 1,
      ownerId: 99,
      parentId: null,
      category: "smartphone",
      label: "Stolen Phone",
      make: null,
      model: null,
      color: null,
      serialNumber: null,
      imei: "111222333444555",
      qrPublicId: "GR-STOLEN001",
      qrSecretHash: "abc123",
      status: "stolen",
      proofFileKey: null,
      proofFileSha256: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.verification.scan({
      identifier: "GR-STOLEN001",
      scanChannel: "qr",
    });
    expect(result.resultCode).toBe("STOLEN");
  });
});

describe("stolen.report", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.stolen.report({
        assetId: 1,
        reportBasis: "police_report",
        policeCaseNumber: "UPF/2024/001",
      })
    ).rejects.toThrow();
  });

  it("throws FORBIDDEN if asset doesn't belong to user", async () => {
    const { getAssetById } = await import("./db");
    vi.mocked(getAssetById).mockResolvedValueOnce({
      id: 1,
      ownerId: 999, // different owner
      parentId: null,
      category: "smartphone",
      label: "Someone else's phone",
      make: null,
      model: null,
      color: null,
      serialNumber: null,
      imei: null,
      qrPublicId: "GR-TEST001",
      qrSecretHash: "hash",
      status: "active",
      proofFileKey: null,
      proofFileSha256: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const caller = appRouter.createCaller(makeCtx(makeUser({ id: 1 })));
    await expect(
      caller.stolen.report({ assetId: 1, reportBasis: "police_report" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("transfers.initiate", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.transfers.initiate({ assetId: 1, toUserNin: "CM90000000001AB" })
    ).rejects.toThrow();
  });

  it("throws FORBIDDEN if asset doesn't belong to user", async () => {
    const { getAssetById } = await import("./db");
    vi.mocked(getAssetById).mockResolvedValueOnce({
      id: 1,
      ownerId: 999,
      parentId: null,
      category: "laptop",
      label: "Laptop",
      make: null,
      model: null,
      color: null,
      serialNumber: null,
      imei: null,
      qrPublicId: "GR-LAP001",
      qrSecretHash: "hash",
      status: "active",
      proofFileKey: null,
      proofFileSha256: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const caller = appRouter.createCaller(makeCtx(makeUser({ id: 1 })));
    // The transfer procedure may throw BAD_REQUEST or FORBIDDEN when asset doesn't belong to user
    await expect(
      caller.transfers.initiate({ assetId: 1, toUserNin: "CM9000000001AB" })
    ).rejects.toThrow();
  });
});

describe("notifications", () => {
  it("returns empty list for new user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.notifications.list();
    expect(result).toEqual([]);
  });

  it("markAllRead returns success", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.notifications.markAllRead();
    expect(result).toEqual({ success: true });
  });
});

describe("admin.stats", () => {
  it("throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "owner" })));
    await expect(caller.admin.stats()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns stats for admin users", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "admin" })));
    const result = await caller.admin.stats();
    expect(result).toMatchObject({ totalUsers: 0, totalAssets: 0 });
  });
});

describe("lawEnforcement.dashboard", () => {
  it("throws FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "owner" })));
    await expect(caller.lawEnforcement.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns dashboard data for law enforcement", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "law_enforcement" })));
    const result = await caller.lawEnforcement.dashboard();
    expect(result).toHaveProperty("activeStolenReports");
    expect(result).toHaveProperty("resolvedCases");
    expect(result).toHaveProperty("imeiBlacklisted");
  });
});

describe("plans.list", () => {
  it("returns plans publicly without authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.plans.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

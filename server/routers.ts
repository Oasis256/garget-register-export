import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addEvidenceFile,
  createAsset,
  createFraudEvent,
  createLEProfile,
  createNotification,
  createStolenReport,
  createTransferEvent,
  createVerificationRequest,
  createWarrant,
  getAdminStats,
  getAllAssets,
  getAllStolenReports,
  getAllUsers,
  getAssetByImei,
  getAssetByQrId,
  getAssetById,
  getAssetsByOwner,
  getChildAssets,
  getEvidenceFiles,
  getLEProfile,
  getNotificationsByUser,
  getPlans,
  getRecentFraudEvents,
  getStolenReportByAsset,
  getStolenReportsByUser,
  getTransfersByUser,
  getVerificationRequestById,
  getVerificationRequestsByOwner,
  getVerificationsByBuyer,
  getWarrantsByOfficer,
  markAllNotificationsRead,
  markNotificationRead,
  updateAssetStatus,
  updateStolenReport,
  updateTransferEvent,
  updateUserProfile,
  updateVerificationRequest,
  updateWarrant,
  createPayment,
  updatePayment,
  getPaymentByTxRef,
  getPaymentById,
  getPaymentsByUser,
  upsertSubscription,
  getSubscriptionByUser,
} from "./db";
import { storagePut, storageGet } from "./storage";
import {
  chargeUgandaMobileMoney,
  verifyByTxRef,
  verifyTransaction,
  detectNetwork,
  normalizeUgandaPhone,
  PLAN_PRICES,
} from "./flutterwave";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function generateQrPublicId(): string {
  return `GR-${nanoid(10).toUpperCase()}`;
}

// ─── External API Stubs (UPF & UCC) ──────────────────────────────────────────

async function submitUPFCrimeReport(reportData: {
  reportId: string;
  ownerName: string;
  ownerPhone: string;
  ownerNin: string;
  itemCategory: string;
  itemMake?: string;
  itemModel?: string;
  itemSerial?: string;
  itemImei?: string;
  itemColor?: string;
  lat?: string;
  lng?: string;
}) {
  // In production, POST to https://api.gargetregister.ug/v1/crime-reports
  // Simulated response for demo
  return { upfCaseNumber: `UPF-${new Date().getFullYear()}-${Math.floor(Math.random() * 99999).toString().padStart(5, "0")}`, status: "received" };
}

async function submitUCCBlacklist(imei: string, reportId: string) {
  // In production, POST to https://api.simuklear.ucc.co.ug/v1/devices/blacklist
  // Simulated response for demo
  return { status: "processing", message: `Request to blacklist device ${imei} accepted.` };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(2).optional(),
        phone: z.string().optional(),
        nin: z.string().min(14).max(14).optional(),
        role: z.enum(["owner", "buyer", "law_enforcement", "admin"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updateData: Record<string, unknown> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.phone !== undefined) updateData.phone = input.phone;
        if (input.nin !== undefined) {
          updateData.nin = input.nin;
          // Simulate NIN verification (in production, call NIRA API)
          updateData.ninVerified = input.nin.length === 14;
        }
        if (input.role !== undefined && ctx.user.role === "admin") {
          updateData.role = input.role;
        }
        await updateUserProfile(ctx.user.id, updateData);
        return { success: true };
      }),
    verifyNin: protectedProcedure
      .input(z.object({ nin: z.string().min(14).max(14) }))
      .mutation(async ({ ctx, input }) => {
        // Simulate NIRA verification
        const isValid = /^[A-Z]{2}\d{9}[A-Z]{3}$/.test(input.nin) || input.nin.length === 14;
        if (isValid) {
          await updateUserProfile(ctx.user.id, { nin: input.nin, ninVerified: true });
        }
        return { verified: isValid, nin: input.nin };
      }),
  }),

  // ── Profile ───────────────────────────────────────────────────────────────
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import('./db');
      const db = await getDb();
      if (!db) return null;
      const { users } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const result = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      return result[0] ?? null;
    }),
    update: protectedProcedure
      .input(z.object({
        name: z.string().min(2).optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updateData: Record<string, unknown> = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.phone !== undefined) updateData.phone = input.phone;
        await updateUserProfile(ctx.user.id, updateData);
        return { success: true };
      }),
    verifyNin: protectedProcedure
      .input(z.object({ nin: z.string().min(14).max(14), phone: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        // Simulate NIRA verification - in production call NIRA API
        const isValid = input.nin.length === 14;
        if (isValid) {
          const updateData: Record<string, unknown> = { nin: input.nin, ninVerified: true };
          if (input.phone) updateData.phone = input.phone;
          await updateUserProfile(ctx.user.id, updateData);
        }
        return { verified: isValid };
      }),
  }),

  // ── Plans ─────────────────────────────────────────────────────────────────
  plans: router({
    list: publicProcedure.query(async () => {
      return getPlans();
    }),
  }),

  // ── Assets ────────────────────────────────────────────────────────────────
  assets: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const myAssets = await getAssetsByOwner(ctx.user.id);
      const withChildren = await Promise.all(
        myAssets.map(async (a) => ({
          ...a,
          children: await getChildAssets(a.id),
        }))
      );
      return withChildren;
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const asset = await getAssetById(input.id);
        if (!asset) throw new TRPCError({ code: "NOT_FOUND" });
        if (asset.ownerId !== ctx.user.id && ctx.user.role !== "admin" && ctx.user.role !== "law_enforcement") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const children = await getChildAssets(asset.id);
        return { ...asset, children };
      }),

    create: protectedProcedure
      .input(z.object({
        category: z.enum([
          "smartphone", "laptop", "tablet", "vehicle", "motorcycle",
          "bicycle", "camera", "television", "generator", "refrigerator",
          "washing_machine", "audio_system", "printer", "projector",
          "power_tools", "solar_system", "agri_equipment", "medical_equipment",
          "high_value_item", "other_electronics", "desktop", "other"
        ]),
        label: z.string().min(2),
        make: z.string().optional(),
        model: z.string().optional(),
        color: z.string().optional(),
        serialNumber: z.string().optional(),
        imei: z.string().optional(),
        vin: z.string().optional(),
        plateNumber: z.string().optional(),
        yearOfManufacture: z.number().optional(),
        parentId: z.number().optional(),
        partType: z.string().optional(),
        partLabel: z.string().optional(),
        proofFileKey: z.string().optional(),
        proofFileSha256: z.string().optional(),
        // Parts to register alongside this asset
        parts: z.array(z.object({
          partType: z.string(),
          partLabel: z.string(),
          serialNumber: z.string().optional(),
          proofFileKey: z.string().optional(),
          proofFileSha256: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Enforce plan asset limits (only for top-level assets, not parts)
        if (!input.parentId) {
          const sub = await getSubscriptionByUser(ctx.user.id);
          const assetLimit = sub?.status === "active" ? (sub.assetLimit ?? 2) : 2;
          const userAssets = await getAssetsByOwner(ctx.user.id);
          const topLevelCount = userAssets.filter((a: { parentId: number | null }) => !a.parentId).length;
          if (topLevelCount >= assetLimit) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `Your ${sub?.planCode ?? "FREE"} plan allows up to ${assetLimit} registered assets. Upgrade your plan to register more.`,
            });
          }
        }

        const qrPublicId = generateQrPublicId();
        const qrSecretHash = sha256(`${qrPublicId}-${ctx.user.id}-${Date.now()}`);

        const assetId = await createAsset({
          ownerId: ctx.user.id,
          parentId: input.parentId ?? null,
          category: input.category,
          partType: input.partType ?? null,
          partLabel: input.partLabel ?? null,
          vin: input.vin ?? null,
          plateNumber: input.plateNumber ?? null,
          yearOfManufacture: input.yearOfManufacture ?? null,
          label: input.label,
          make: input.make ?? null,
          model: input.model ?? null,
          color: input.color ?? null,
          serialNumber: input.serialNumber ?? null,
          imei: input.imei ?? null,
          qrPublicId,
          qrSecretHash,
          proofFileKey: input.proofFileKey ?? null,
          proofFileSha256: input.proofFileSha256 ?? null,
        });

        // Register selected parts as child assets
        const registeredParts: Array<{ partType: string; partLabel: string; assetId: number; qrPublicId: string }> = [];
        if (input.parts && input.parts.length > 0) {
          for (const part of input.parts) {
            const partQrId = generateQrPublicId();
            const partQrHash = sha256(`${partQrId}-${ctx.user.id}-${Date.now()}-${part.partType}`);
            const partAssetId = await createAsset({
              ownerId: ctx.user.id,
              parentId: assetId,
              category: input.category,
              partType: part.partType,
              partLabel: part.partLabel,
              vin: null,
              plateNumber: null,
              yearOfManufacture: null,
              label: `${input.label} — ${part.partLabel}`,
              make: input.make ?? null,
              model: input.model ?? null,
              color: null,
              serialNumber: part.serialNumber ?? null,
              imei: null,
              qrPublicId: partQrId,
              qrSecretHash: partQrHash,
              proofFileKey: part.proofFileKey ?? null,
              proofFileSha256: part.proofFileSha256 ?? null,
            });
            registeredParts.push({ partType: part.partType, partLabel: part.partLabel, assetId: partAssetId, qrPublicId: partQrId });
          }
        }

        // Generate QR code image
        const qrDataUrl = await QRCode.toDataURL(`gargetregister://verify/${qrPublicId}`, {
          errorCorrectionLevel: "H",
          margin: 2,
          width: 300,
        });

        return { assetId, qrPublicId, qrDataUrl };
      }),

    generateQr: protectedProcedure
      .input(z.object({ assetId: z.number() }))
      .query(async ({ ctx, input }) => {
        const asset = await getAssetById(input.assetId);
        if (!asset || asset.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

        const qrDataUrl = await QRCode.toDataURL(`gargetregister://verify/${asset.qrPublicId}`, {
          errorCorrectionLevel: "H",
          margin: 2,
          width: 300,
        });

        return { qrPublicId: asset.qrPublicId, qrDataUrl };
      }),

    markStolen: protectedProcedure
      .input(z.object({ assetId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const asset = await getAssetById(input.assetId);
        if (!asset || asset.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await updateAssetStatus(input.assetId, "stolen");
        await createNotification({
          userId: ctx.user.id,
          type: "report_activated",
          title: "Asset Marked as Stolen",
          body: `Your asset "${asset.label}" has been marked as stolen.`,
          channel: "in_app",
        });
        return { success: true };
      }),

    uploadProof: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileBase64: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const hash = sha256(input.fileBase64);
        const key = `proof/${ctx.user.id}/${nanoid()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { fileKey: key, sha256: hash, url };
      }),
  }),

  // ── Verification ──────────────────────────────────────────────────────────
  verification: router({
    scan: publicProcedure
      .input(z.object({
        identifier: z.string(),
        scanChannel: z.enum(["qr", "imei", "serial", "manual"]).default("qr"),
        buyerUserId: z.number().optional(),
        geoBucket: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        let asset = null;

        if (input.scanChannel === "qr") {
          asset = await getAssetByQrId(input.identifier);
        } else if (input.scanChannel === "imei") {
          asset = await getAssetByImei(input.identifier);
        }

        if (!asset) {
          return { resultCode: "UNVERIFIED" as const, message: "Asset not found in registry." };
        }

        // Check effective status (propagate stolen from parent)
        let effectiveStatus = asset.status;
        if (asset.parentId) {
          const parent = await getAssetById(asset.parentId);
          if (parent?.status === "stolen") effectiveStatus = "stolen";
        }

        if (effectiveStatus === "stolen") {
          // Notify owner of scan on stolen asset
          await createNotification({
            userId: asset.ownerId,
            type: "stolen_alert",
            title: "Stolen Asset Scanned!",
            body: `Someone scanned your stolen asset "${asset.label}". Location data logged.`,
            channel: "in_app",
          });
          return { resultCode: "STOLEN" as const, assetId: asset.id, label: asset.label };
        }

        if (effectiveStatus === "pending" || effectiveStatus === "disputed") {
          return { resultCode: "PENDING" as const, assetId: asset.id, label: asset.label };
        }

        // Create verification request
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
        const reqId = await createVerificationRequest({
          assetId: asset.id,
          ownerUserId: asset.ownerId,
          buyerUserId: input.buyerUserId ?? null,
          scanChannel: input.scanChannel,
          scannerRisk: "normal",
          geoBucket: input.geoBucket ?? null,
          expiresAt,
        });

        // Notify owner
        await createNotification({
          userId: asset.ownerId,
          type: "verification_request",
          title: "Ownership Verification Requested",
          body: `Someone wants to verify ownership of "${asset.label}". Approve or reject within 5 minutes.`,
          data: { verificationRequestId: reqId, assetId: asset.id },
          channel: "in_app",
        });

        return {
          resultCode: "PENDING" as const,
          verificationRequestId: reqId,
          assetId: asset.id,
          label: asset.label,
          message: "Verification request sent to owner. Awaiting approval.",
        };
      }),

    respond: protectedProcedure
      .input(z.object({
        verificationRequestId: z.number(),
        decision: z.enum(["approved", "rejected"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const req = await getVerificationRequestById(input.verificationRequestId);
        if (!req) throw new TRPCError({ code: "NOT_FOUND" });
        if (req.ownerUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

        const resultCode = input.decision === "approved" ? "CLEAN" : "UNVERIFIED";
        const receiptPayload = {
          receipt_id: `RCP-${nanoid(8).toUpperCase()}`,
          asset_id: req.assetId,
          result_code: resultCode,
          decided_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        };
        const receiptSha256 = sha256(JSON.stringify(receiptPayload));

        await updateVerificationRequest(input.verificationRequestId, {
          requestStatus: input.decision,
          resultCode,
          decidedAt: new Date(),
          receiptPayload,
          receiptSha256,
        });

        return { resultCode, receiptPayload, receiptSha256 };
      }),

    getResult: publicProcedure
      .input(z.object({ verificationRequestId: z.number() }))
      .query(async ({ input }) => {
        const req = await getVerificationRequestById(input.verificationRequestId);
        if (!req) return { resultCode: "UNVERIFIED" as const };
        return {
          resultCode: req.resultCode ?? "UNVERIFIED",
          requestStatus: req.requestStatus,
          receiptPayload: req.receiptPayload,
          receiptSha256: req.receiptSha256,
        };
      }),

    pendingForOwner: protectedProcedure.query(async ({ ctx }) => {
      return getVerificationRequestsByOwner(ctx.user.id);
    }),

    myHistory: protectedProcedure.query(async ({ ctx }) => {
      return getVerificationsByBuyer(ctx.user.id);
    }),
  }),

  // ── Stolen Reports ────────────────────────────────────────────────────────
  stolen: router({
    report: protectedProcedure
      .input(z.object({
        assetId: z.number(),
        reportBasis: z.enum(["police_report", "witness_signatures", "self_report"]),
        policeCaseNumber: z.string().optional(),
        description: z.string().optional(),
        lastKnownLat: z.string().optional(),
        lastKnownLng: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const asset = await getAssetById(input.assetId);
        if (!asset || asset.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

        const reportId = `GR-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;
        const stolenReportId = await createStolenReport({
          assetId: input.assetId,
          reporterUserId: ctx.user.id,
          reportBasis: input.reportBasis,
          policeCaseNumber: input.policeCaseNumber ?? null,
          description: input.description ?? null,
          lastKnownLat: input.lastKnownLat ?? null,
          lastKnownLng: input.lastKnownLng ?? null,
        });

        // Submit to UPF
        const upfResult = await submitUPFCrimeReport({
          reportId,
          ownerName: ctx.user.name ?? "Unknown",
          ownerPhone: ctx.user.phone ?? "",
          ownerNin: ctx.user.nin ?? "",
          itemCategory: asset.category,
          itemMake: asset.make ?? undefined,
          itemModel: asset.model ?? undefined,
          itemSerial: asset.serialNumber ?? undefined,
          itemImei: asset.imei ?? undefined,
          itemColor: asset.color ?? undefined,
          lat: input.lastKnownLat,
          lng: input.lastKnownLng,
        });

        await updateStolenReport(stolenReportId, {
          upfCaseNumber: upfResult.upfCaseNumber,
          status: "active",
          activatedAt: new Date(),
        });

        // Submit IMEI to UCC blacklist if applicable
        let uccStatus = "not_submitted";
        if (asset.imei) {
          await submitUCCBlacklist(asset.imei, reportId);
          uccStatus = "processing";
          await updateStolenReport(stolenReportId, { uccBlacklistStatus: "processing" });
        }

        await createNotification({
          userId: ctx.user.id,
          type: "report_activated",
          title: "Stolen Report Activated",
          body: `Report for "${asset.label}" is now active. UPF case: ${upfResult.upfCaseNumber}`,
          data: { stolenReportId, upfCaseNumber: upfResult.upfCaseNumber },
          channel: "in_app",
        });

        return {
          stolenReportId,
          reportId,
          upfCaseNumber: upfResult.upfCaseNumber,
          uccStatus,
        };
      }),

    resolve: protectedProcedure
      .input(z.object({ stolenReportId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const report = await getStolenReportByAsset(0); // will get by id below
        // Get report directly
        const allReports = await getStolenReportsByUser(ctx.user.id);
        const targetReport = allReports.find((r) => r.id === input.stolenReportId);
        if (!targetReport) throw new TRPCError({ code: "NOT_FOUND" });

        await updateStolenReport(input.stolenReportId, {
          status: "resolved",
          resolvedAt: new Date(),
        });
        await updateAssetStatus(targetReport.assetId, "active");

        return { success: true };
      }),

    myReports: protectedProcedure.query(async ({ ctx }) => {
      return getStolenReportsByUser(ctx.user.id);
    }),

    uploadEvidence: protectedProcedure
      .input(z.object({
        stolenReportId: z.number(),
        fileName: z.string(),
        fileBase64: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const hash = sha256(input.fileBase64);
        const key = `evidence/${ctx.user.id}/${input.stolenReportId}/${nanoid()}-${input.fileName}`;
        await storagePut(key, buffer, input.mimeType);

        await addEvidenceFile({
          stolenReportId: input.stolenReportId,
          fileKey: key,
          sha256: hash,
          mimeType: input.mimeType,
          originalName: input.fileName,
        });

        return { fileKey: key, sha256: hash };
      }),

    getEvidence: protectedProcedure
      .input(z.object({ stolenReportId: z.number() }))
      .query(async ({ input }) => {
        const files = await getEvidenceFiles(input.stolenReportId);
        const withUrls = await Promise.all(
          files.map(async (f) => ({
            ...f,
            signedUrl: (await storageGet(f.fileKey)).url,
          }))
        );
        return withUrls;
      }),
  }),

  // ── Transfers ─────────────────────────────────────────────────────────────
  transfers: router({
    initiate: protectedProcedure
      .input(z.object({
        assetId: z.number(),
        toUserNin: z.string().min(14).max(14),
        transferType: z.enum(["sale", "gift", "inheritance", "other"]).default("sale"),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const asset = await getAssetById(input.assetId);
        if (!asset || asset.ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

        const transferId = await createTransferEvent({
          assetId: input.assetId,
          fromOwnerUserId: ctx.user.id,
          toUserNin: input.toUserNin,
          initiatedByUserId: ctx.user.id,
          transferType: input.transferType,
          notes: input.notes ?? null,
        });

        return { transferId };
      }),

    myTransfers: protectedProcedure.query(async ({ ctx }) => {
      return getTransfersByUser(ctx.user.id);
    }),

    confirm: protectedProcedure
      .input(z.object({ transferId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await updateTransferEvent(input.transferId, {
          status: "confirmed",
          toOwnerUserId: ctx.user.id,
          completedAt: new Date(),
        });
        return { success: true };
      }),
  }),

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getNotificationsByUser(ctx.user.id);
    }),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationRead(input.id);
        return { success: true };
      }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ── Law Enforcement ───────────────────────────────────────────────────────
  lawEnforcement: router({
    setupProfile: protectedProcedure
      .input(z.object({
        badgeId: z.string(),
        agency: z.string().optional(),
        jurisdiction: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "law_enforcement" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await createLEProfile({
          userId: ctx.user.id,
          badgeId: input.badgeId,
          agency: input.agency ?? null,
          jurisdiction: input.jurisdiction ?? null,
        });
        return { success: true };
      }),

    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return getLEProfile(ctx.user.id);
    }),

    openCase: protectedProcedure
      .input(z.object({
        warrantNumber: z.string(),
        warrantType: z.enum(["asset_lookup", "identity_subpoena", "evidence_export"]),
        targetRef: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "law_enforcement" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const warrantId = await createWarrant({
          officerUserId: ctx.user.id,
          warrantNumber: input.warrantNumber,
          warrantType: input.warrantType,
          targetRef: input.targetRef ?? null,
        });

        // Lookup asset if targetRef provided
        let assetInfo = null;
        if (input.targetRef) {
          assetInfo = await getAssetByImei(input.targetRef) ?? await getAssetByQrId(input.targetRef);
        }

        await updateWarrant(warrantId, {
          status: "approved",
          caseLog: JSON.stringify([{
            timestamp: new Date().toISOString(),
            action: "case_opened",
            detail: `Warrant ${input.warrantNumber} opened. Dual authorization required for scanner de-pseudonymization.`,
          }]),
        });

        return { warrantId, assetInfo };
      }),

    myWarrants: protectedProcedure.query(async ({ ctx }) => {
      return getWarrantsByOfficer(ctx.user.id);
    }),

    dashboard: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "law_enforcement" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const stats = await getAdminStats();
      const allStolen = await getAllStolenReports();
      const recentStolenReports = allStolen.slice(0, 10);
      return {
        activeStolenReports: allStolen.filter((r) => r.status === "active").length,
        resolvedCases: allStolen.filter((r) => r.status === "resolved").length,
        imeiBlacklisted: allStolen.filter((r) => r.uccBlacklistStatus === "blacklisted").length,
        totalVerifications: stats.verifications ?? 0,
        recentStolenReports,
      };
    }),

    searchAsset: protectedProcedure
      .input(z.object({ query: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "law_enforcement" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const q = input.query.trim();
        let asset = await getAssetByImei(q) ?? await getAssetByQrId(q);
        if (!asset) {
          // Search by serial or UPF case
          const allAssets = await getAllAssets();
          asset = allAssets.find((a) =>
            a.serialNumber?.toLowerCase() === q.toLowerCase()
          ) ?? undefined;
        }
        if (!asset) {
          return { found: false };
        }
        const stolenReport = await getStolenReportByAsset(asset.id);
        return { found: !!stolenReport, asset, stolenReport: stolenReport ?? undefined };
      }),

    exportEvidence: protectedProcedure
      .input(z.object({ warrantId: z.number(), assetId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "law_enforcement" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const asset = await getAssetById(input.assetId);
        const stolenReport = await getStolenReportByAsset(input.assetId);
        const evidenceFiles = stolenReport ? await getEvidenceFiles(stolenReport.id) : [];

        const exportPackage = {
          exportId: `EXP-${nanoid(8).toUpperCase()}`,
          warrantId: input.warrantId,
          assetId: input.assetId,
          asset,
          stolenReport,
          evidenceCount: evidenceFiles.length,
          generatedAt: new Date().toISOString(),
          sha256: sha256(JSON.stringify({ asset, stolenReport })),
        };

        return exportPackage;
      }),
  }),

  // ── Payments & Subscriptions ───────────────────────────────────────────────
  payments: router({
    // Get current user's subscription
    mySubscription: protectedProcedure.query(async ({ ctx }) => {
      const sub = await getSubscriptionByUser(ctx.user.id);
      return sub ?? {
        planCode: "FREE",
        status: "active" as const,
        assetLimit: 2,
        expiresAt: null,
        startedAt: new Date(),
      };
    }),

    // Get payment history
    myPayments: protectedProcedure.query(async ({ ctx }) => {
      return getPaymentsByUser(ctx.user.id);
    }),

    // Initiate a Mobile Money payment
    initiate: protectedProcedure
      .input(z.object({
        planCode: z.enum(["PREMIUM", "BUSINESS"]),
        phone: z.string().min(9).max(15),
        provider: z.enum(["MTN", "AIRTEL"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const plan = PLAN_PRICES[input.planCode];
        if (!plan) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid plan" });

        const phone = normalizeUgandaPhone(input.phone);
        const network = input.provider ?? detectNetwork(phone);
        const txRef = `GR-${ctx.user.id}-${Date.now()}-${nanoid(6)}`;

        // Create pending payment record
        const paymentId = await createPayment({
          userId: ctx.user.id,
          planCode: input.planCode,
          amountUgx: plan.ugx,
          currency: "UGX",
          txRef,
          provider: network,
          phone,
          status: "pending",
        });

        // Call Flutterwave
        const flwRes = await chargeUgandaMobileMoney({
          phone,
          network,
          amountUgx: plan.ugx,
          txRef,
          email: ctx.user.email ?? `user${ctx.user.id}@gargetregister.ug`,
          fullname: ctx.user.name ?? "Garget User",
          redirectUrl: `${process.env.VITE_OAUTH_PORTAL_URL ?? "https://gargetregister.ug"}/payment-callback?txRef=${txRef}`,
        });

        if (flwRes.status === "error") {
          await updatePayment(paymentId, { status: "failed" });
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: flwRes.message ?? "Payment initiation failed. Please check your phone number and try again.",
          });
        }

        // Update with Flutterwave reference
        const flwRef = flwRes.data?.flw_ref ?? flwRes.meta?.authorization?.redirect ?? null;
        await updatePayment(paymentId, {
          status: "processing",
          flwRef: flwRef ?? undefined,
          redirectUrl: flwRes.meta?.authorization?.redirect ?? flwRes.data?.redirect ?? null,
        });

        return {
          paymentId,
          txRef,
          status: flwRes.data?.status ?? "processing",
          redirectUrl: flwRes.meta?.authorization?.redirect ?? flwRes.data?.redirect ?? null,
          message: "A USSD prompt has been sent to your phone. Please approve the payment to activate your subscription.",
          network,
          amountUgx: plan.ugx,
          planName: plan.name,
        };
      }),

    // Poll / verify payment status
    verify: protectedProcedure
      .input(z.object({ txRef: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const payment = await getPaymentByTxRef(input.txRef);
        if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" });
        if (payment.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

        // Already successful
        if (payment.status === "successful") {
          const sub = await getSubscriptionByUser(ctx.user.id);
          return { status: "successful", payment, subscription: sub };
        }

        // Query Flutterwave
        const flwRes = await verifyByTxRef(input.txRef);

        if (flwRes.status === "success" && flwRes.data?.status === "successful") {
          const plan = PLAN_PRICES[payment.planCode];
          const now = new Date();
          const expiresAt = plan
            ? new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
            : null;

          await updatePayment(payment.id, {
            status: "successful",
            flwRef: flwRes.data.flw_ref,
            flwTransactionId: String(flwRes.data.id),
          });

          await upsertSubscription({
            userId: ctx.user.id,
            planCode: payment.planCode,
            status: "active",
            startedAt: now,
            expiresAt,
            lastPaymentId: payment.id,
            assetLimit: plan?.assetLimit ?? 20,
          });

          await createNotification({
            userId: ctx.user.id,
            type: "system",
            title: "Subscription Activated!",
            body: `Your ${plan?.name ?? payment.planCode} plan is now active. You can register up to ${plan?.assetLimit ?? 20} assets.`,
          });

          const sub = await getSubscriptionByUser(ctx.user.id);
          return { status: "successful", payment, subscription: sub };
        }

        if (flwRes.data?.status === "failed") {
          await updatePayment(payment.id, { status: "failed" });
          return { status: "failed", payment, subscription: null };
        }

        return { status: "pending", payment, subscription: null };
      }),

    // Get payment by ID
    getById: protectedProcedure
      .input(z.object({ paymentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const payment = await getPaymentById(input.paymentId);
        if (!payment) throw new TRPCError({ code: "NOT_FOUND" });
        if (payment.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return payment;
      }),

    // Get available plans
    plans: publicProcedure.query(() => {
      return [
        {
          code: "FREE",
          name: "Free",
          ugx: 0,
          assetLimit: 2,
          durationDays: null,
          features: ["Register up to 2 assets", "Basic QR codes", "Manual verification"],
        },
        {
          code: "PREMIUM",
          name: "Premium",
          ugx: PLAN_PRICES.PREMIUM.ugx,
          assetLimit: PLAN_PRICES.PREMIUM.assetLimit,
          durationDays: PLAN_PRICES.PREMIUM.durationDays,
          features: [
            "Register up to 20 assets",
            "Real-time verification",
            "SMS alerts",
            "UCC IMEI blacklist",
            "Priority support",
          ],
        },
        {
          code: "BUSINESS",
          name: "Business",
          ugx: PLAN_PRICES.BUSINESS.ugx,
          assetLimit: PLAN_PRICES.BUSINESS.assetLimit,
          durationDays: PLAN_PRICES.BUSINESS.durationDays,
          features: [
            "Register up to 200 assets",
            "All Premium features",
            "Bulk import via CSV",
            "UPF direct integration",
            "Dedicated account manager",
            "Custom branding",
          ],
        },
      ];
    }),
  }),

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getAdminStats();
    }),

    users: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getAllUsers();
    }),

    listUsers: protectedProcedure
      .input(z.object({ search: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const allUsers = await getAllUsers();
        if (!input.search) return allUsers;
        const q = input.search.toLowerCase();
        return allUsers.filter((u) =>
          (u.name ?? "").toLowerCase().includes(q) ||
          (u.email ?? "").toLowerCase().includes(q)
        );
      }),

    assets: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getAllAssets();
    }),

    stolenReports: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getAllStolenReports();
    }),

    fraudEvents: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return getRecentFraudEvents(50);
    }),

    updateUserRole: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["owner", "buyer", "law_enforcement", "admin"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await updateUserProfile(input.userId, { role: input.role });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

import { DashboardShell } from "@/components/DashboardShell";
import { QrScanner } from "@/components/QrScanner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import {
  QrCode, Search, CheckCircle2, XCircle, Clock, AlertTriangle,
  Shield, FileText, RefreshCw, ChevronDown, ChevronUp, Keyboard,
  Camera,
} from "lucide-react";

// ─── Result config ────────────────────────────────────────────────────────────

const RESULT_CONFIG = {
  CLEAN: {
    icon: CheckCircle2,
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    label: "CLEAN",
    message: "This asset is registered and the owner has confirmed it is not stolen. Safe to purchase.",
  },
  STOLEN: {
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-800 border-red-200",
    label: "STOLEN",
    message: "WARNING: This asset has been reported stolen. Do not purchase. Contact Uganda Police Force (999).",
  },
  PENDING: {
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    label: "PENDING",
    message: "Verification request sent to the owner. Awaiting their approval. Please wait or check back shortly.",
  },
  UNVERIFIED: {
    icon: AlertTriangle,
    color: "text-slate-700",
    bg: "bg-slate-100 border-slate-200",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    label: "UNVERIFIED",
    message: "This asset is not found in the Garget Register. Proceed with caution — ask the seller for proof of purchase.",
  },
};

// ─── Input mode tabs ──────────────────────────────────────────────────────────

type InputMode = "camera" | "type";
type ScanChannel = "qr" | "imei" | "serial" | "manual";

// ─── Component ────────────────────────────────────────────────────────────────

export default function Verify() {
  const params = useParams<{ qrId?: string }>();
  const { isAuthenticated, user } = useAuth();

  // Start in camera mode on mobile, type mode on desktop (no camera)
  const [inputMode, setInputMode] = useState<InputMode>("camera");
  const [scannerActive, setScannerActive] = useState(false);
  const [identifier, setIdentifier] = useState(params.qrId ?? "");
  const [scanChannel, setScanChannel] = useState<ScanChannel>("qr");
  const [showReceipt, setShowReceipt] = useState(false);

  const [result, setResult] = useState<{
    resultCode: "CLEAN" | "STOLEN" | "PENDING" | "UNVERIFIED";
    verificationRequestId?: number;
    assetId?: number;
    label?: string;
    message?: string;
    receiptPayload?: Record<string, unknown>;
    receiptSha256?: string;
  } | null>(null);

  // ── Mutations / queries ────────────────────────────────────────────────────

  const scanMutation = trpc.verification.scan.useMutation({
    onSuccess: (data) => {
      const typedData = data as unknown as typeof result;
      setResult(typedData);
      const rc = (data as { resultCode: string }).resultCode;
      if (rc === "STOLEN") toast.error("STOLEN ASSET DETECTED — Do not purchase!");
      else if (rc === "CLEAN") toast.success("Asset verified as CLEAN!");
      // Pause scanner after a successful decode so the result is readable
      setScannerActive(false);
    },
    onError: (err) => {
      toast.error(err.message);
      // Resume scanner on error so user can try again
      if (inputMode === "camera") setScannerActive(true);
    },
  });

  // Poll while PENDING
  const resultQuery = trpc.verification.getResult.useQuery(
    { verificationRequestId: result?.verificationRequestId ?? 0 },
    {
      enabled: result?.resultCode === "PENDING" && !!result?.verificationRequestId,
      refetchInterval: 3000,
    }
  );

  useEffect(() => {
    if (
      resultQuery.data &&
      resultQuery.data.resultCode !== "PENDING" &&
      result?.resultCode === "PENDING"
    ) {
      setResult((prev) => ({
        ...prev!,
        resultCode: resultQuery.data.resultCode as "CLEAN" | "STOLEN" | "PENDING" | "UNVERIFIED",
        receiptPayload: resultQuery.data.receiptPayload as Record<string, unknown> | undefined,
        receiptSha256: resultQuery.data.receiptSha256 ?? undefined,
      }));
      if (resultQuery.data.resultCode === "CLEAN") toast.success("Owner approved — Asset is CLEAN!");
      if (resultQuery.data.resultCode === "UNVERIFIED") toast.error("Owner rejected the verification request.");
    }
  }, [resultQuery.data]);

  // Owner pending verifications
  const pendingQuery = trpc.verification.pendingForOwner.useQuery(undefined, { enabled: isAuthenticated });
  const respondMutation = trpc.verification.respond.useMutation({
    onSuccess: (data) => {
      toast.success(`Verification ${data.resultCode === "CLEAN" ? "approved" : "rejected"}`);
      pendingQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const triggerVerification = useCallback(
    (code: string, channel: ScanChannel = scanChannel) => {
      if (!code.trim()) return;
      setResult(null);
      setShowReceipt(false);
      scanMutation.mutate({
        identifier: code.trim(),
        scanChannel: channel,
        buyerUserId: isAuthenticated ? user?.id : undefined,
      });
    },
    [scanMutation, scanChannel, isAuthenticated, user?.id]
  );

  /** Called by QrScanner when a QR code is decoded from the camera */
  const handleCameraScan = useCallback(
    (code: string) => {
      setIdentifier(code);
      triggerVerification(code, "qr");
    },
    [triggerVerification]
  );

  const handleManualVerify = () => {
    if (!identifier.trim()) {
      toast.error("Please enter an identifier to verify.");
      return;
    }
    triggerVerification(identifier.trim(), scanChannel);
  };

  // Activate scanner when switching to camera mode
  const switchToCamera = () => {
    setInputMode("camera");
    setResult(null);
    setScannerActive(true);
  };

  const switchToType = () => {
    setInputMode("type");
    setScannerActive(false);
  };

  // Auto-activate scanner when page loads in camera mode
  useEffect(() => {
    if (inputMode === "camera") setScannerActive(true);
  }, []);

  const currentResult =
    result
      ? resultQuery.data?.resultCode && result.resultCode === "PENDING"
        ? { ...result, resultCode: resultQuery.data.resultCode as "CLEAN" | "STOLEN" | "PENDING" | "UNVERIFIED" }
        : result
      : null;

  const config = currentResult ? RESULT_CONFIG[currentResult.resultCode] : null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardShell title="Verify Ownership">
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Ownership Verification</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Scan the QR label on the asset or enter its IMEI / serial number to check ownership status.
          </p>
        </div>

        {/* ── Input card ─────────────────────────────────────────────────── */}
        <Card className="border-border overflow-hidden">
          {/* Mode tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={switchToCamera}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                inputMode === "camera"
                  ? "bg-primary/5 text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Camera className="w-4 h-4" />
              Scan QR Code
            </button>
            <button
              onClick={switchToType}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                inputMode === "type"
                  ? "bg-primary/5 text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Keyboard className="w-4 h-4" />
              Type Code / IMEI
            </button>
          </div>

          <CardContent className="p-4 space-y-4">

            {/* ── Camera mode ─────────────────────────────────────────── */}
            {inputMode === "camera" && (
              <div className="space-y-4">
                <QrScanner
                  active={scannerActive && !scanMutation.isPending}
                  onScan={handleCameraScan}
                  onError={(err) => {
                    console.warn("QR scanner error:", err);
                  }}
                />

                {/* Scan again button — shown after a result */}
                {!scannerActive && currentResult && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setResult(null);
                      setIdentifier("");
                      setScannerActive(true);
                    }}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Scan Another Asset
                  </Button>
                )}

                {/* Loading state while verifying */}
                {scanMutation.isPending && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                    Verifying <span className="font-mono text-foreground">{identifier}</span>…
                  </div>
                )}
              </div>
            )}

            {/* ── Type mode ───────────────────────────────────────────── */}
            {inputMode === "type" && (
              <div className="space-y-4">
                {/* Channel selector */}
                <div className="flex gap-2 flex-wrap">
                  {(["qr", "imei", "serial", "manual"] as const).map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setScanChannel(ch)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        scanChannel === ch
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {ch === "qr" ? "QR Code ID" : ch === "imei" ? "IMEI" : ch === "serial" ? "Serial No." : "Manual"}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder={
                      scanChannel === "qr" ? "e.g. GR-ABCD1234XY" :
                      scanChannel === "imei" ? "15-digit IMEI number" :
                      scanChannel === "serial" ? "Device serial number" :
                      "Enter any identifier"
                    }
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleManualVerify()}
                    className="font-mono flex-1"
                    autoFocus
                  />
                  <Button
                    onClick={handleManualVerify}
                    disabled={scanMutation.isPending}
                    className="bg-primary hover:bg-primary/90 shrink-0"
                  >
                    {scanMutation.isPending
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <Search className="w-4 h-4" />}
                    <span className="ml-2 hidden sm:inline">Verify</span>
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* ── Verification result ─────────────────────────────────────────── */}
        {currentResult && config && (
          <Card className={`border ${config.bg}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                  <config.icon className={`w-7 h-7 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <Badge className={`text-sm font-bold border px-3 py-1 ${config.badge}`}>
                      {config.label}
                    </Badge>
                    {currentResult.label && (
                      <span className="text-sm font-medium text-foreground truncate">{currentResult.label}</span>
                    )}
                  </div>
                  <p className={`text-sm ${config.color}`}>{config.message}</p>

                  {currentResult.resultCode === "PENDING" && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-700">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Waiting for owner response… (auto-refreshing)
                    </div>
                  )}

                  {(currentResult.receiptPayload || currentResult.receiptSha256) && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowReceipt(!showReceipt)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        Signed Receipt
                        {showReceipt ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {showReceipt && (
                        <div className="mt-2 p-3 bg-white/60 rounded-lg border border-white text-xs font-mono space-y-1">
                          {currentResult.receiptPayload &&
                            Object.entries(currentResult.receiptPayload).map(([k, v]) => (
                              <div key={k}>
                                <span className="text-muted-foreground">{k}:</span>{" "}
                                <span className="text-foreground">{String(v)}</span>
                              </div>
                            ))}
                          {currentResult.receiptSha256 && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <span className="text-muted-foreground">SHA-256:</span>
                              <span className="text-foreground break-all ml-1">{currentResult.receiptSha256}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Owner: pending verification requests ───────────────────────── */}
        {isAuthenticated && (pendingQuery.data ?? []).length > 0 && (
          <Card className="border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display text-amber-800 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Pending Verification Requests
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 ml-1">
                  {(pendingQuery.data ?? []).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(pendingQuery.data ?? []).map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100 gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Asset ID #{req.assetId}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested {new Date(req.createdAt).toLocaleTimeString()} via {req.scanChannel.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => respondMutation.mutate({ verificationRequestId: req.id, decision: "approved" })}
                      disabled={respondMutation.isPending}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => respondMutation.mutate({ verificationRequestId: req.id, decision: "rejected" })}
                      disabled={respondMutation.isPending}
                    >
                      <XCircle className="w-3 h-3 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* ── How it works ───────────────────────────────────────────────── */}
        <Card className="border-border bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">How Verification Works</p>
                <p>
                  Point your camera at the QR label on the asset — or type the code manually. A real-time
                  request is sent to the registered owner, who has 5 minutes to approve or reject. A signed
                  digital receipt is generated for every verification.
                </p>
                <p className="text-primary font-medium">
                  All verification receipts are SHA-256 hashed and tamper-evident.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardShell>
  );
}

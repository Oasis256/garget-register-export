/**
 * QrScanner — camera-based QR code scanner component
 *
 * Uses html5-qrcode under the hood. Handles:
 *  - Camera permission request / denied state
 *  - Front / back camera toggle
 *  - Torch (flashlight) toggle where supported
 *  - Animated scanning overlay (corner brackets + sweep line)
 *  - Clean teardown on unmount or when `active` is set to false
 *  - No-camera fallback (desktop / permission denied)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, CameraOff, FlipHorizontal, Zap, ZapOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScannerState =
  | "idle"
  | "requesting"
  | "scanning"
  | "paused"
  | "denied"
  | "no_camera"
  | "error";

interface QrScannerProps {
  /** Called with the decoded QR string when a code is successfully read */
  onScan: (code: string) => void;
  /** Called when a camera / permission error occurs */
  onError?: (err: string) => void;
  /** Whether the scanner should be active. Set to false to stop the camera. */
  active?: boolean;
  /** Optional CSS class for the outer wrapper */
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCANNER_ID = "garget-qr-scanner-viewport";
const SCAN_FPS = 10;
const SCAN_FORMATS = [Html5QrcodeSupportedFormats.QR_CODE];

// ─── Component ────────────────────────────────────────────────────────────────

export function QrScanner({ onScan, onError, active = true, className = "" }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [state, setState] = useState<ScannerState>("idle");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [flashSuccess, setFlashSuccess] = useState(false);
  const mountedRef = useRef(true);

  // ── Teardown helper ────────────────────────────────────────────────────────
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const isRunning = scannerRef.current.isScanning;
        if (isRunning) await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore teardown errors
      }
      scannerRef.current = null;
    }
  }, []);

  // ── Start scanner ──────────────────────────────────────────────────────────
  const startScanner = useCallback(async (facing: "environment" | "user") => {
    if (!mountedRef.current) return;

    await stopScanner();

    setState("requesting");

    // Check if any camera is available
    let cameras: { id: string; label: string }[] = [];
    try {
      cameras = await Html5Qrcode.getCameras();
    } catch {
      if (mountedRef.current) setState("no_camera");
      return;
    }

    if (!cameras || cameras.length === 0) {
      if (mountedRef.current) setState("no_camera");
      return;
    }

    const scanner = new Html5Qrcode(SCANNER_ID, {
      formatsToSupport: SCAN_FORMATS,
      verbose: false,
    });
    scannerRef.current = scanner;

    const config = {
      fps: SCAN_FPS,
      qrbox: { width: 240, height: 240 },
      aspectRatio: 1.0,
      videoConstraints: {
        facingMode: { ideal: facing },
      },
    };

    try {
      await scanner.start(
        { facingMode: { ideal: facing } },
        config,
        (decodedText) => {
          if (!mountedRef.current) return;
          // Debounce: ignore duplicate scans of the same code within 2 s
          if (decodedText === lastCode) return;
          setLastCode(decodedText);
          setFlashSuccess(true);
          setTimeout(() => setFlashSuccess(false), 800);
          onScan(decodedText);
          // Reset debounce after 2 s
          setTimeout(() => setLastCode(null), 2000);
        },
        () => {
          // per-frame decode failure — normal, ignore
        }
      );

      if (!mountedRef.current) {
        await stopScanner();
        return;
      }

      setState("scanning");

      // Detect torch support by inspecting the video track capabilities
      try {
        const videoEl = document.querySelector<HTMLVideoElement>(`#${SCANNER_ID} video`);
        const stream = videoEl?.srcObject as MediaStream | null;
        const track = stream?.getVideoTracks?.()?.[0];
        const caps = track?.getCapabilities?.() as { torch?: boolean } | undefined;
        if (caps?.torch) setTorchSupported(true);
      } catch {
        // torch detection failed — that's fine
      }
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("denied")) {
        setState("denied");
      } else if (msg.toLowerCase().includes("no cameras") || msg.toLowerCase().includes("not found")) {
        setState("no_camera");
      } else {
        setState("error");
        onError?.(msg);
      }
    }
  }, [stopScanner, onScan, onError, lastCode]);

  // ── Torch toggle ──────────────────────────────────────────────────────────
  const toggleTorch = useCallback(async () => {
    if (!scannerRef.current || !torchSupported) return;
    try {
      const videoEl = document.querySelector<HTMLVideoElement>(`#${SCANNER_ID} video`);
      const stream = videoEl?.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks?.()?.[0];
      if (track) {
        await (track as MediaStreamTrack & { applyConstraints: (c: object) => Promise<void> })
          .applyConstraints({ advanced: [{ torch: !torchOn } as object] });
        setTorchOn((v) => !v);
      }
    } catch {
      // torch not supported on this device
    }
  }, [torchOn, torchSupported]);

  // ── Camera flip ───────────────────────────────────────────────────────────
  const flipCamera = useCallback(() => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startScanner(next);
  }, [facingMode, startScanner]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, [stopScanner]);

  useEffect(() => {
    if (active) {
      startScanner(facingMode);
    } else {
      stopScanner();
      setState("paused");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={`relative flex flex-col items-center gap-3 ${className}`}>

      {/* ── Camera viewport ─────────────────────────────────────────── */}
      <div className="relative w-full max-w-sm mx-auto">
        {/* The html5-qrcode library injects the <video> element here */}
        <div
          id={SCANNER_ID}
          className="w-full rounded-2xl overflow-hidden bg-black"
          style={{ minHeight: 280 }}
        />

        {/* Scanning overlay — only shown while camera is active */}
        {state === "scanning" && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Dark vignette around the scan zone */}
            <div className="absolute inset-0 rounded-2xl"
              style={{
                background: "radial-gradient(ellipse 55% 55% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
              }}
            />

            {/* Animated corner brackets */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-52 h-52">
                {/* Top-left */}
                <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#F5C518] rounded-tl-lg" />
                {/* Top-right */}
                <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#F5C518] rounded-tr-lg" />
                {/* Bottom-left */}
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#F5C518] rounded-bl-lg" />
                {/* Bottom-right */}
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#F5C518] rounded-br-lg" />

                {/* Sweep line */}
                <div
                  className="absolute left-2 right-2 h-0.5 bg-[#F5C518]/80 rounded-full shadow-[0_0_8px_2px_rgba(245,197,24,0.6)]"
                  style={{ animation: "scanSweep 2s ease-in-out infinite" }}
                />
              </div>
            </div>

            {/* Success flash */}
            {flashSuccess && (
              <div className="absolute inset-0 rounded-2xl bg-emerald-400/30 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/80 flex items-center justify-center">
                  <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── State overlays ────────────────────────────────────────── */}
        {state === "requesting" && (
          <div className="absolute inset-0 rounded-2xl bg-black/80 flex flex-col items-center justify-center gap-3 text-white">
            <Loader2 className="w-10 h-10 animate-spin text-[#F5C518]" />
            <p className="text-sm font-medium">Starting camera…</p>
          </div>
        )}

        {state === "denied" && (
          <div className="absolute inset-0 rounded-2xl bg-black/90 flex flex-col items-center justify-center gap-4 px-6 text-center text-white">
            <CameraOff className="w-12 h-12 text-red-400" />
            <div>
              <p className="font-semibold text-base">Camera access denied</p>
              <p className="text-sm text-white/70 mt-1">
                Please allow camera access in your browser settings, then tap the button below.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-[#F5C518] text-black hover:bg-[#F5C518]/90 font-semibold"
              onClick={() => startScanner(facingMode)}
            >
              <Camera className="w-4 h-4 mr-1.5" /> Try Again
            </Button>
          </div>
        )}

        {state === "no_camera" && (
          <div className="absolute inset-0 rounded-2xl bg-black/90 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
            <CameraOff className="w-12 h-12 text-slate-400" />
            <div>
              <p className="font-semibold text-base">No camera found</p>
              <p className="text-sm text-white/70 mt-1">
                Use the "Type Code" tab to enter the QR ID or IMEI manually.
              </p>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="absolute inset-0 rounded-2xl bg-black/90 flex flex-col items-center justify-center gap-4 px-6 text-center text-white">
            <CameraOff className="w-12 h-12 text-orange-400" />
            <div>
              <p className="font-semibold text-base">Camera error</p>
              <p className="text-sm text-white/70 mt-1">Could not start the camera. Please try again.</p>
            </div>
            <Button
              size="sm"
              className="bg-[#F5C518] text-black hover:bg-[#F5C518]/90 font-semibold"
              onClick={() => startScanner(facingMode)}
            >
              <Camera className="w-4 h-4 mr-1.5" /> Retry
            </Button>
          </div>
        )}
      </div>

      {/* ── Camera controls ───────────────────────────────────────────── */}
      {(state === "scanning" || state === "requesting") && (
        <div className="flex items-center gap-3">
          {/* Flip camera */}
          <button
            type="button"
            onClick={flipCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-sm text-muted-foreground transition-colors"
            title="Flip camera"
          >
            <FlipHorizontal className="w-4 h-4" />
            <span className="text-xs">Flip</span>
          </button>

          {/* Torch toggle — only shown when supported */}
          {torchSupported && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
                torchOn
                  ? "bg-[#F5C518] text-black"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
              title={torchOn ? "Turn off torch" : "Turn on torch"}
            >
              {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              <span className="text-xs">{torchOn ? "Torch On" : "Torch"}</span>
            </button>
          )}
        </div>
      )}

      {/* ── Hint text ─────────────────────────────────────────────────── */}
      {state === "scanning" && (
        <p className="text-xs text-muted-foreground text-center">
          Point the camera at the QR code on the asset label
        </p>
      )}

      {/* ── Sweep animation keyframes injected inline ─────────────────── */}
      <style>{`
        @keyframes scanSweep {
          0%   { top: 8px;  opacity: 1; }
          50%  { top: calc(100% - 8px); opacity: 1; }
          100% { top: 8px;  opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/**
 * Flutterwave Uganda Mobile Money integration helper.
 * Handles charge initiation, transaction verification, and webhook signature validation.
 */
import { ENV } from "./_core/env";

const FLW_BASE = "https://api.flutterwave.com/v3";

function headers() {
  return {
    Authorization: `Bearer ${ENV.flutterwaveSecretKey}`,
    "Content-Type": "application/json",
  };
}

// ─── Plan definitions ─────────────────────────────────────────────────────────

export const PLAN_PRICES: Record<string, { ugx: number; assetLimit: number; durationDays: number; name: string }> = {
  PREMIUM: { ugx: 10000, assetLimit: 20, durationDays: 365, name: "Premium" },
  BUSINESS: { ugx: 35000, assetLimit: 200, durationDays: 365, name: "Business" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlwChargeResponse {
  status: "success" | "error";
  message: string;
  meta?: {
    authorization?: {
      redirect?: string;
      mode?: string;
    };
  };
  data?: {
    id?: number;
    tx_ref?: string;
    flw_ref?: string;
    status?: string;
    redirect?: string;
  };
}

export interface FlwVerifyResponse {
  status: "success" | "error";
  message: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    status: "successful" | "failed" | "pending";
    amount: number;
    currency: string;
    charged_amount: number;
    payment_type: string;
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
    };
  };
}

// ─── Charge Uganda Mobile Money ───────────────────────────────────────────────

export async function chargeUgandaMobileMoney(params: {
  phone: string;
  network: "MTN" | "AIRTEL";
  amountUgx: number;
  txRef: string;
  email: string;
  fullname: string;
  redirectUrl: string;
}): Promise<FlwChargeResponse> {
  const payload = {
    phone_number: params.phone,
    network: params.network,
    amount: params.amountUgx,
    currency: "UGX",
    email: params.email,
    fullname: params.fullname,
    tx_ref: params.txRef,
    redirect_url: params.redirectUrl,
  };

  const res = await fetch(`${FLW_BASE}/charges?type=mobile_money_uganda`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });

  const json = await res.json() as FlwChargeResponse;
  return json;
}

// ─── Verify Transaction ───────────────────────────────────────────────────────

export async function verifyTransaction(flwTransactionId: string): Promise<FlwVerifyResponse> {
  const res = await fetch(`${FLW_BASE}/transactions/${flwTransactionId}/verify`, {
    headers: headers(),
  });
  const json = await res.json() as FlwVerifyResponse;
  return json;
}

// ─── Verify by tx_ref ─────────────────────────────────────────────────────────

export async function verifyByTxRef(txRef: string): Promise<FlwVerifyResponse> {
  const res = await fetch(`${FLW_BASE}/transactions?tx_ref=${encodeURIComponent(txRef)}`, {
    headers: headers(),
  });
  const json = await res.json() as { status: string; message: string; data?: FlwVerifyResponse["data"][] };

  if (json.status === "success" && json.data && json.data.length > 0) {
    return { status: "success", message: "Transaction found", data: json.data[0] };
  }
  return { status: "error", message: json.message ?? "Transaction not found" };
}

// ─── Validate Webhook Signature ───────────────────────────────────────────────

export function validateWebhookSignature(
  payload: string,
  signature: string
): boolean {
  // Flutterwave uses a secret hash for webhook verification
  // The secret hash is the same as the secret key for basic validation
  // In production, set a separate webhook secret in Flutterwave dashboard
  const webhookSecret = process.env.FLW_WEBHOOK_SECRET ?? ENV.flutterwaveSecretKey;
  return signature === webhookSecret;
}

// ─── Detect network from phone number ────────────────────────────────────────

export function detectNetwork(phone: string): "MTN" | "AIRTEL" {
  // Uganda MTN prefixes: 077, 078, 039, 031
  // Uganda Airtel prefixes: 070, 075, 074
  const cleaned = phone.replace(/\D/g, "");
  const local = cleaned.startsWith("256") ? cleaned.slice(3) : cleaned;

  if (/^(77|78|39|31)/.test(local)) return "MTN";
  if (/^(70|75|74)/.test(local)) return "AIRTEL";

  // Default to MTN (most common in Uganda)
  return "MTN";
}

// ─── Normalize phone to Uganda format ────────────────────────────────────────

export function normalizeUgandaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("256")) return `+${digits}`;
  if (digits.startsWith("0")) return `+256${digits.slice(1)}`;
  if (digits.length === 9) return `+256${digits}`;
  return `+${digits}`;
}

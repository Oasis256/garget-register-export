import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CheckCircle2,
  Crown,
  Building2,
  Smartphone,
  Loader2,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Clock,
  Shield,
  Zap,
  Users,
  Star,
  ChevronRight,
  XCircle,
} from "lucide-react";
import { getLoginUrl } from "@/const";

// ─── Plan card data ───────────────────────────────────────────────────────────

const PLAN_ICONS: Record<string, React.ReactNode> = {
  FREE: <Shield className="h-6 w-6 text-slate-400" />,
  PREMIUM: <Crown className="h-6 w-6 text-amber-500" />,
  BUSINESS: <Building2 className="h-6 w-6 text-emerald-600" />,
};

const PLAN_COLORS: Record<string, string> = {
  FREE: "border-slate-200 bg-white",
  PREMIUM: "border-amber-300 bg-amber-50 ring-2 ring-amber-300",
  BUSINESS: "border-emerald-300 bg-emerald-50",
};

const PLAN_BADGE: Record<string, { label: string; className: string } | null> = {
  FREE: null,
  PREMIUM: { label: "Most Popular", className: "bg-amber-500 text-white" },
  BUSINESS: { label: "Best Value", className: "bg-emerald-600 text-white" },
};

// ─── Network detection helper ─────────────────────────────────────────────────

function detectNetworkFromPhone(phone: string): "MTN" | "AIRTEL" | null {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("256") ? digits.slice(3) : digits.startsWith("0") ? digits.slice(1) : digits;
  if (/^(77|78|39|31)/.test(local)) return "MTN";
  if (/^(70|75|74)/.test(local)) return "AIRTEL";
  return null;
}

// ─── Payment status step ──────────────────────────────────────────────────────

type PaymentStep = "select-plan" | "enter-phone" | "awaiting-ussd" | "success" | "failed";

interface PendingPayment {
  txRef: string;
  paymentId: number;
  planName: string;
  amountUgx: number;
  network: string;
  phone: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Subscription() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [step, setStep] = useState<PaymentStep>("select-plan");
  const [selectedPlan, setSelectedPlan] = useState<"PREMIUM" | "BUSINESS" | null>(null);
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState<"MTN" | "AIRTEL" | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  const { data: plans, isLoading: plansLoading } = trpc.payments.plans.useQuery();
  const { data: subscription, refetch: refetchSub } = trpc.payments.mySubscription.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: paymentHistory } = trpc.payments.myPayments.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const initiateMutation = trpc.payments.initiate.useMutation();
  const verifyMutation = trpc.payments.verify.useMutation();

  // Auto-detect network from phone number
  const detectedNetwork = detectNetworkFromPhone(phone);

  // Poll for payment status
  const pollPaymentStatus = useCallback(async () => {
    if (!pendingPayment || isPolling) return;
    setIsPolling(true);
    try {
      const result = await verifyMutation.mutateAsync({ txRef: pendingPayment.txRef });
      if (result.status === "successful") {
        setStep("success");
        await refetchSub();
        toast.success(`🎉 ${pendingPayment.planName} plan activated!`);
      } else if (result.status === "failed") {
        setStep("failed");
        toast.error("Payment failed. Please try again.");
      } else {
        setPollCount((c) => c + 1);
      }
    } catch {
      setPollCount((c) => c + 1);
    } finally {
      setIsPolling(false);
    }
  }, [pendingPayment, isPolling, verifyMutation, refetchSub]);

  // Auto-poll every 5 seconds while awaiting USSD
  useEffect(() => {
    if (step !== "awaiting-ussd" || !pendingPayment) return;
    if (pollCount >= 24) {
      // 2 minutes timeout
      setStep("failed");
      toast.error("Payment timed out. Please try again.");
      return;
    }
    const timer = setTimeout(pollPaymentStatus, 5000);
    return () => clearTimeout(timer);
  }, [step, pendingPayment, pollCount, pollPaymentStatus]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handleInitiatePayment() {
    if (!selectedPlan || !phone) return;
    try {
      const result = await initiateMutation.mutateAsync({
        planCode: selectedPlan,
        phone,
        provider: provider ?? detectedNetwork ?? undefined,
      });
      setPendingPayment({
        txRef: result.txRef,
        paymentId: result.paymentId,
        planName: result.planName,
        amountUgx: result.amountUgx,
        network: result.network,
        phone,
      });
      setPollCount(0);
      setStep("awaiting-ussd");
      toast.info("USSD prompt sent! Check your phone.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment initiation failed";
      toast.error(msg);
    }
  }

  function handleReset() {
    setStep("select-plan");
    setSelectedPlan(null);
    setPhone("");
    setProvider(null);
    setPendingPayment(null);
    setPollCount(0);
  }

  // ─── Auth guard ─────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Shield className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Sign in to manage your subscription</p>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </DashboardShell>
    );
  }

  const currentPlan = subscription?.planCode ?? "FREE";
  const isExpired = subscription?.expiresAt && new Date(subscription.expiresAt) < new Date();

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscription</h1>
          <p className="text-muted-foreground mt-1">
            Manage your Garget Register plan and payment history
          </p>
        </div>

        {/* Current Plan Banner */}
        <Card className={`border-2 ${currentPlan === "FREE" ? "border-slate-200" : currentPlan === "PREMIUM" ? "border-amber-300 bg-amber-50/50" : "border-emerald-300 bg-emerald-50/50"}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {PLAN_ICONS[currentPlan]}
                <div>
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="text-xl font-bold text-foreground">{currentPlan}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isExpired ? (
                  <Badge variant="destructive">Expired</Badge>
                ) : (
                  <Badge className="bg-green-600 text-white">Active</Badge>
                )}
                {subscription?.expiresAt && (
                  <p className="text-sm text-muted-foreground">
                    Expires {new Date(subscription.expiresAt).toLocaleDateString("en-UG")}
                  </p>
                )}
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Asset limit</p>
                  <p className="font-semibold text-foreground">{subscription?.assetLimit ?? 2} assets</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step: Select Plan */}
        {step === "select-plan" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Choose a Plan</h2>

            {plansLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans?.map((plan) => {
                  const badge = PLAN_BADGE[plan.code];
                  const isCurrent = plan.code === currentPlan && !isExpired;
                  const isSelected = selectedPlan === plan.code;

                  return (
                    <div
                      key={plan.code}
                      className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                          : PLAN_COLORS[plan.code]
                      } ${plan.code === "FREE" ? "cursor-default opacity-80" : "hover:shadow-md"}`}
                      onClick={() => {
                        if (plan.code !== "FREE") {
                          setSelectedPlan(plan.code as "PREMIUM" | "BUSINESS");
                        }
                      }}
                    >
                      {badge && (
                        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      )}

                      <div className="flex items-center justify-between mb-3">
                        {PLAN_ICONS[plan.code]}
                        {isCurrent && (
                          <Badge className="bg-green-600 text-white text-xs">Current</Badge>
                        )}
                        {isSelected && !isCurrent && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                      <div className="mt-1 mb-4">
                        {plan.ugx === 0 ? (
                          <span className="text-2xl font-bold text-foreground">Free</span>
                        ) : (
                          <>
                            <span className="text-2xl font-bold text-foreground">
                              UGX {plan.ugx.toLocaleString()}
                            </span>
                            <span className="text-sm text-muted-foreground">/year</span>
                          </>
                        )}
                      </div>

                      <ul className="space-y-2">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      {plan.code !== "FREE" && !isCurrent && (
                        <Button
                          className="w-full mt-5"
                          variant={isSelected ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlan(plan.code as "PREMIUM" | "BUSINESS");
                          }}
                        >
                          {isSelected ? "Selected" : "Select Plan"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {selectedPlan && (
              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={() => setStep("enter-phone")}
                  className="gap-2"
                >
                  Continue to Payment
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step: Enter Phone */}
        {step === "enter-phone" && selectedPlan && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Mobile Money Payment
              </CardTitle>
              <CardDescription>
                Pay UGX {(PLAN_PRICES_CLIENT[selectedPlan] ?? 0).toLocaleString()} via MTN MoMo or Airtel Money
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Plan summary */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-3">
                  {PLAN_ICONS[selectedPlan]}
                  <div>
                    <p className="font-semibold text-foreground">{selectedPlan} Plan</p>
                    <p className="text-sm text-muted-foreground">1 year access</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground">
                  UGX {(PLAN_PRICES_CLIENT[selectedPlan] ?? 0).toLocaleString()}
                </p>
              </div>

              {/* Phone input */}
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Money Phone Number</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. 0771234567 or 0701234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-16"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                    +256
                  </span>
                </div>
                {phone && detectedNetwork && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Detected: {detectedNetwork} Uganda
                  </p>
                )}
                {phone && !detectedNetwork && phone.length >= 9 && (
                  <p className="text-sm text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Could not detect network. Please select below.
                  </p>
                )}
              </div>

              {/* Manual network override */}
              {phone && !detectedNetwork && phone.length >= 9 && (
                <div className="space-y-2">
                  <Label>Select Network</Label>
                  <div className="flex gap-3">
                    {(["MTN", "AIRTEL"] as const).map((net) => (
                      <button
                        key={net}
                        onClick={() => setProvider(net)}
                        className={`flex-1 py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                          provider === net
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {net === "MTN" ? "🟡 MTN MoMo" : "🔴 Airtel Money"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* How it works */}
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800 space-y-1">
                <p className="font-semibold">How Mobile Money payment works:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Enter your MTN or Airtel phone number above</li>
                  <li>Click "Pay Now" — a USSD prompt will appear on your phone</li>
                  <li>Approve the payment on your phone</li>
                  <li>Your subscription activates instantly</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("select-plan")} className="flex-1">
                  Back
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleInitiatePayment}
                  disabled={!phone || phone.length < 9 || initiateMutation.isPending || (!detectedNetwork && !provider)}
                >
                  {initiateMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <><CreditCard className="h-4 w-4" /> Pay Now</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Awaiting USSD */}
        {step === "awaiting-ussd" && pendingPayment && (
          <Card>
            <CardContent className="p-8 text-center space-y-6">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-amber-100 animate-ping opacity-75" />
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-amber-100">
                  <Smartphone className="h-10 w-10 text-amber-600" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-foreground">Check Your Phone</h2>
                <p className="text-muted-foreground mt-2">
                  A USSD prompt has been sent to{" "}
                  <span className="font-semibold text-foreground">{pendingPayment.phone}</span>
                  {" "}via <span className="font-semibold">{pendingPayment.network}</span>.
                </p>
                <p className="text-muted-foreground mt-1">
                  Approve the payment of{" "}
                  <span className="font-semibold text-foreground">
                    UGX {pendingPayment.amountUgx.toLocaleString()}
                  </span>{" "}
                  on your phone to activate your {pendingPayment.planName} subscription.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Waiting for confirmation... ({pollCount * 5}s)</span>
                {isPolling && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={pollPaymentStatus}
                  disabled={isPolling}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isPolling ? "animate-spin" : ""}`} />
                  Check Status
                </Button>
                <Button variant="ghost" onClick={handleReset} className="text-muted-foreground">
                  Cancel
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                The USSD prompt expires in 2 minutes. If you did not receive it, click Cancel and try again.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="p-8 text-center space-y-5">
              <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-800">Payment Successful!</h2>
                <p className="text-green-700 mt-2">
                  Your <span className="font-semibold">{pendingPayment?.planName}</span> subscription is now active.
                  You can register up to{" "}
                  <span className="font-semibold">
                    {subscription?.assetLimit ?? "20"} assets
                  </span>.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleReset} variant="outline">
                  View Plans
                </Button>
                <Button asChild>
                  <a href="/assets">Register Assets</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Failed */}
        {step === "failed" && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="p-8 text-center space-y-5">
              <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-800">Payment Failed</h2>
                <p className="text-red-700 mt-2">
                  The payment could not be completed. This may be due to insufficient balance,
                  an incorrect PIN, or a network timeout.
                </p>
              </div>
              <Button onClick={handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        {isAuthenticated && paymentHistory && paymentHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {paymentHistory.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-medium text-foreground text-sm">{p.planCode} Plan</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("en-UG")} · {p.provider} · {p.phone}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-foreground text-sm">
                        UGX {p.amountUgx.toLocaleString()}
                      </p>
                      <Badge
                        className={
                          p.status === "successful"
                            ? "bg-green-100 text-green-800"
                            : p.status === "pending" || p.status === "processing"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features comparison teaser */}
        {currentPlan === "FREE" && step === "select-plan" && (
          <Card className="bg-gradient-to-br from-primary/5 to-emerald-50 border-primary/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Zap className="h-8 w-8 text-amber-500" />
                  <p className="font-semibold text-foreground">Real-Time Alerts</p>
                  <p className="text-sm text-muted-foreground">Get SMS when your asset is scanned</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Shield className="h-8 w-8 text-primary" />
                  <p className="font-semibold text-foreground">UCC Blacklist</p>
                  <p className="text-sm text-muted-foreground">Automatic IMEI blacklisting on theft</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-8 w-8 text-emerald-600" />
                  <p className="font-semibold text-foreground">UPF Integration</p>
                  <p className="text-sm text-muted-foreground">Direct police crime report submission</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}

// Client-side plan prices (mirrors server PLAN_PRICES)
const PLAN_PRICES_CLIENT: Record<string, number> = {
  PREMIUM: 10000,
  BUSINESS: 35000,
};

import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState } from "react";
import { User, Shield, CheckCircle2, Phone, AlertTriangle, Star } from "lucide-react";

const PLAN_BADGE: Record<string, string> = {
  free: "bg-slate-100 text-slate-700 border-slate-200",
  premium: "bg-amber-100 text-amber-800 border-amber-200",
  business: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function Profile() {
  const { user } = useAuth();
  const profileQuery = trpc.profile.get.useQuery();
  const profile = profileQuery.data as (typeof profileQuery.data & { subscriptionPlan?: string; phone?: string; nin?: string; ninVerified?: boolean }) | null;

  const [ninForm, setNinForm] = useState({ nin: "", phone: "" });
  const [ninSubmitted, setNinSubmitted] = useState(false);

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => { profileQuery.refetch(); toast.success("Profile updated!"); },
    onError: (e) => toast.error(e.message),
  });

  const verifyNinMutation = trpc.profile.verifyNin.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
      setNinSubmitted(true);
      toast.success("NIN verification submitted!");
    },
    onError: (e) => toast.error(e.message),
  });

  const [editName, setEditName] = useState(user?.name ?? "");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<"owner" | "buyer" | "law_enforcement">("owner");
  type ProfileType = { subscriptionPlan?: string; phone?: string; nin?: string; ninVerified?: boolean };

  return (
    <DashboardShell title="My Profile">
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Profile & Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your account, NIN verification, and subscription plan.</p>
        </div>

        {/* Account Info */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-white">
                  {(user?.name ?? user?.email ?? "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-semibold text-foreground">{user?.name ?? "User"}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-xs border ${PLAN_BADGE[profile?.subscriptionPlan ?? "free"]}`}>
                    {profile?.subscriptionPlan ?? "Free"} Plan
                  </Badge>
                  <Badge className="text-xs bg-slate-100 text-slate-700 border-slate-200 capitalize">
                    {user?.role?.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Display Name</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input value={editPhone || profile?.phone || ""} onChange={e => setEditPhone(e.target.value)} placeholder="+256 7XX XXX XXX" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Primary Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as typeof editRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Asset Owner</SelectItem>
                  <SelectItem value="buyer">Buyer / Verifier</SelectItem>
                  <SelectItem value="law_enforcement">Law Enforcement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => updateMutation.mutate({ name: editName, phone: editPhone || undefined })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* NIN Verification */}
        <Card className={`border ${profile?.ninVerified ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-base font-display flex items-center gap-2 ${profile?.ninVerified ? "text-emerald-800" : "text-amber-800"}`}>
              <Shield className="w-4 h-4" />
              NIN Verification
              {profile?.ninVerified ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 ml-auto">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 ml-auto">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Required
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.ninVerified ? (
              <div className="space-y-2">
                <p className="text-sm text-emerald-700">Your National ID Number has been verified with NIRA.</p>
                {profile.nin && (
                  <p className="text-sm font-mono text-emerald-800">NIN: {profile.nin.substring(0, 4)}••••••••••</p>
                )}
              </div>
            ) : ninSubmitted ? (
              <div className="space-y-2">
                <p className="text-sm text-amber-700">NIN verification is being processed. This may take up to 24 hours.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-amber-700">
                  Verify your National ID Number (NIN) to unlock theft reporting, ownership transfers, and full platform access.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-amber-800">National ID Number (NIN)</Label>
                    <Input
                      placeholder="14-character NIN"
                      value={ninForm.nin}
                      onChange={e => setNinForm({ ...ninForm, nin: e.target.value })}
                      className="font-mono bg-white"
                      maxLength={14}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-amber-800">Phone Number</Label>
                    <Input
                      placeholder="+256 7XX XXX XXX"
                      value={ninForm.phone}
                      onChange={e => setNinForm({ ...ninForm, phone: e.target.value })}
                      className="bg-white"
                    />
                  </div>
                </div>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => verifyNinMutation.mutate({ nin: ninForm.nin, phone: ninForm.phone })}
                  disabled={verifyNinMutation.isPending || !ninForm.nin || !ninForm.phone}
                >
                  {verifyNinMutation.isPending ? "Submitting…" : "Submit NIN for Verification"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Plan */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Subscription Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { plan: "free", label: "Free", price: "UGX 0/mo", features: ["5 assets", "Basic verification", "QR codes"] },
                { plan: "premium", label: "Premium", price: "UGX 15,000/mo", features: ["50 assets", "Priority support", "SMS alerts", "Transfer history"] },
                { plan: "business", label: "Business", price: "UGX 50,000/mo", features: ["Unlimited assets", "API access", "Bulk registration", "Analytics"] },
              ].map(({ plan, label, price, features }) => (
                <div key={plan} className={`p-4 rounded-xl border-2 transition-all ${profile?.subscriptionPlan === plan ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-bold text-foreground">{label}</span>
                    {profile?.subscriptionPlan === plan && <Badge className="bg-primary text-white text-xs">Current</Badge>}
                  </div>
                  <div className="text-sm font-semibold text-primary mb-3">{price}</div>
                  <ul className="space-y-1">
                    {features.map(f => (
                      <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  {profile?.subscriptionPlan !== plan && (
                    <Button size="sm" variant="outline" className="w-full mt-3 text-xs" onClick={() => toast.info("Billing integration coming soon!")}>
                      Upgrade
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

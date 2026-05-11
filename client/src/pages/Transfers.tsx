import { DashboardShell } from "@/components/DashboardShell";
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
import { ArrowLeftRight, CheckCircle2, Clock, XCircle } from "lucide-react";

export default function Transfers() {
  const [form, setForm] = useState({ assetId: "", toUserNin: "", transferType: "sale" as "sale"|"gift"|"inheritance"|"other", notes: "" });
  const assetsQuery = trpc.assets.list.useQuery();
  const transfersQuery = trpc.transfers.myTransfers.useQuery();
  const initMutation = trpc.transfers.initiate.useMutation({
    onSuccess: () => { toast.success("Transfer initiated!"); transfersQuery.refetch(); setForm({ assetId: "", toUserNin: "", transferType: "sale", notes: "" }); },
    onError: (e) => toast.error(e.message),
  });

  const STATUS_BADGE: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    cancelled: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <DashboardShell title="Ownership Transfers">
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Transfer Asset Ownership</h2>
          <p className="text-sm text-muted-foreground mt-1">Transfer ownership to another verified Ugandan citizen using their NIN.</p>
        </div>
        <Card className="border-border">
          <CardHeader className="pb-3"><CardTitle className="text-base font-display flex items-center gap-2"><ArrowLeftRight className="w-4 h-4 text-primary" /> Initiate Transfer</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Asset to Transfer</Label>
              <Select value={form.assetId} onValueChange={(v) => setForm({ ...form, assetId: v })}>
                <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                <SelectContent>
                  {(assetsQuery.data ?? []).filter(a => a.status === "active").map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Recipient NIN (National ID Number)</Label>
              <Input placeholder="14-character NIN" value={form.toUserNin} onChange={e => setForm({ ...form, toUserNin: e.target.value })} className="font-mono" maxLength={14} />
            </div>
            <div className="space-y-1.5">
              <Label>Transfer Type</Label>
              <Select value={form.transferType} onValueChange={(v) => setForm({ ...form, transferType: v as typeof form.transferType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="gift">Gift</SelectItem>
                  <SelectItem value="inheritance">Inheritance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input placeholder="e.g. Sold at UGX 500,000" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90" disabled={initMutation.isPending}
              onClick={() => initMutation.mutate({ assetId: parseInt(form.assetId), toUserNin: form.toUserNin, transferType: form.transferType, notes: form.notes || undefined })}>
              {initMutation.isPending ? "Initiating…" : "Initiate Transfer"}
            </Button>
          </CardContent>
        </Card>

        {(transfersQuery.data ?? []).length > 0 && (
          <div className="space-y-3">
            <Separator />
            <h3 className="font-display font-semibold text-foreground">Transfer History</h3>
            {(transfersQuery.data ?? []).map(t => (
              <Card key={t.id} className="border-border">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">Asset #{t.assetId}</span>
                      <Badge className={`text-xs border ${STATUS_BADGE[t.status] ?? STATUS_BADGE.pending}`}>{t.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{t.transferType} · {new Date(t.createdAt).toLocaleDateString()}</p>
                    {t.toUserNin && <p className="text-xs text-muted-foreground font-mono">To NIN: {t.toUserNin}</p>}
                  </div>
                  {t.status === "pending" && t.toOwnerUserId === null && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs"><Clock className="w-3 h-3 mr-1" />Awaiting</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

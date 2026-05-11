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
import { useState, useRef } from "react";
import {
  AlertTriangle, CheckCircle2, Shield, Upload, Hash,
  FileText, MapPin, Paperclip, X, Layers, Package,
} from "lucide-react";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function sha256Browser(base64: string): Promise<string> {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  submitted: "bg-blue-100 text-blue-800 border-blue-200",
  active: "bg-red-100 text-red-800 border-red-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  revoked: "bg-slate-100 text-slate-700 border-slate-200",
};

type ChildPart = {
  id: number;
  label: string;
  partLabel?: string | null;
  partType?: string | null;
  serialNumber?: string | null;
  status: string;
};

export default function StolenReport() {
  const [form, setForm] = useState({
    assetId: "",
    reportBasis: "" as "police_report" | "witness_signatures" | "self_report",
    policeCaseNumber: "",
    description: "",
    lastKnownLat: "",
    lastKnownLng: "",
  });
  const [evidenceFiles, setEvidenceFiles] = useState<Array<{ file: File; hash: string }>>([]);
  const [submitted, setSubmitted] = useState<{ upfCaseNumber: string; stolenReportId: number } | null>(null);
  const [selectedPartIds, setSelectedPartIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const assetsQuery = trpc.assets.list.useQuery();
  const reportsQuery = trpc.stolen.myReports.useQuery();

  // Load children of the selected asset for part-level selection
  const assetDetailQuery = trpc.assets.getById.useQuery(
    { id: parseInt(form.assetId || "0") },
    { enabled: !!form.assetId && form.assetId !== "" }
  );
  const childParts: ChildPart[] = ((assetDetailQuery.data as { children?: ChildPart[] } | undefined)?.children ?? []);

  const reportMutation = trpc.stolen.report.useMutation({
    onSuccess: async (data) => {
      // Upload evidence files after report is created
      for (const ef of evidenceFiles) {
        try {
          const b64 = await fileToBase64(ef.file);
          await uploadEvidenceMutation.mutateAsync({
            stolenReportId: data.stolenReportId,
            fileName: ef.file.name,
            fileBase64: b64,
            mimeType: ef.file.type,
          });
        } catch {
          toast.error(`Failed to upload evidence: ${ef.file.name}`);
        }
      }
      setSubmitted({ upfCaseNumber: data.upfCaseNumber, stolenReportId: data.stolenReportId });
      reportsQuery.refetch();
      toast.success("Stolen report submitted and activated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadEvidenceMutation = trpc.stolen.uploadEvidence.useMutation();

  const resolveMutation = trpc.stolen.resolve.useMutation({
    onSuccess: () => {
      reportsQuery.refetch();
      toast.success("Report resolved. Asset marked as active again.");
    },
    onError: (err) => toast.error(err.message),
  });

  const activeAssets = (assetsQuery.data ?? []).filter((a) => a.status !== "stolen");
  const reports = reportsQuery.data ?? [];

  const handleAddEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large (max 10 MB).`); continue; }
      const b64 = await fileToBase64(file);
      const hash = await sha256Browser(b64);
      setEvidenceFiles((prev) => [...prev, { file, hash }]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeEvidence = (idx: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const togglePart = (partId: number) => {
    setSelectedPartIds((prev) =>
      prev.includes(partId) ? prev.filter((id) => id !== partId) : [...prev, partId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assetId || !form.reportBasis) {
      toast.error("Please select an asset and report basis.");
      return;
    }
    // Append selected parts to description
    const stolenPartsNote = selectedPartIds.length > 0
      ? `\n\nStolen parts: ${childParts
          .filter((p) => selectedPartIds.includes(p.id))
          .map((p) => p.partLabel ?? p.label)
          .join(", ")}`
      : "";
    const fullDescription = (form.description || "") + stolenPartsNote || undefined;

    reportMutation.mutate({
      assetId: parseInt(form.assetId),
      reportBasis: form.reportBasis,
      policeCaseNumber: form.policeCaseNumber || undefined,
      description: fullDescription,
      lastKnownLat: form.lastKnownLat || undefined,
      lastKnownLng: form.lastKnownLng || undefined,
    });
  };

  if (submitted) {
    return (
      <DashboardShell title="Report Submitted">
        <div className="p-6 max-w-lg mx-auto space-y-6">
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-display font-bold text-emerald-900 mb-2">Report Activated!</h2>
              <p className="text-emerald-700 text-sm mb-4">
                Your stolen report has been submitted to Uganda Police Force.
              </p>
              <div className="bg-white rounded-xl p-4 mb-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">UPF Case Number:</span>
                  <span className="font-mono font-bold text-foreground">{submitted.upfCaseNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Report ID:</span>
                  <span className="font-mono text-foreground">#{submitted.stolenReportId}</span>
                </div>
                {evidenceFiles.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Evidence Files:</span>
                    <span className="text-foreground">{evidenceFiles.length} uploaded</span>
                  </div>
                )}
                {selectedPartIds.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stolen Parts:</span>
                    <span className="text-foreground">{selectedPartIds.length} part(s) flagged</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5 text-xs text-emerald-700 text-left bg-emerald-100 rounded-lg p-3 mb-6">
                <p className="font-semibold">What happens next:</p>
                <p>• Asset is now flagged as STOLEN in the Garget Register</p>
                <p>• IMEI blacklisting request sent to UCC Simu Klear (if applicable)</p>
                <p>• Any future scan will show STOLEN status to the scanner</p>
                <p>• You'll receive SMS alerts if the asset is scanned</p>
              </div>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                onClick={() => {
                  setSubmitted(null);
                  setForm({ assetId: "", reportBasis: "" as typeof form.reportBasis, policeCaseNumber: "", description: "", lastKnownLat: "", lastKnownLng: "" });
                  setEvidenceFiles([]);
                  setSelectedPartIds([]);
                }}
              >
                Report Another Item
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Stolen Reports">
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Report a Stolen Asset</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Submit a theft report to activate UPF crime reporting and IMEI blacklisting.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset & Basis */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Theft Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Stolen Asset <span className="text-destructive">*</span></Label>
                <Select
                  value={form.assetId}
                  onValueChange={(v) => {
                    setForm({ ...form, assetId: v });
                    setSelectedPartIds([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose the stolen asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeAssets.length === 0 ? (
                      <SelectItem value="_none" disabled>No active assets found</SelectItem>
                    ) : (
                      activeAssets.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.label} {a.imei ? `— IMEI: ${a.imei}` : a.serialNumber ? `— S/N: ${a.serialNumber}` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Part-level selection — shown when selected asset has registered parts */}
              {form.assetId && childParts.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    Which parts were stolen?
                    <span className="text-xs font-normal text-muted-foreground">(tick all that apply)</span>
                  </Label>
                  <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
                    {childParts.map((part) => {
                      const checked = selectedPartIds.includes(part.id);
                      return (
                        <button
                          key={part.id}
                          type="button"
                          onClick={() => togglePart(part.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            checked ? "bg-red-50" : "hover:bg-muted/40"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                              checked
                                ? "bg-red-600 border-red-600"
                                : "border-border bg-background"
                            }`}
                          >
                            {checked && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <Package className={`w-4 h-4 shrink-0 ${checked ? "text-red-600" : "text-muted-foreground"}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${checked ? "text-red-700" : "text-foreground"}`}>
                              {part.partLabel ?? part.label}
                            </p>
                            {part.serialNumber && (
                              <p className="text-xs text-muted-foreground font-mono">S/N: {part.serialNumber}</p>
                            )}
                          </div>
                          {checked && (
                            <Badge className="text-xs bg-red-100 text-red-800 border-red-200 shrink-0">STOLEN</Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedPartIds.length > 0 && (
                    <p className="text-xs text-red-600 font-medium">
                      {selectedPartIds.length} part(s) will be flagged as stolen
                    </p>
                  )}
                </div>
              )}

              {form.assetId && assetDetailQuery.isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Loading parts…
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Report Basis <span className="text-destructive">*</span></Label>
                <Select value={form.reportBasis} onValueChange={(v) => setForm({ ...form, reportBasis: v as typeof form.reportBasis })}>
                  <SelectTrigger>
                    <SelectValue placeholder="How are you reporting this theft?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="police_report">Police Report (Recommended)</SelectItem>
                    <SelectItem value="witness_signatures">Witness Signatures</SelectItem>
                    <SelectItem value="self_report">Self Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.reportBasis === "police_report" && (
                <div className="space-y-1.5">
                  <Label>Police Case / CRB Number</Label>
                  <Input
                    placeholder="e.g. CRB/123/2024"
                    value={form.policeCaseNumber}
                    onChange={(e) => setForm({ ...form, policeCaseNumber: e.target.value })}
                    className="font-mono"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Description of Theft</Label>
                <textarea
                  placeholder="Describe when and how the item was stolen, any witnesses, or other relevant details…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full min-h-[90px] px-3 py-2 text-sm border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Last Known Location
                <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Latitude</Label>
                  <Input placeholder="e.g. 0.3476" value={form.lastKnownLat} onChange={(e) => setForm({ ...form, lastKnownLat: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Longitude</Label>
                  <Input placeholder="e.g. 32.5825" value={form.lastKnownLng} onChange={(e) => setForm({ ...form, lastKnownLng: e.target.value })} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Location data is shared with UPF to assist recovery efforts.</p>
            </CardContent>
          </Card>

          {/* Evidence Upload */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-primary" /> Evidence Files
                <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Attach police report, photos, receipts, or witness statements. Each file is hashed with SHA-256 for tamper-evidence.</p>
              <div
                className="border-2 border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                  onChange={handleAddEvidence}
                />
                <Upload className="w-7 h-7 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click to add evidence files</p>
                <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOC — up to 10 MB each</p>
              </div>

              {evidenceFiles.length > 0 && (
                <div className="space-y-2">
                  {evidenceFiles.map((ef, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ef.file.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Hash className="w-3 h-3 text-muted-foreground" />
                          <code className="text-xs font-mono text-muted-foreground">{ef.hash.slice(0, 24)}…</code>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEvidence(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warning */}
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 space-y-1">
                <p className="font-semibold">What this report does:</p>
                <p>• Flags asset as STOLEN in the Garget Register immediately</p>
                <p>• Submits a crime report to Uganda Police Force (UPF)</p>
                <p>• Requests IMEI blacklisting via UCC Simu Klear (phones only)</p>
                <p>• Sends SMS alert to your registered phone number</p>
                <p className="text-red-800 font-medium mt-1">Filing a false report is a criminal offence under Ugandan law.</p>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            disabled={reportMutation.isPending || uploadEvidenceMutation.isPending}
          >
            {reportMutation.isPending ? "Submitting Report…" : "Submit Stolen Report"}
          </Button>
        </form>

        {/* Existing Reports */}
        {reports.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <h3 className="font-display font-semibold text-foreground">Your Stolen Reports</h3>
            {reports.map((report) => (
              <Card key={report.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-foreground">Asset #{report.assetId}</span>
                        <Badge className={`text-xs border ${STATUS_BADGE[report.status] ?? STATUS_BADGE.submitted}`}>
                          {report.status.toUpperCase()}
                        </Badge>
                        {report.uccBlacklistStatus === "blacklisted" && (
                          <Badge className="text-xs bg-red-100 text-red-800 border-red-200">IMEI Blacklisted</Badge>
                        )}
                      </div>
                      {report.upfCaseNumber && (
                        <p className="text-xs text-muted-foreground font-mono">UPF: {report.upfCaseNumber}</p>
                      )}
                      {report.policeCaseNumber && (
                        <p className="text-xs text-muted-foreground">Police Case: {report.policeCaseNumber}</p>
                      )}
                      {report.lastKnownLat && report.lastKnownLng && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {report.lastKnownLat}, {report.lastKnownLng}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Reported {new Date(report.createdAt).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    {(report.status === "active" || report.status === "submitted") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 flex-shrink-0"
                        onClick={() => resolveMutation.mutate({ stolenReportId: report.id })}
                        disabled={resolveMutation.isPending}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Recovered
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

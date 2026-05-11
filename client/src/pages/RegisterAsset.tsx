import { DashboardShell } from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  Bike, Camera, Car, CheckCircle2, ChevronLeft, ChevronRight,
  Cpu, Gem, HeartPulse, Info, Laptop, Monitor, Music, Package,
  Printer, QrCode, Smartphone, Sun, Tablet, Thermometer, Tractor,
  Tv, Video, Wind, Wrench, Zap, Download,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import {
  CATEGORIES,
  type CategoryDefinition,
  getDefaultParts,
  getPartsForCategory,
} from "../../../shared/categoryParts";

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Car, Bike, Smartphone, Tablet, Laptop, Monitor, Tv, Zap,
  Thermometer, Wind, Camera, Music, Printer, Video, Wrench,
  Sun, Tractor, HeartPulse, Gem, Cpu, Package,
};

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Package;
  return <Icon className={className} />;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function sha256Browser(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PartEntry {
  partType: string;
  partLabel: string;
  checked: boolean;
  serialNumber: string;
  serializable: boolean;
  required: boolean;
}

type Step = "category" | "details" | "parts" | "proof" | "success";

type AssetCategory =
  | "smartphone" | "laptop" | "tablet" | "vehicle" | "motorcycle"
  | "bicycle" | "camera" | "television" | "generator" | "refrigerator"
  | "washing_machine" | "audio_system" | "printer" | "projector"
  | "power_tools" | "solar_system" | "agri_equipment" | "medical_equipment"
  | "high_value_item" | "other_electronics" | "desktop" | "other";

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterAsset() {
  const [step, setStep] = useState<Step>("category");
  const [selectedCategory, setSelectedCategory] = useState<CategoryDefinition | null>(null);
  const [form, setForm] = useState({
    label: "", make: "", model: "", color: "",
    serialNumber: "", imei: "", vin: "", plateNumber: "", yearOfManufacture: "",
  });
  const [parts, setParts] = useState<PartEntry[]>([]);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofSha256, setProofSha256] = useState("");
  const [successData, setSuccessData] = useState<{
    assetId: number;
    qrPublicId: string;
    qrDataUrl: string;
    registeredParts: Array<{ partType: string; partLabel: string; assetId: number; qrPublicId: string }>;
  } | null>(null);

  const uploadProof = trpc.assets.uploadProof.useMutation();
  const createAsset = trpc.assets.create.useMutation();

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function handleCategorySelect(cat: CategoryDefinition) {
    setSelectedCategory(cat);
    const defaults = getDefaultParts(cat.id);
    const allParts = getPartsForCategory(cat.id).map((p) => ({
      partType: p.id,
      partLabel: p.label,
      checked: defaults.includes(p.id),
      serialNumber: "",
      serializable: p.serializable,
      required: p.required ?? false,
    }));
    setParts(allParts);
    setStep("details");
  }

  function togglePart(partType: string) {
    setParts((prev) =>
      prev.map((p) => (p.partType === partType ? { ...p, checked: !p.checked } : p))
    );
  }

  function updatePartSerial(partType: string, value: string) {
    setParts((prev) =>
      prev.map((p) => (p.partType === partType ? { ...p, serialNumber: value } : p))
    );
  }

  async function handleProofFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofSha256(await sha256Browser(file));
  }

  async function handleSubmit() {
    if (!selectedCategory) return;

    let proofFileKey: string | undefined;
    let proofFileSha256: string | undefined;

    if (proofFile) {
      const base64 = await fileToBase64(proofFile);
      const uploadResult = await uploadProof.mutateAsync({
        fileName: proofFile.name,
        mimeType: proofFile.type,
        fileBase64: base64,
      });
      proofFileKey = uploadResult.fileKey;
      proofFileSha256 = proofSha256;
    }

    const checkedParts = parts.filter((p) => p.checked);

    const result = await createAsset.mutateAsync({
      category: selectedCategory.id as AssetCategory,
      label: form.label,
      make: form.make || undefined,
      model: form.model || undefined,
      color: form.color || undefined,
      serialNumber: form.serialNumber || undefined,
      imei: form.imei || undefined,
      vin: form.vin || undefined,
      plateNumber: form.plateNumber || undefined,
      yearOfManufacture: form.yearOfManufacture ? parseInt(form.yearOfManufacture) : undefined,
      proofFileKey,
      proofFileSha256,
      parts: checkedParts.map((p) => ({
        partType: p.partType,
        partLabel: p.partLabel,
        serialNumber: p.serialNumber || undefined,
      })),
    });

    setSuccessData(result as typeof successData);
    setStep("success");
  }

  // ─── STEP: Category ───────────────────────────────────────────────────────

  if (step === "category") {
    return (
      <DashboardShell title="Register Asset">
        <div className="p-6 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/assets">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </Link>
            <div>
              <h2 className="text-xl font-display font-bold">Register a New Asset</h2>
              <p className="text-sm text-muted-foreground">
                Select the type of item you want to register
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className="group flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <CategoryIcon name={cat.icon} className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium leading-tight">{cat.label}</span>
                {cat.parts.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {cat.parts.length} parts
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </DashboardShell>
    );
  }

  // ─── STEP: Details ────────────────────────────────────────────────────────

  if (step === "details" && selectedCategory) {
    return (
      <DashboardShell title="Register Asset">
        <div className="p-6 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setStep("category")}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CategoryIcon name={selectedCategory.icon} className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">Asset Details</h2>
                <p className="text-sm text-muted-foreground">{selectedCategory.label}</p>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label>
                  Asset Name / Label <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder={`e.g. My ${selectedCategory.label}`}
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Make / Brand</Label>
                  <Input
                    placeholder="e.g. Samsung, Toyota"
                    value={form.make}
                    onChange={(e) => setForm({ ...form, make: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Model</Label>
                  <Input
                    placeholder="e.g. Galaxy S24, Corolla"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Color</Label>
                  <Input
                    placeholder="e.g. Black, Silver"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Year of Manufacture</Label>
                  <Input
                    placeholder="e.g. 2022"
                    value={form.yearOfManufacture}
                    onChange={(e) => setForm({ ...form, yearOfManufacture: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Serial Number</Label>
                <Input
                  placeholder="Manufacturer serial number"
                  value={form.serialNumber}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                />
              </div>

              {selectedCategory.hasImei && (
                <div className="space-y-1.5">
                  <Label>
                    IMEI Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="15-digit IMEI (dial *#06# to find)"
                    maxLength={15}
                    value={form.imei}
                    onChange={(e) =>
                      setForm({ ...form, imei: e.target.value.replace(/\D/g, "") })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for UCC Simu Klear blacklisting if stolen
                  </p>
                </div>
              )}

              {(selectedCategory.hasVin || selectedCategory.hasPlate) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedCategory.hasVin && (
                    <div className="space-y-1.5">
                      <Label>VIN / Chassis Number</Label>
                      <Input
                        placeholder="17-character VIN"
                        value={form.vin}
                        onChange={(e) =>
                          setForm({ ...form, vin: e.target.value.toUpperCase() })
                        }
                      />
                    </div>
                  )}
                  {selectedCategory.hasPlate && (
                    <div className="space-y-1.5">
                      <Label>Number Plate</Label>
                      <Input
                        placeholder="e.g. UAA 123B"
                        value={form.plateNumber}
                        onChange={(e) =>
                          setForm({ ...form, plateNumber: e.target.value.toUpperCase() })
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() =>
                setStep(selectedCategory.parts.length > 0 ? "parts" : "proof")
              }
              disabled={!form.label.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // ─── STEP: Parts ──────────────────────────────────────────────────────────

  if (step === "parts" && selectedCategory) {
    const checkedCount = parts.filter((p) => p.checked).length;

    return (
      <DashboardShell title="Register Asset">
        <div className="p-6 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setStep("details")}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h2 className="text-xl font-display font-bold">Select Parts to Register</h2>
              <p className="text-sm text-muted-foreground">
                Tick each removable part you want to register. Each part gets its own QR code.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
            <Info className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Why register parts?</p>
              <p className="text-blue-700 mt-0.5">
                Registering individual parts (engine, battery, screen, etc.) makes it harder for
                thieves to sell stolen components. Each part gets its own unique QR code and can
                be independently verified or reported stolen.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Parts of {form.label}</span>
                <Badge variant="secondary">{checkedCount} selected</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {parts.map((part) => (
                  <div
                    key={part.partType}
                    className={`px-6 py-4 transition-colors ${part.checked ? "bg-primary/[0.03]" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={part.partType}
                        checked={part.checked}
                        onCheckedChange={() => togglePart(part.partType)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={part.partType}
                          className="text-sm font-medium cursor-pointer flex items-center gap-2 flex-wrap"
                        >
                          {part.partLabel}
                          {part.required && (
                            <Badge className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200">
                              Recommended
                            </Badge>
                          )}
                          {part.serializable && (
                            <Badge variant="outline" className="text-xs">
                              Has Serial
                            </Badge>
                          )}
                        </label>
                        {part.checked && part.serializable && (
                          <div className="mt-2">
                            <Input
                              placeholder={`Serial number for ${part.partLabel} (optional)`}
                              value={part.serialNumber}
                              onChange={(e) =>
                                updatePartSerial(part.partType, e.target.value)
                              }
                              className="text-sm h-8"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep("proof")}>
              Skip Parts
            </Button>
            <Button
              onClick={() => setStep("proof")}
              className="bg-primary hover:bg-primary/90"
            >
              Continue with {checkedCount} part{checkedCount !== 1 ? "s" : ""}{" "}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // ─── STEP: Proof ──────────────────────────────────────────────────────────

  if (step === "proof") {
    const checkedParts = parts.filter((p) => p.checked);
    const isSubmitting = createAsset.isPending || uploadProof.isPending;

    return (
      <DashboardShell title="Register Asset">
        <div className="p-6 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setStep(selectedCategory?.parts.length ? "parts" : "details")
              }
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h2 className="text-xl font-display font-bold">Proof of Ownership</h2>
              <p className="text-sm text-muted-foreground">
                Upload a receipt, invoice, or photo as proof (optional but recommended)
              </p>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Registration Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  {selectedCategory && (
                    <CategoryIcon
                      name={selectedCategory.icon}
                      className="w-4 h-4 text-primary"
                    />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{form.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCategory?.label}
                    {form.make ? ` · ${form.make}` : ""}
                    {form.model ? ` ${form.model}` : ""}
                  </p>
                </div>
              </div>
              {checkedParts.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      PARTS TO REGISTER ({checkedParts.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {checkedParts.map((p) => (
                        <Badge key={p.partType} variant="secondary" className="text-xs">
                          {p.partLabel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proof">Proof of Ownership Document</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    id="proof"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                    onChange={handleProofFile}
                  />
                  <label htmlFor="proof" className="cursor-pointer">
                    {proofFile ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="text-sm font-medium text-emerald-700">{proofFile.name}</p>
                        <p className="text-xs text-muted-foreground font-mono break-all">
                          SHA-256: {proofSha256.slice(0, 32)}…
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <QrCode className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload receipt, invoice, or photo
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, JPG, PNG, DOC — max 10MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !form.label.trim()}
            className="w-full bg-primary hover:bg-primary/90 h-12 text-base font-semibold"
          >
            {isSubmitting
              ? "Registering…"
              : `Register Asset${
                  checkedParts.length > 0
                    ? ` + ${checkedParts.length} Part${checkedParts.length !== 1 ? "s" : ""}`
                    : ""
                }`}
          </Button>
        </div>
      </DashboardShell>
    );
  }

  // ─── STEP: Success ────────────────────────────────────────────────────────

  if (step === "success" && successData) {
    return (
      <DashboardShell title="Asset Registered">
        <div className="p-6 max-w-lg mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-display font-bold">Asset Registered!</h2>
            <p className="text-muted-foreground">
              Your asset and {successData.registeredParts?.length ?? 0} part
              {(successData.registeredParts?.length ?? 0) !== 1 ? "s" : ""} are now protected.
            </p>
          </div>

          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <p className="text-sm font-medium text-muted-foreground">ASSET QR CODE</p>
              <img
                src={successData.qrDataUrl}
                alt="Asset QR Code"
                className="w-48 h-48 mx-auto rounded-xl border border-border"
              />
              <p className="font-mono text-sm font-bold text-primary">{successData.qrPublicId}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = successData.qrDataUrl;
                  a.download = `${successData.qrPublicId}.png`;
                  a.click();
                }}
              >
                <Download className="w-4 h-4 mr-2" /> Download QR Code
              </Button>
            </CardContent>
          </Card>

          {successData.registeredParts && successData.registeredParts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Registered Parts ({successData.registeredParts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {successData.registeredParts.map((part) => (
                    <div
                      key={part.partType}
                      className="px-6 py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{part.partLabel}</p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {part.qrPublicId}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200"
                      >
                        Registered
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Link href="/assets" className="flex-1">
              <Button variant="outline" className="w-full">
                View All Assets
              </Button>
            </Link>
            <Link href={`/assets/${successData.assetId}`} className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90">View Asset</Button>
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return null;
}

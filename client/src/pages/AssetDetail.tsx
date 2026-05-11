import { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useParams, Link } from "wouter";
import {
  Package, QrCode, AlertTriangle, ArrowLeft, Download,
  ArrowLeftRight, Shield, Layers, CheckCircle2, Clock,
  Smartphone, Car, Laptop, Bike, Camera, Tv, Zap, Thermometer,
  Wind, Music, Printer, Video, Wrench, Sun, Tractor, HeartPulse,
  Gem, Cpu, Monitor, Tablet, Hash, Calendar, Palette, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  smartphone: Smartphone, tablet: Tablet, laptop: Laptop, desktop: Monitor,
  vehicle: Car, motorcycle: Bike, bicycle: Bike, camera: Camera,
  television: Tv, generator: Zap, refrigerator: Thermometer,
  washing_machine: Wind, audio_system: Music, printer: Printer,
  projector: Video, power_tools: Wrench, solar_system: Sun,
  agri_equipment: Tractor, medical_equipment: HeartPulse,
  high_value_item: Gem, other_electronics: Cpu, other: Package,
};

const CATEGORY_LABELS: Record<string, string> = {
  smartphone: "Smartphone", tablet: "Tablet", laptop: "Laptop",
  desktop: "Desktop Computer", vehicle: "Vehicle",
  motorcycle: "Motorcycle / Boda Boda", bicycle: "Bicycle",
  camera: "Camera", television: "Television", generator: "Generator",
  refrigerator: "Refrigerator / Freezer", washing_machine: "Washing Machine",
  audio_system: "Audio System", printer: "Printer / Scanner",
  projector: "Projector", power_tools: "Power Tools",
  solar_system: "Solar System", agri_equipment: "Agricultural Equipment",
  medical_equipment: "Medical Equipment", high_value_item: "High-Value Item",
  other_electronics: "Other Electronics", other: "Other Item",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  stolen: "bg-red-100 text-red-800 border-red-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  retired: "bg-slate-100 text-slate-700 border-slate-200",
  disputed: "bg-orange-100 text-orange-800 border-orange-200",
};

type ChildAsset = {
  id: number;
  label: string;
  category: string;
  status: string;
  serialNumber?: string | null;
  partType?: string | null;
  partLabel?: string | null;
  qrPublicId?: string | null;
};

type AssetWithChildren = {
  id: number;
  label: string;
  category: string;
  status: string;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  serialNumber?: string | null;
  imei?: string | null;
  vin?: string | null;
  plateNumber?: string | null;
  yearOfManufacture?: number | null;
  qrPublicId?: string | null;
  createdAt: Date;
  children?: ChildAsset[];
};

export default function AssetDetail() {
  const params = useParams<{ id: string }>();
  const assetId = parseInt(params.id ?? "0");
  const assetQuery = trpc.assets.getById.useQuery({ id: assetId });
  const qrQuery = trpc.assets.generateQr.useQuery({ assetId }, { enabled: !!assetId });
  const asset = assetQuery.data as AssetWithChildren | undefined;

  const CategoryIcon = asset ? (CATEGORY_ICONS[asset.category] ?? Package) : Package;
  const categoryLabel = asset ? (CATEGORY_LABELS[asset.category] ?? asset.category) : "";
  const isStolen = asset?.status === "stolen";
  const [partsExpanded, setPartsExpanded] = useState(true);

  return (
    <DashboardShell title={asset?.label ?? "Asset Detail"}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <Link href="/assets">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Assets
          </Button>
        </Link>

        {assetQuery.isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !asset ? (
          <div className="text-center py-16 text-muted-foreground">Asset not found.</div>
        ) : (
          <>
            {/* ── Main Info Card ─────────────────────────────────────── */}
            <Card className={`border-border ${isStolen ? "border-red-200 bg-red-50/20" : ""}`}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isStolen ? "bg-red-100" : "bg-primary/10"
                      }`}
                    >
                      <CategoryIcon
                        className={`w-6 h-6 ${isStolen ? "text-red-600" : "text-primary"}`}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-display">{asset.label}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {categoryLabel}
                        {asset.make ? ` · ${asset.make}` : ""}
                        {asset.model ? ` ${asset.model}` : ""}
                        {asset.yearOfManufacture ? ` (${asset.yearOfManufacture})` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`border shrink-0 ${STATUS_BADGE[asset.status] ?? STATUS_BADGE.active}`}
                  >
                    {asset.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Identifiers Grid */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {asset.color && (
                    <div className="flex items-center gap-2 text-sm">
                      <Palette className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Color:</span>
                      <span className="font-medium">{asset.color}</span>
                    </div>
                  )}
                  {asset.serialNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Serial:</span>
                      <span className="font-mono font-medium">{asset.serialNumber}</span>
                    </div>
                  )}
                  {asset.imei && (
                    <div className="flex items-center gap-2 text-sm">
                      <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">IMEI:</span>
                      <span className="font-mono font-medium">{asset.imei}</span>
                    </div>
                  )}
                  {asset.vin && (
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">VIN:</span>
                      <span className="font-mono font-medium">{asset.vin}</span>
                    </div>
                  )}
                  {asset.plateNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Plate:</span>
                      <span className="font-mono font-medium">{asset.plateNumber}</span>
                    </div>
                  )}
                  {asset.qrPublicId && (
                    <div className="flex items-center gap-2 text-sm">
                      <QrCode className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">QR ID:</span>
                      <span className="font-mono font-medium">{asset.qrPublicId}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Registered:</span>
                    <span className="font-medium">
                      {new Date(asset.createdAt).toLocaleDateString("en-UG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {asset.status !== "stolen" && (
                    <Link href={`/stolen?assetId=${asset.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <AlertTriangle className="w-4 h-4 mr-1" /> Report Stolen
                      </Button>
                    </Link>
                  )}
                  <Link href={`/transfers?assetId=${asset.id}`}>
                    <Button variant="outline" size="sm">
                      <ArrowLeftRight className="w-4 h-4 mr-1" /> Transfer Ownership
                    </Button>
                  </Link>
                  <Link href={`/verify?assetId=${asset.id}`}>
                    <Button variant="outline" size="sm">
                      <Shield className="w-4 h-4 mr-1" /> Verify
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* ── QR Code Card ───────────────────────────────────────── */}
            {qrQuery.data && (
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-display flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-primary" /> Ownership QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-border shrink-0">
                    <img
                      src={qrQuery.data.qrDataUrl}
                      alt="QR Code"
                      className="w-40 h-40"
                    />
                    <p className="text-xs text-center text-muted-foreground mt-2 font-mono">
                      {qrQuery.data.qrPublicId}
                    </p>
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Print and affix this QR code to your asset. Buyers can scan it to
                      instantly request ownership verification before purchase.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tamper-evident ownership proof</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Real-time CLEAN / STOLEN status</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Signed digital receipt on verify</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.download = `garget-${qrQuery.data?.qrPublicId}.png`;
                        link.href = qrQuery.data?.qrDataUrl ?? "";
                        link.click();
                        toast.success("QR code downloaded");
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" /> Download QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Parts / Sub-components Card ────────────────────────── */}
            {asset.children && asset.children.length > 0 && (
              <Card className="border-border">
                <CardHeader className="pb-3 cursor-pointer" onClick={() => setPartsExpanded(!partsExpanded)}>
                  <CardTitle className="text-base font-display flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    Registered Parts
                    <Badge variant="secondary" className="ml-1">
                      {asset.children.length}
                    </Badge>
                    <div className="ml-auto">
                      {partsExpanded
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </CardTitle>
                </CardHeader>
                {partsExpanded && (
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {asset.children.map((child) => {
                      const ChildIcon = CATEGORY_ICONS[child.category] ?? Package;
                      const childIsStolen = child.status === "stolen";
                      return (
                        <Link key={child.id} href={`/assets/${child.id}`}>
                          <div className="flex items-center gap-3 px-6 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                childIsStolen ? "bg-red-100" : "bg-primary/10"
                              }`}
                            >
                              <ChildIcon
                                className={`w-4 h-4 ${childIsStolen ? "text-red-600" : "text-primary"}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {child.partLabel ?? child.label}
                              </p>
                              {child.serialNumber && (
                                <p className="text-xs text-muted-foreground font-mono truncate">
                                  S/N: {child.serialNumber}
                                </p>
                              )}
                              {child.qrPublicId && (
                                <p className="text-xs text-muted-foreground font-mono truncate">
                                  {child.qrPublicId}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge
                                className={`text-xs border ${
                                  STATUS_BADGE[child.status] ?? STATUS_BADGE.active
                                }`}
                              >
                                {child.status.toUpperCase()}
                              </Badge>
                              {child.qrPublicId && (
                                <QrCode className="w-3.5 h-3.5 text-primary" />
                              )}
                            </div>
                          </div>
                        </Link>
                    );
                      })}
                  </div>
                </CardContent>
                )}
              </Card>
            )}

            {/* ── Stolen Warning Banner ──────────────────────────────── */}
            {isStolen && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
                <div>
                  <p className="font-semibold">This asset is marked as STOLEN</p>
                  <p className="text-sm text-red-700 mt-0.5">
                    A stolen report has been filed. UPF and UCC have been notified. Any
                    verification attempt on this asset will return a STOLEN status.
                  </p>
                </div>
              </div>
            )}

            {/* ── Pending Verification Banner ────────────────────────── */}
            {asset.status === "pending" && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                <Clock className="w-5 h-5 mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">Verification Pending</p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    A buyer has requested ownership verification for this asset. Please
                    approve or reject from your Dashboard.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}

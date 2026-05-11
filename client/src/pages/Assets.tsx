import { DashboardShell } from "@/components/DashboardShell";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Package, Plus, Search, QrCode, AlertTriangle, ChevronRight,
  Smartphone, Car, Laptop, Bike, Camera, Tv, Zap, Thermometer,
  Wind, Music, Printer, Video, Wrench, Sun, Tractor, HeartPulse,
  Gem, Cpu, Monitor, Tablet, Layers,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

// ─── Category Icon Map ─────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  smartphone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  desktop: Monitor,
  vehicle: Car,
  motorcycle: Bike,
  bicycle: Bike,
  camera: Camera,
  television: Tv,
  generator: Zap,
  refrigerator: Thermometer,
  washing_machine: Wind,
  audio_system: Music,
  printer: Printer,
  projector: Video,
  power_tools: Wrench,
  solar_system: Sun,
  agri_equipment: Tractor,
  medical_equipment: HeartPulse,
  high_value_item: Gem,
  other_electronics: Cpu,
  other: Package,
};

const CATEGORY_LABELS: Record<string, string> = {
  smartphone: "Smartphone",
  tablet: "Tablet",
  laptop: "Laptop",
  desktop: "Desktop Computer",
  vehicle: "Vehicle",
  motorcycle: "Motorcycle / Boda Boda",
  bicycle: "Bicycle",
  camera: "Camera",
  television: "Television",
  generator: "Generator",
  refrigerator: "Refrigerator / Freezer",
  washing_machine: "Washing Machine",
  audio_system: "Audio System",
  printer: "Printer / Scanner",
  projector: "Projector",
  power_tools: "Power Tools",
  solar_system: "Solar System",
  agri_equipment: "Agricultural Equipment",
  medical_equipment: "Medical Equipment",
  high_value_item: "High-Value Item",
  other_electronics: "Other Electronics",
  other: "Other Item",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  stolen: "bg-red-100 text-red-800 border-red-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  retired: "bg-slate-100 text-slate-700 border-slate-200",
  disputed: "bg-orange-100 text-orange-800 border-orange-200",
};

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "stolen", label: "Stolen" },
  { value: "pending", label: "Pending" },
];

export default function Assets() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const assetsQuery = trpc.assets.list.useQuery();
  const assets = assetsQuery.data ?? [];

  const filtered = assets.filter((a) => {
    const matchesSearch =
      a.label.toLowerCase().includes(search.toLowerCase()) ||
      (a.make ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.model ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.serialNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.imei ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stolenCount = assets.filter((a) => a.status === "stolen").length;

  return (
    <DashboardShell title="My Assets">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Registered Assets</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {assets.length} item{assets.length !== 1 ? "s" : ""} registered
              {stolenCount > 0 && (
                <span className="ml-2 text-red-600 font-medium">· {stolenCount} stolen</span>
              )}
            </p>
          </div>
          <Link href="/assets/register">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Register Asset
            </Button>
          </Link>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, make, model, serial, or IMEI…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Asset Grid */}
        {assetsQuery.isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            {search || statusFilter !== "all" ? (
              <p className="text-muted-foreground">
                No assets match your search or filter.
              </p>
            ) : (
              <>
                <p className="text-lg font-display font-semibold mb-1">No assets yet</p>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Register your first asset to start protecting it from theft and enable instant ownership verification.
                </p>
                <Link href="/assets/register">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" /> Register Your First Asset
                  </Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((asset) => {
              const Icon = CATEGORY_ICONS[asset.category] ?? Package;
              const categoryLabel = CATEGORY_LABELS[asset.category] ?? asset.category;
              const children = (asset as { children?: unknown[] }).children ?? [];
              const isStolen = asset.status === "stolen";

              return (
                <Link key={asset.id} href={`/assets/${asset.id}`}>
                  <Card
                    className={`border-border hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 h-full ${
                      isStolen ? "border-red-200 bg-red-50/30" : ""
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isStolen ? "bg-red-100" : "bg-primary/10"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${isStolen ? "text-red-600" : "text-primary"}`}
                          />
                        </div>
                        <Badge
                          className={`text-xs border ${STATUS_BADGE[asset.status] ?? STATUS_BADGE.active}`}
                        >
                          {asset.status.toUpperCase()}
                        </Badge>
                      </div>

                      <h3 className="font-display font-semibold text-foreground text-sm mb-0.5 line-clamp-1">
                        {asset.label}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {categoryLabel}
                        {asset.make ? ` · ${asset.make}` : ""}
                        {asset.model ? ` ${asset.model}` : ""}
                      </p>

                      {/* Identifiers */}
                      <div className="space-y-1 mb-3">
                        {asset.serialNumber && (
                          <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded truncate">
                            S/N: {asset.serialNumber}
                          </p>
                        )}
                        {asset.imei && (
                          <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded truncate">
                            IMEI: {asset.imei}
                          </p>
                        )}
                        {(asset as { vin?: string }).vin && (
                          <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded truncate">
                            VIN: {(asset as { vin?: string }).vin}
                          </p>
                        )}
                        {(asset as { plateNumber?: string }).plateNumber && (
                          <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded truncate">
                            Plate: {(asset as { plateNumber?: string }).plateNumber}
                          </p>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5 flex-wrap">
                          {asset.qrPublicId && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                              <QrCode className="w-3 h-3" /> QR
                            </span>
                          )}
                          {children.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              <Layers className="w-3 h-3" /> {children.length} part{children.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          {isStolen && (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                              <AlertTriangle className="w-3 h-3" /> STOLEN
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

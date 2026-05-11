import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Scale, Search, AlertTriangle, CheckCircle2, MapPin, FileText, Map } from "lucide-react";
import { MapView } from "@/components/Map";

export default function LawEnforcement() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchResult, setSearchResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"search" | "map" | "reports">("search");
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const leDashQuery = trpc.lawEnforcement.dashboard.useQuery(undefined, {
    enabled: user?.role === "law_enforcement" || user?.role === "admin",
  });

  const searchMutation = trpc.lawEnforcement.searchAsset.useMutation({
    onSuccess: (data) => setSearchResult(data),
    onError: (e) => toast.error(e.message),
  });

  const STATUS_BADGE: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800 border-emerald-200",
    stolen: "bg-red-100 text-red-800 border-red-200",
    resolved: "bg-blue-100 text-blue-800 border-blue-200",
  };

  const dashboard = leDashQuery.data;

  // Populate map markers when map is ready and dashboard has data
  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const reports = (dashboard?.recentStolenReports ?? []) as Array<{
      id: number;
      assetId: number;
      upfCaseNumber: string | null;
      status: string;
      reportBasis: string;
      createdAt: Date;
      lastKnownLat?: string | null;
      lastKnownLng?: string | null;
    }>;

    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    reports.forEach((report) => {
      const lat = parseFloat(report.lastKnownLat ?? "");
      const lng = parseFloat(report.lastKnownLng ?? "");
      if (isNaN(lat) || isNaN(lng)) return;

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: `Asset #${report.assetId} — ${report.status}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: report.status === "active" ? "#ef4444" : "#22c55e",
          fillOpacity: 0.9,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: sans-serif; font-size: 13px; padding: 4px;">
            <strong>Asset #${report.assetId}</strong><br/>
            <span style="color: #6b7280;">UPF: ${report.upfCaseNumber ?? "N/A"}</span><br/>
            <span style="color: #6b7280;">Status: ${report.status}</span><br/>
            <span style="color: #6b7280;">${new Date(report.createdAt).toLocaleDateString()}</span>
          </div>
        `,
      });

      marker.addListener("click", () => infoWindow.open(map, marker));
      markersRef.current.push(marker);
      bounds.extend({ lat, lng });
      hasMarkers = true;
    });

    if (hasMarkers) {
      map.fitBounds(bounds);
    } else {
      // Default to Kampala, Uganda
      map.setCenter({ lat: 0.3476, lng: 32.5825 });
      map.setZoom(12);
    }
  };

  // Re-populate markers when dashboard data arrives
  useEffect(() => {
    if (mapRef.current && dashboard) {
      handleMapReady(mapRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard]);

  if (user?.role !== "law_enforcement" && user?.role !== "admin") {
    return (
      <DashboardShell title="Law Enforcement Portal">
        <div className="p-6 text-center py-16">
          <Scale className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Access restricted to Law Enforcement personnel.</p>
          <p className="text-sm text-muted-foreground mt-1">Contact your administrator to request access.</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Law Enforcement Portal">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Uganda Police Force — Asset Registry Portal</h2>
          <p className="text-sm text-muted-foreground mt-1">Search stolen assets, track cases, and coordinate with the Garget Register.</p>
        </div>

        {/* Stats */}
        {dashboard && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Active Stolen Reports", value: dashboard.activeStolenReports, color: "text-red-600", bg: "bg-red-50" },
              { label: "Resolved Cases", value: dashboard.resolvedCases, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "IMEI Blacklisted", value: dashboard.imeiBlacklisted, color: "text-orange-600", bg: "bg-orange-50" },
              { label: "Total Verifications", value: dashboard.totalVerifications, color: "text-blue-600", bg: "bg-blue-50" },
            ].map((stat) => (
              <Card key={stat.label} className="border-border">
                <CardContent className="p-4">
                  <div className={`text-2xl font-display font-bold mb-1 ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
          {[
            { id: "search", label: "Asset Search", icon: Search },
            { id: "map", label: "Stolen Asset Map", icon: Map },
            { id: "reports", label: "Recent Reports", icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Asset Search Tab */}
        {activeTab === "search" && (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" /> Search Asset Registry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by IMEI, serial number, QR ID, or UPF case number…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchQuery.trim() && searchMutation.mutate({ query: searchQuery })}
                  className="font-mono"
                />
                <Button
                  className="bg-primary hover:bg-primary/90 flex-shrink-0"
                  onClick={() => searchMutation.mutate({ query: searchQuery })}
                  disabled={searchMutation.isPending || !searchQuery.trim()}
                >
                  {searchMutation.isPending ? "…" : <Search className="w-4 h-4" />}
                </Button>
              </div>

              {searchResult && (
                <div className={`p-4 rounded-xl border ${searchResult.found ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
                  {!searchResult.found ? (
                    <div className="flex items-center gap-2 text-slate-600">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm">No stolen report found. Asset may be clean or unregistered.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="font-semibold text-red-800 text-sm">STOLEN ASSET FOUND IN REGISTRY</span>
                      </div>
                      {searchResult.asset && (
                        <div className="grid sm:grid-cols-2 gap-2 text-sm">
                          <div><span className="text-muted-foreground">Asset:</span> <span className="font-medium">{searchResult.asset.label}</span></div>
                          <div><span className="text-muted-foreground">Category:</span> <span className="capitalize">{searchResult.asset.category}</span></div>
                          {searchResult.asset.make && <div><span className="text-muted-foreground">Make:</span> {searchResult.asset.make}</div>}
                          {searchResult.asset.model && <div><span className="text-muted-foreground">Model:</span> {searchResult.asset.model}</div>}
                          {searchResult.asset.imei && <div><span className="text-muted-foreground">IMEI:</span> <span className="font-mono">{searchResult.asset.imei}</span></div>}
                          {searchResult.asset.serialNumber && <div><span className="text-muted-foreground">Serial:</span> <span className="font-mono">{searchResult.asset.serialNumber}</span></div>}
                          {searchResult.asset.color && <div><span className="text-muted-foreground">Color:</span> {searchResult.asset.color}</div>}
                        </div>
                      )}
                      {searchResult.stolenReport && (
                        <div className="grid sm:grid-cols-2 gap-2 text-sm border-t border-red-200 pt-3">
                          <div><span className="text-muted-foreground">UPF Case:</span> <span className="font-mono font-bold">{searchResult.stolenReport.upfCaseNumber}</span></div>
                          {searchResult.stolenReport.policeCaseNumber && (
                            <div><span className="text-muted-foreground">Police Case:</span> <span className="font-mono">{searchResult.stolenReport.policeCaseNumber}</span></div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Status: </span>
                            <Badge className={`text-xs border ml-1 ${STATUS_BADGE[searchResult.stolenReport.status] ?? STATUS_BADGE.stolen}`}>
                              {searchResult.stolenReport.status.toUpperCase()}
                            </Badge>
                          </div>
                          {searchResult.stolenReport.lastKnownLat && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs font-mono">{searchResult.stolenReport.lastKnownLat}, {searchResult.stolenReport.lastKnownLng}</span>
                            </div>
                          )}
                          <div><span className="text-muted-foreground">Reported:</span> {new Date(searchResult.stolenReport.createdAt).toLocaleDateString("en-UG")}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Search tips:</p>
                <p>• IMEI: Enter the 15-digit IMEI number of the device</p>
                <p>• Serial: Enter the device serial number</p>
                <p>• QR ID: Enter the GR-XXXXXXXXXX code from the QR label</p>
                <p>• Case: Enter the UPF case number (e.g. UPF-2024-00123)</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stolen Asset Map Tab */}
        {activeTab === "map" && (
          <Card className="border-border overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Map className="w-4 h-4 text-primary" /> Stolen Asset Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[480px] w-full">
                <MapView onMapReady={handleMapReady} />
              </div>
              <div className="p-4 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                  Active stolen report
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  Resolved / recovered
                </div>
                <span className="ml-auto">Click a marker for details</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Reports Tab */}
        {activeTab === "reports" && (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-500" /> Recent Stolen Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!dashboard?.recentStolenReports?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No recent stolen reports.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(dashboard.recentStolenReports as Array<{
                    id: number;
                    assetId: number;
                    upfCaseNumber: string | null;
                    status: string;
                    reportBasis: string;
                    createdAt: Date;
                    lastKnownLat?: string | null;
                    lastKnownLng?: string | null;
                  }>).map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">Asset #{report.assetId}</span>
                          <Badge className={`text-xs border ${STATUS_BADGE[report.status] ?? STATUS_BADGE.stolen}`}>
                            {report.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">UPF: {report.upfCaseNumber ?? "Pending"}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {report.reportBasis.replace(/_/g, " ")} · {new Date(report.createdAt).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      {report.lastKnownLat && report.lastKnownLng && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-3">
                          <MapPin className="w-3 h-3" />
                          <span className="font-mono">{parseFloat(report.lastKnownLat).toFixed(4)}, {parseFloat(report.lastKnownLng).toFixed(4)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}

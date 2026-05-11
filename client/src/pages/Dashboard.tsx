import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, CheckCircle2, Clock, ArrowRight, Plus, QrCode, Bell } from "lucide-react";
import { Link } from "wouter";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  stolen: "bg-red-100 text-red-800 border-red-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  retired: "bg-slate-100 text-slate-700 border-slate-200",
  disputed: "bg-orange-100 text-orange-800 border-orange-200",
};

export default function Dashboard() {
  const { user } = useAuth();
  const assetsQuery = trpc.assets.list.useQuery();
  const notifQuery = trpc.notifications.list.useQuery();
  const pendingQuery = trpc.verification.pendingForOwner.useQuery();

  const assets = assetsQuery.data ?? [];
  const notifications = (notifQuery.data ?? []).slice(0, 5);
  const pendingVerifications = pendingQuery.data ?? [];

  const totalAssets = assets.length;
  const stolenAssets = assets.filter((a) => a.status === "stolen").length;
  const activeAssets = assets.filter((a) => a.status === "active").length;
  const unreadNotifs = (notifQuery.data ?? []).filter((n) => !n.isRead).length;

  return (
    <DashboardShell title="Dashboard">
      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Welcome back, {user?.name?.split(" ")[0] ?? "there"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Here's an overview of your registered assets and recent activity.
          </p>
        </div>

        {/* NIN Warning */}
        {!(user as { ninVerified?: boolean })?.ninVerified && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">NIN Verification Required</p>
              <p className="text-xs text-amber-700 mt-0.5">Verify your National ID Number to unlock full platform features including theft reporting and ownership transfers.</p>
            </div>
            <Link href="/profile">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0">Verify Now</Button>
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Assets", value: totalAssets, icon: Package, color: "text-primary bg-primary/10" },
            { label: "Active", value: activeAssets, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
            { label: "Stolen", value: stolenAssets, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
            { label: "Pending Verifications", value: pendingVerifications.length, icon: Clock, color: "text-amber-600 bg-amber-50" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-display font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Assets */}
          <div className="lg:col-span-2">
            <Card className="border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-display">Recent Assets</CardTitle>
                <Link href="/assets">
                  <Button variant="ghost" size="sm" className="text-primary text-xs">
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-0">
                {assetsQuery.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : assets.length === 0 ? (
                  <div className="text-center py-10">
                    <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No assets registered yet.</p>
                    <Link href="/assets/register">
                      <Button size="sm" className="mt-4 bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-1" /> Register First Asset
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assets.slice(0, 5).map((asset) => (
                      <Link key={asset.id} href={`/assets/${asset.id}`}>
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Package className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{asset.label}</div>
                            <div className="text-xs text-muted-foreground capitalize">{asset.category} {asset.make ? `· ${asset.make}` : ""}</div>
                          </div>
                          <Badge className={`text-xs border ${STATUS_BADGE[asset.status] ?? STATUS_BADGE.active}`}>
                            {asset.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions + Notifications */}
          <div className="space-y-4">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <Link href="/assets/register">
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                    <Plus className="w-4 h-4 text-primary" /> Register New Asset
                  </Button>
                </Link>
                <Link href="/verify">
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                    <QrCode className="w-4 h-4 text-primary" /> Verify an Item
                  </Button>
                </Link>
                <Link href="/stolen">
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Report Stolen Item
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card className="border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Bell className="w-4 h-4" /> Notifications
                  {unreadNotifs > 0 && (
                    <Badge className="bg-red-500 text-white text-xs px-1.5 h-5">{unreadNotifs}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No notifications yet.</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-2.5 rounded-lg text-xs ${n.isRead ? "bg-muted/30" : "bg-primary/5 border border-primary/10"}`}>
                        <div className="font-medium text-foreground">{n.title}</div>
                        <div className="text-muted-foreground mt-0.5 line-clamp-1">{n.body}</div>
                      </div>
                    ))}
                    <Link href="/notifications">
                      <Button variant="ghost" size="sm" className="w-full text-xs text-primary mt-1">
                        View All <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pending Verifications */}
        {pendingVerifications.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display text-amber-800 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Pending Verification Requests ({pendingVerifications.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-amber-700 mb-3">
                Someone wants to verify ownership of your assets. Respond within 5 minutes.
              </p>
              <Link href="/verify">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                  Review Requests <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}

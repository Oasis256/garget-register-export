import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Settings, Users, Package, AlertTriangle, BarChart3, Shield, Search, Layers, Smartphone, Car, Laptop, Bike, Camera, Tv, Zap, Thermometer, Wind, Music, Printer, Video, Wrench, Sun, Tractor, HeartPulse, Gem, Cpu, Monitor, Tablet } from "lucide-react";

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
  desktop: "Desktop", vehicle: "Vehicle", motorcycle: "Motorcycle",
  bicycle: "Bicycle", camera: "Camera", television: "TV",
  generator: "Generator", refrigerator: "Fridge", washing_machine: "Washer",
  audio_system: "Audio", printer: "Printer", projector: "Projector",
  power_tools: "Power Tools", solar_system: "Solar", agri_equipment: "Agri",
  medical_equipment: "Medical", high_value_item: "High Value",
  other_electronics: "Other Electronics", other: "Other",
};

export default function AdminPanel() {
  const { user } = useAuth();
  const [userSearch, setUserSearch] = useState("");

  const statsQuery = trpc.admin.stats.useQuery(undefined, { enabled: user?.role === "admin" });
  const usersQuery = trpc.admin.listUsers.useQuery({ search: userSearch || undefined }, { enabled: user?.role === "admin" });
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { usersQuery.refetch(); toast.success("User role updated!"); },
    onError: (e) => toast.error(e.message),
  });

  if (user?.role !== "admin") {
    return (
      <DashboardShell title="Admin Panel">
        <div className="p-6 text-center py-16">
          <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Access restricted to administrators.</p>
        </div>
      </DashboardShell>
    );
  }

  const stats = statsQuery.data;
  const users = usersQuery.data ?? [];

  const ROLE_BADGE: Record<string, string> = {
    user: "bg-slate-100 text-slate-700",
    admin: "bg-purple-100 text-purple-800",
    owner: "bg-blue-100 text-blue-800",
    buyer: "bg-green-100 text-green-800",
    law_enforcement: "bg-orange-100 text-orange-800",
  };

  return (
    <DashboardShell title="Admin Panel">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Administration Panel</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage users, monitor platform activity, and configure system settings.</p>
        </div>

        {/* Platform Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600 bg-blue-50" },
              { label: "Total Assets", value: stats.totalAssets, icon: Package, color: "text-primary bg-primary/10" },
              { label: "Stolen Reports", value: stats.stolenActive, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
              { label: "Total Verifications", value: stats.verifications, icon: BarChart3, color: "text-emerald-600 bg-emerald-50" },
            ].map((stat) => (
              <Card key={stat.label} className="border-border">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${stat.color}`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-display font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* User Management */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email…"
                className="pl-9"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              {usersQuery.isLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}
                </div>
              ) : users.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No users found.</p>
              ) : (
                users.map((u: {
                  id: number;
                  name: string | null;
                  email: string | null;
                  role: string;
                  ninVerified: boolean;
                  createdAt: Date;
                }) => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {(u.name ?? u.email ?? "U").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{u.name ?? "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.ninVerified && <Badge className="text-xs bg-emerald-100 text-emerald-800">NIN ✓</Badge>}
                      <Select
                        value={u.role}
                        onValueChange={(v) => updateRoleMutation.mutate({ userId: u.id, role: v as "owner" | "buyer" | "law_enforcement" | "admin" })}
                      >
                        <SelectTrigger className="h-7 text-xs w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="buyer">Buyer</SelectItem>
                          <SelectItem value="law_enforcement">Law Enforcement</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        {stats?.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 && (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Asset Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(stats.categoryBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => {
                    const Icon = CATEGORY_ICONS[cat] ?? Package;
                    return (
                      <div key={cat} className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground">{count}</p>
                          <p className="text-xs text-muted-foreground truncate">{CATEGORY_LABELS[cat] ?? cat}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {stats.totalParts !== undefined && stats.totalParts > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Layers className="w-4 h-4" />
                  <span>{stats.totalParts} registered parts across all assets</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardShell>
  );
}

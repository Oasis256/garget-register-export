import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  Shield, LayoutDashboard, Package, QrCode, AlertTriangle,
  ArrowLeftRight, Bell, User, Scale, Settings, LogOut,
  Menu, X, ChevronRight, Crown
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/assets", icon: Package, label: "My Assets" },
  { href: "/verify", icon: QrCode, label: "Verify Item" },
  { href: "/stolen", icon: AlertTriangle, label: "Stolen Reports" },
  { href: "/transfers", icon: ArrowLeftRight, label: "Transfers" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/subscription", icon: Crown, label: "Subscription" },
  { href: "/profile", icon: User, label: "Profile" },
];

const adminItems = [
  { href: "/admin", icon: Settings, label: "Admin Panel" },
];

const leItems = [
  { href: "/law-enforcement", icon: Scale, label: "LE Portal" },
];

export function DashboardShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const notifQuery = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated });
  const unreadCount = notifQuery.data?.filter((n) => !n.isRead).length ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center animate-pulse">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Loading Garget Register…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Shield className="w-9 h-9 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to access your Garget Register dashboard.</p>
          <a href={getLoginUrl()}>
            <Button className="bg-primary hover:bg-primary/90 w-full">Sign In to Continue</Button>
          </a>
        </div>
      </div>
    );
  }

  const allNavItems = [
    ...navItems,
    ...(user?.role === "law_enforcement" || user?.role === "admin" ? leItems : []),
    ...(user?.role === "admin" ? adminItems : []),
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-sidebar-foreground text-sm">Garget Register</div>
              <div className="text-xs text-sidebar-foreground/50">Uganda</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {allNavItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer relative ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
                {item.label === "Notifications" && unreadCount > 0 && (
                  <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0 h-5 min-w-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent/30">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {(user?.name ?? user?.email ?? "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name ?? "User"}</div>
            <div className="text-xs text-sidebar-foreground/50 capitalize">{user?.role?.replace("_", " ")}</div>
          </div>
          <button onClick={logout} className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-sidebar flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 flex-shrink-0">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1">
            {title && <h1 className="font-display font-semibold text-foreground text-base">{title}</h1>}
          </div>
          <div className="flex items-center gap-2">
            {!(user as { ninVerified?: boolean })?.ninVerified && (
              <Link href="/profile">
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs cursor-pointer hover:bg-amber-200 transition-colors">
                  Verify NIN
                </Badge>
              </Link>
            )}
            <Link href="/notifications">
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

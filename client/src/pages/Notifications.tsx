import { DashboardShell } from "@/components/DashboardShell";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Bell, CheckCheck } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  scan_alert: "bg-blue-100 text-blue-800",
  stolen_alert: "bg-red-100 text-red-800",
  verification_request: "bg-amber-100 text-amber-800",
  transfer_request: "bg-purple-100 text-purple-800",
  transfer_confirmed: "bg-emerald-100 text-emerald-800",
  report_activated: "bg-red-100 text-red-800",
  report_resolved: "bg-emerald-100 text-emerald-800",
  system: "bg-slate-100 text-slate-700",
};

export default function Notifications() {
  const notifQuery = trpc.notifications.list.useQuery();
  const markReadMutation = trpc.notifications.markRead.useMutation({ onSuccess: () => notifQuery.refetch() });
  const markAllMutation = trpc.notifications.markAllRead.useMutation({ onSuccess: () => { notifQuery.refetch(); toast.success("All notifications marked as read"); } });

  const notifications = notifQuery.data ?? [];
  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <DashboardShell title="Notifications">
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Notifications</h2>
            <p className="text-sm text-muted-foreground">{unread} unread</p>
          </div>
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()}>
              <CheckCheck className="w-4 h-4 mr-1" /> Mark All Read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <Card key={n.id} className={`border-border cursor-pointer transition-colors ${n.isRead ? "" : "bg-primary/5 border-primary/20"}`}
                onClick={() => !n.isRead && markReadMutation.mutate({ id: n.id })}>
                <CardContent className="p-4 flex items-start gap-3">
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                  <div className={`flex-1 ${n.isRead ? "ml-5" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">{n.title}</span>
                      <Badge className={`text-xs px-1.5 py-0 ${TYPE_COLORS[n.type] ?? TYPE_COLORS.system}`}>{n.type.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
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

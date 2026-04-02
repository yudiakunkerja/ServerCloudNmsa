import { useAuth } from "@/hooks/use-auth";
import { 
  useGetDashboardSummary, 
  getGetDashboardSummaryQueryKey,
  useListReminders,
  getListRemindersQueryKey,
  useListAlarms,
  getListAlarmsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckSquare, Users, Bell, Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const userId = user?.uid || "";

  const { data: summary } = useGetDashboardSummary(
    { userId }, 
    { query: { enabled: !!userId, queryKey: getGetDashboardSummaryQueryKey({ userId }) } }
  );

  const { data: reminders } = useListReminders(
    { userId },
    { query: { enabled: !!userId, queryKey: getListRemindersQueryKey({ userId }) } }
  );

  const { data: alarms } = useListAlarms(
    { userId },
    { query: { enabled: !!userId, queryKey: getListAlarmsQueryKey({ userId }) } }
  );

  const upcomingReminders = reminders?.filter(r => !r.isCompleted && r.scheduledAt).slice(0, 5) || [];
  const activeAlarmsList = alarms?.filter(a => a.isActive).slice(0, 5) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-primary">Dashboard</h1>
          <p className="text-muted-foreground">Good to see you, {user?.displayName}. Here's your overview.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reminders" className="flex-1 md:flex-none">
            <Button className="w-full"><Plus className="w-4 h-4 mr-2" /> New Reminder</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reminders</CardTitle>
            <CheckSquare className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary?.pendingReminders || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Alarms</CardTitle>
            <Clock className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary?.activeAlarms || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Groups</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary?.totalGroups || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Completed</CardTitle>
            <CheckSquare className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary?.completedReminders || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              Upcoming Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingReminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming reminders.</p>
              ) : (
                upcomingReminders.map(reminder => (
                  <div key={reminder.id} className="flex items-start justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-foreground">{reminder.title}</p>
                      <p className="text-sm text-muted-foreground">{reminder.content || "No details"}</p>
                    </div>
                    {reminder.scheduledAt && (
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
                        {new Date(reminder.scheduledAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Active Alarms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeAlarmsList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active alarms.</p>
              ) : (
                activeAlarmsList.map(alarm => (
                  <div key={alarm.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-primary font-mono text-sm">
                        {new Date(alarm.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{alarm.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{alarm.repeatType} repeat</p>
                      </div>
                    </div>
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

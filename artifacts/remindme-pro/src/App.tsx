import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { useListAlarms, useUpdateAlarm, useListReminders } from "@workspace/api-client-react";
import { getListAlarmsQueryKey, getListRemindersQueryKey } from "@workspace/api-client-react";
import { playAlarmTone } from "@/lib/audio";

import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Reminders from "@/pages/reminders";
import Alarms from "@/pages/alarms";
import Groups from "@/pages/groups";
import GroupDetail from "@/pages/group-detail";
import Settings from "@/pages/settings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

function AlarmTriggerSystem() {
  const { user } = useAuth();
  const { data: alarms } = useListAlarms({ userId: user?.uid || "" }, { query: { enabled: !!user?.uid, queryKey: getListAlarmsQueryKey({ userId: user?.uid || "" }) } });
  const updateAlarm = useUpdateAlarm();
  const [triggeredAlarm, setTriggeredAlarm] = useState<{ id: number; title: string; soundEnabled: boolean; repeatType: string } | null>(null);

  useEffect(() => {
    if (!alarms) return;
    const interval = setInterval(() => {
      const now = new Date();
      alarms.forEach(alarm => {
        if (!alarm.isActive || !alarm.scheduledAt) return;
        const alarmTime = new Date(alarm.scheduledAt);
        if (alarmTime.getHours() === now.getHours() && alarmTime.getMinutes() === now.getMinutes() && now.getSeconds() < 30) {
          if (alarm.soundEnabled) playAlarmTone();
          setTriggeredAlarm(alarm);
          if (alarm.repeatType === "none") {
            updateAlarm.mutate({ id: alarm.id, data: { isActive: false } }, {
              onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAlarmsQueryKey({ userId: user?.uid || "" }) })
            });
          }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [alarms, updateAlarm, user]);

  return (
    <Dialog open={!!triggeredAlarm} onOpenChange={(o) => !o && setTriggeredAlarm(null)}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-mono text-primary text-center py-4">ALARM</DialogTitle>
          <DialogDescription className="text-center text-lg text-foreground font-medium">
            {triggeredAlarm?.title}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center mt-4">
          <Button size="lg" className="w-full" onClick={() => setTriggeredAlarm(null)}>Dismiss</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StartupPopup() {
  const { user } = useAuth();
  const userId = user?.uid || "";
  const [open, setOpen] = useState(false);
  const { data: reminders } = useListReminders({ userId }, { query: { enabled: !!userId, queryKey: getListRemindersQueryKey({ userId }) } });

  useEffect(() => {
    if (!user) return;
    const todayStr = new Date().toDateString();
    const lastOpened = localStorage.getItem("lastOpenedAt");
    if (lastOpened !== todayStr) {
      setOpen(true);
      localStorage.setItem("lastOpenedAt", todayStr);
    }
  }, [user]);

  const pending = reminders?.filter(r => !r.isCompleted) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-primary">
            {new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 17 ? "Good Afternoon" : "Good Evening"}, {user?.displayName}
          </DialogTitle>
          <DialogDescription>
            You have {pending.length} pending reminder{pending.length !== 1 ? "s" : ""} today.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center mt-4">
          <Button onClick={() => setOpen(false)}>Start Day</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProtectedApp({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-sm tracking-widest">LOADING...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <AlarmTriggerSystem />
      <StartupPopup />
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/">
        <ProtectedApp component={Dashboard} />
      </Route>
      <Route path="/reminders">
        <ProtectedApp component={Reminders} />
      </Route>
      <Route path="/alarms">
        <ProtectedApp component={Alarms} />
      </Route>
      <Route path="/groups">
        <ProtectedApp component={Groups} />
      </Route>
      <Route path="/groups/:id">
        <ProtectedApp component={GroupDetail} />
      </Route>
      <Route path="/settings">
        <ProtectedApp component={Settings} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => console.log('SW registered:', registration))
        .catch((error) => console.log('SW registration failed:', error));
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

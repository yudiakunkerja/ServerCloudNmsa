import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LogOut, User as UserIcon, Bell, MonitorSmartphone } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  // For local settings UI
  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === "granted");
  const [alarmSound, setAlarmSound] = useState(true);

  const handleRequestNotifications = async () => {
    try {
      const perm = await Notification.requestPermission();
      setNotificationsEnabled(perm === "granted");
      if (perm === "granted") {
        toast({ title: "Notifications enabled" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif text-primary">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences.</p>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserIcon className="w-5 h-5 text-primary" /> Profile
          </CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={user?.displayName || ""} disabled className="bg-secondary/50 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="bg-secondary/50 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <Label>User ID</Label>
            <Input value={user?.uid || ""} disabled className="font-mono text-xs bg-secondary/50 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-primary" /> Notifications & Audio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive background alerts for alarms and groups.</p>
            </div>
            {notificationsEnabled ? (
              <div className="text-sm font-medium text-primary px-3 py-1 bg-primary/10 rounded-full">Enabled</div>
            ) : (
              <Button variant="outline" size="sm" onClick={handleRequestNotifications}>Enable</Button>
            )}
          </div>
          
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="space-y-0.5">
              <Label className="text-base">Alarm Sounds</Label>
              <p className="text-sm text-muted-foreground">Play tone when app is open.</p>
            </div>
            <Switch checked={alarmSound} onCheckedChange={setAlarmSound} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur border-destructive/20 border">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="w-full" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

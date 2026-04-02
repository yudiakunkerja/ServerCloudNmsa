import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  useListAlarms, 
  getListAlarmsQueryKey,
  useCreateAlarm,
  useUpdateAlarm,
  useDeleteAlarm
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Bell, BellOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function Alarms() {
  const { user } = useAuth();
  const userId = user?.uid || "";
  const queryClient = useQueryClient();

  const { data: alarms, isLoading } = useListAlarms(
    { userId },
    { query: { enabled: !!userId, queryKey: getListAlarmsQueryKey({ userId }) } }
  );

  const createAlarm = useCreateAlarm();
  const updateAlarm = useUpdateAlarm();
  const deleteAlarm = useDeleteAlarm();

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [repeatType, setRepeatType] = useState<"none" | "daily" | "weekly" | "monthly">("none");

  const handleCreate = () => {
    if (!title.trim() || !time) return;
    
    const today = new Date();
    const [hours, minutes] = time.split(':');
    const scheduledAt = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes)).toISOString();

    createAlarm.mutate({
      data: {
        userId,
        title,
        scheduledAt,
        repeatType,
        soundEnabled: true
      }
    }, {
      onSuccess: () => {
        setIsCreating(false);
        setTitle("");
        setTime("");
        queryClient.invalidateQueries({ queryKey: getListAlarmsQueryKey({ userId }) });
      }
    });
  };

  const handleToggleActive = (id: number, isActive: boolean) => {
    updateAlarm.mutate({
      id,
      data: { isActive: !isActive }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAlarmsQueryKey({ userId }) });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteAlarm.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAlarmsQueryKey({ userId }) });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif text-primary">Alarms</h1>
          <p className="text-muted-foreground">Precision timing.</p>
        </div>
        <Button onClick={() => setIsCreating(true)}><Plus className="w-4 h-4 mr-2" /> New Alarm</Button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-card border-border">
              <CardContent className="pt-6 space-y-4">
                <Input placeholder="Alarm Title" value={title} onChange={e => setTitle(e.target.value)} className="bg-background" />
                <div className="flex gap-4">
                  <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-background flex-1" />
                  <Select value={repeatType} onValueChange={(v: any) => setRepeatType(v)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Repeat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Once</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!title.trim() || !time || createAlarm.isPending}>Save</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center p-8 text-muted-foreground">Loading...</div>
        ) : alarms?.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-card/50 rounded-lg border border-border border-dashed">
            <BellOff className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No active alarms</h3>
            <p className="text-muted-foreground">Set one to keep on schedule.</p>
          </div>
        ) : (
          alarms?.map(alarm => (
            <Card key={alarm.id} className={`bg-card/50 backdrop-blur border-border transition-all ${!alarm.isActive ? 'opacity-60' : 'border-primary/20'}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-4xl font-mono text-primary font-light tracking-tighter">
                      {format(new Date(alarm.scheduledAt), "HH:mm")}
                    </div>
                    <h3 className="font-medium text-foreground mt-2">{alarm.title}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{alarm.repeatType} repeat</p>
                  </div>
                  <div className="flex flex-col items-end gap-4">
                    <Switch checked={alarm.isActive} onCheckedChange={() => handleToggleActive(alarm.id, alarm.isActive)} />
                    <button onClick={() => handleDelete(alarm.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

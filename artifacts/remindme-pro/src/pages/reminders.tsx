import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  useListReminders, 
  getListRemindersQueryKey,
  useCreateReminder,
  useUpdateReminder,
  useDeleteReminder
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, CheckCircle, Circle, Clock, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function Reminders() {
  const { user } = useAuth();
  const userId = user?.uid || "";
  const queryClient = useQueryClient();

  const { data: reminders, isLoading } = useListReminders(
    { userId },
    { query: { enabled: !!userId, queryKey: getListRemindersQueryKey({ userId }) } }
  );

  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();

  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"reminder" | "note">("reminder");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const handleCreate = () => {
    if (!title.trim()) return;
    createReminder.mutate({
      data: {
        userId,
        title,
        content,
        type,
        priority
      }
    }, {
      onSuccess: () => {
        setIsCreating(false);
        setTitle("");
        setContent("");
        queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey({ userId }) });
      }
    });
  };

  const handleToggleComplete = (id: number, isCompleted: boolean) => {
    updateReminder.mutate({
      id,
      data: { isCompleted: !isCompleted }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey({ userId }) });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteReminder.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey({ userId }) });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif text-primary">Reminders</h1>
          <p className="text-muted-foreground">Manage your tasks and notes.</p>
        </div>
        <Button onClick={() => setIsCreating(true)}><Plus className="w-4 h-4 mr-2" /> New</Button>
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
                <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="bg-background" />
                <Textarea placeholder="Details (optional)" value={content} onChange={e => setContent(e.target.value)} className="bg-background" />
                <div className="flex gap-4">
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!title.trim() || createReminder.isPending}>Save</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center p-8 text-muted-foreground">Loading...</div>
        ) : reminders?.length === 0 ? (
          <div className="text-center p-12 bg-card/50 rounded-lg border border-border border-dashed">
            <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No reminders yet</h3>
            <p className="text-muted-foreground">Create one to get started.</p>
          </div>
        ) : (
          reminders?.map(reminder => (
            <Card key={reminder.id} className={`bg-card/50 backdrop-blur border-border transition-all ${reminder.isCompleted ? 'opacity-50' : ''}`}>
              <CardContent className="p-4 flex items-start gap-4">
                <button onClick={() => handleToggleComplete(reminder.id, reminder.isCompleted)} className="mt-1 text-primary hover:text-primary/80 transition-colors">
                  {reminder.isCompleted ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium text-foreground ${reminder.isCompleted ? 'line-through' : ''}`}>{reminder.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      reminder.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                      reminder.priority === 'medium' ? 'bg-primary/20 text-primary' :
                      'bg-secondary text-secondary-foreground'
                    }`}>
                      {reminder.priority}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                      {reminder.type}
                    </span>
                  </div>
                  {reminder.content && (
                    <p className={`text-sm text-muted-foreground mt-1 ${reminder.isCompleted ? 'line-through' : ''}`}>
                      {reminder.content}
                    </p>
                  )}
                  {reminder.scheduledAt && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(reminder.scheduledAt), "MMM d, yyyy h:mm a")}
                    </div>
                  )}
                </div>
                <button onClick={() => handleDelete(reminder.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  useListGroups, 
  getListGroupsQueryKey,
  useCreateGroup,
  useJoinGroup
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, ArrowRight, Copy } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Groups() {
  const { user } = useAuth();
  const userId = user?.uid || "";
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: groups, isLoading } = useListGroups(
    { userId },
    { query: { enabled: !!userId, queryKey: getListGroupsQueryKey({ userId }) } }
  );

  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    createGroup.mutate({
      data: {
        name,
        description,
        ownerId: userId
      }
    }, {
      onSuccess: () => {
        setIsCreating(false);
        setName("");
        setDescription("");
        queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey({ userId }) });
      }
    });
  };

  const handleJoin = () => {
    if (!inviteCode.trim()) return;
    joinGroup.mutate({
      id: 0, // id is not strictly used in URL if it's POST /api/groups/join body, wait let's check generated API
      // Actually joinGroup is POST /api/groups/:id/join ? wait let me check api
      // The openapi says POST /api/groups/join -> body { userId, inviteCode }
      data: {
        userId,
        inviteCode
      }
    }, {
      onSuccess: () => {
        setIsJoining(false);
        setInviteCode("");
        queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey({ userId }) });
        toast({ title: "Joined group successfully" });
      },
      onError: () => {
        toast({ title: "Invalid invite code", variant: "destructive" });
      }
    });
  };

  const copyInvite = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Invite code copied to clipboard" });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif text-primary">Groups</h1>
          <p className="text-muted-foreground">Collaborate seamlessly.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setIsJoining(true); setIsCreating(false); }}>Join Group</Button>
          <Button onClick={() => { setIsCreating(true); setIsJoining(false); }}><Plus className="w-4 h-4 mr-2" /> Create</Button>
        </div>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="bg-card border-border">
              <CardContent className="pt-6 space-y-4">
                <Input placeholder="Group Name" value={name} onChange={e => setName(e.target.value)} />
                <Input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!name.trim() || createGroup.isPending}>Create Group</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {isJoining && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="bg-card border-border">
              <CardContent className="pt-6 space-y-4">
                <Input placeholder="Paste Invite Code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsJoining(false)}>Cancel</Button>
                  <Button onClick={handleJoin} disabled={!inviteCode.trim() || joinGroup.isPending}>Join Group</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center p-8 text-muted-foreground">Loading...</div>
        ) : groups?.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-card/50 rounded-lg border border-border border-dashed">
            <Users className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No groups yet</h3>
            <p className="text-muted-foreground">Create or join one to collaborate.</p>
          </div>
        ) : (
          groups?.map(group => (
            <Card key={group.id} className="bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all flex flex-col group">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-medium text-foreground">{group.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-mono bg-secondary px-2 py-1 rounded text-primary cursor-pointer hover:bg-secondary/80" onClick={() => copyInvite(group.inviteCode)} title="Copy Invite Code">
                  {group.inviteCode}
                  <Copy className="w-3 h-3" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {group.memberCount} members
                  </div>
                  <Link href={`/groups/${group.id}`}>
                    <Button variant="ghost" size="sm" className="group-hover:bg-primary/10 group-hover:text-primary">
                      Enter <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

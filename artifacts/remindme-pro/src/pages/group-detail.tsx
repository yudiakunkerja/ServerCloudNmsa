import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  useGetGroup, 
  getGetGroupQueryKey,
  useListGroupMessages,
  getListGroupMessagesQueryKey,
  useSendGroupMessage,
  useListGroupMembers,
  getListGroupMembersQueryKey,
  useSendNotification
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft, Users } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const groupId = parseInt(id || "0");
  const { user } = useAuth();
  const userId = user?.uid || "";
  const queryClient = useQueryClient();

  const { data: group } = useGetGroup(groupId, { query: { enabled: !!groupId, queryKey: getGetGroupQueryKey(groupId) } });
  const { data: members } = useListGroupMembers(groupId, { query: { enabled: !!groupId, queryKey: getListGroupMembersQueryKey(groupId) } });
  
  // Local state for messages to handle real-time updates without constant refetching
  const [messages, setMessages] = useState<any[]>([]);
  const { data: initialMessages } = useListGroupMessages(groupId, {
    query: {
      enabled: !!groupId,
      queryKey: getListGroupMessagesQueryKey(groupId),
      refetchInterval: 3000
    }
  });

  const sendMessage = useSendGroupMessage();
  const sendNotification = useSendNotification();

  const [messageContent, setMessageContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync messages from query into local state and auto-scroll
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
      scrollToBottom();
    }
  }, [initialMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!messageContent.trim()) return;
    const content = messageContent;
    setMessageContent(""); // optimistic clear

    try {
      await sendMessage.mutateAsync({
        id: groupId,
        data: {
          senderId: userId,
          senderName: user?.displayName || "Unknown",
          content,
          messageType: "message",
        }
      });
      
      // Trigger push notification to other members
      sendNotification.mutate({
        data: {
          groupId,
          title: `New message in ${group?.name}`,
          body: `${user?.displayName}: ${content}`,
          senderId: userId
        }
      });

      queryClient.invalidateQueries({ queryKey: getListGroupMessagesQueryKey(groupId) });
      scrollToBottom();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-5rem)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-4 border-b border-border pb-4">
        <Link href="/groups">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-serif text-primary">{group?.name}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3 h-3" /> {members?.length || 0} members
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-card/20 rounded-lg border border-border mb-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="m-auto text-center text-muted-foreground text-sm">
            No messages yet. Say hello.
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === userId;
            return (
              <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && <span className="text-xs text-muted-foreground mb-1 ml-1">{msg.senderName}</span>}
                <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                  isMe 
                    ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                    : 'bg-secondary text-secondary-foreground rounded-tl-sm'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                  {format(new Date(msg.createdAt), "HH:mm")}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Input 
          placeholder="Type a message..." 
          value={messageContent} 
          onChange={e => setMessageContent(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="bg-card"
        />
        <Button onClick={handleSend} disabled={!messageContent.trim() || sendMessage.isPending}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

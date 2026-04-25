import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { useUnread } from "@/hooks/useUnread";

interface Profile { id: string; username: string; display_name: string | null; avatar_url: string | null; }
interface Message { id: string; sender_id: string; recipient_id: string; content: string; created_at: string; }

export default function DM() {
  const { friendId } = useParams<{ friendId: string }>();
  const { user } = useAuth();
  const { markRead } = useUnread();
  const nav = useNavigate();
  const [friend, setFriend] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!friendId) return;
    supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", friendId).maybeSingle()
      .then(({ data }) => setFriend(data));
  }, [friendId]);

  useEffect(() => {
    if (!user || !friendId) return;
    supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) { toast.error(error.message); return; }
        setMessages(data || []);
      });

    // Mark conversation as read when opened
    markRead(friendId);

    const ch = supabase
      .channel(`dm-${user.id}-${friendId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const m = payload.new as Message;
        if (
          (m.sender_id === user.id && m.recipient_id === friendId) ||
          (m.sender_id === friendId && m.recipient_id === user.id)
        ) {
          setMessages((prev) => [...prev, m]);
          // If incoming while viewing, keep marker fresh
          if (m.sender_id === friendId) markRead(friendId);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, friendId, markRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !friendId) return;
    const content = text.trim();
    if (!content) return;
    setText("");
    const { error } = await supabase.from("direct_messages").insert({
      sender_id: user.id, recipient_id: friendId, content,
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/app/friends")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarImage src={friend?.avatar_url ?? undefined} />
          <AvatarFallback>{friend?.username.slice(0,2).toUpperCase() ?? "?"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="font-medium truncate">{friend?.display_name || friend?.username || "…"}</div>
          <div className="text-xs text-muted-foreground truncate">@{friend?.username}</div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
        <div className="max-w-2xl mx-auto space-y-2">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12">
              This is the beginning of your conversation with @{friend?.username}.
            </div>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                  mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>

      <form onSubmit={send} className="border-t border-border px-4 py-3 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message @${friend?.username ?? ""}`}
          maxLength={2000}
        />
        <Button type="submit" disabled={!text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

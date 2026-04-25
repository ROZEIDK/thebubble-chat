import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

interface UnreadCtx {
  counts: Record<string, number>;
  total: number;
  markRead: (friendId: string) => Promise<void>;
}

const Ctx = createContext<UnreadCtx>({ counts: {}, total: 0, markRead: async () => {} });

export const UnreadProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const loc = useLocation();
  const locRef = useRef(loc.pathname);
  useEffect(() => { locRef.current = loc.pathname; }, [loc.pathname]);

  const refresh = useCallback(async () => {
    if (!user) { setCounts({}); return; }
    const { data: reads } = await supabase
      .from("dm_reads")
      .select("friend_id,last_read_at")
      .eq("user_id", user.id);
    const readMap = new Map<string, string>();
    (reads || []).forEach((r) => readMap.set(r.friend_id as string, r.last_read_at as string));

    const { data: msgs } = await supabase
      .from("direct_messages")
      .select("sender_id,created_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500);

    const next: Record<string, number> = {};
    (msgs || []).forEach((m) => {
      const last = readMap.get(m.sender_id as string);
      if (!last || new Date(m.created_at as string) > new Date(last)) {
        next[m.sender_id as string] = (next[m.sender_id as string] || 0) + 1;
      }
    });
    setCounts(next);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Realtime: increment on new incoming DMs (unless user is viewing that DM)
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`unread-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `recipient_id=eq.${user.id}` },
        async (payload) => {
          const m = payload.new as { sender_id: string; content: string };
          // If user is currently viewing this conversation, don't increment — just mark read.
          if (locRef.current === `/app/dm/${m.sender_id}`) {
            await supabase
              .from("dm_reads")
              .upsert({ user_id: user.id, friend_id: m.sender_id, last_read_at: new Date().toISOString() });
            return;
          }
          // Look up sender username for the toast
          const { data: prof } = await supabase
            .from("profiles")
            .select("username,display_name")
            .eq("id", m.sender_id)
            .maybeSingle();
          const name = prof?.display_name || prof?.username || "Someone";
          toast(`New message from @${prof?.username ?? "user"}`, {
            description: m.content.length > 80 ? m.content.slice(0, 80) + "…" : m.content,
          });
          // Soft "ping" sound
          try {
            const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
            if (AudioCtx) {
              const ctx = new AudioCtx();
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.connect(g); g.connect(ctx.destination);
              o.type = "sine";
              o.frequency.setValueAtTime(880, ctx.currentTime);
              o.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
              g.gain.setValueAtTime(0.0001, ctx.currentTime);
              g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
              g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
              o.start();
              o.stop(ctx.currentTime + 0.3);
            }
          } catch { /* ignore */ }
          setCounts((prev) => ({ ...prev, [m.sender_id]: (prev[m.sender_id] || 0) + 1 }));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const markRead = useCallback(async (friendId: string) => {
    if (!user) return;
    await supabase
      .from("dm_reads")
      .upsert({ user_id: user.id, friend_id: friendId, last_read_at: new Date().toISOString() });
    setCounts((prev) => {
      if (!prev[friendId]) return prev;
      const next = { ...prev };
      delete next[friendId];
      return next;
    });
  }, [user]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return <Ctx.Provider value={{ counts, total, markRead }}>{children}</Ctx.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUnread = () => useContext(Ctx);

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageSquare, UserPlus, Check, X, Search, Users } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
  requester: Profile;
  addressee: Profile;
}

export default function Friends() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status, requester:profiles!friendships_requester_id_fkey(id,username,display_name,avatar_url,bio), addressee:profiles!friendships_addressee_id_fkey(id,username,display_name,avatar_url,bio)")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    if (error) { toast.error(error.message); return; }
    setFriendships((data || []) as unknown as Friendship[]);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("friendships-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const accepted = friendships.filter((f) => f.status === "accepted");
  const incoming = friendships.filter((f) => f.status === "pending" && f.addressee_id === user?.id);
  const outgoing = friendships.filter((f) => f.status === "pending" && f.requester_id === user?.id);

  const friendOf = (f: Friendship) => (f.requester_id === user?.id ? f.addressee : f.requester);

  const search = async (q: string) => {
    setSearchQ(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url,bio")
      .ilike("username", `%${q.trim()}%`)
      .neq("id", user?.id ?? "")
      .limit(10);
    setSearching(false);
    if (error) { toast.error(error.message); return; }
    setSearchResults(data || []);
  };

  const sendRequest = async (addressee: Profile) => {
    if (!user) return;
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: addressee.id,
      status: "pending",
    });
    if (error) {
      if (error.code === "23505") toast.error("You already have a request with this user.");
      else toast.error(error.message);
      return;
    }
    toast.success(`Request sent to @${addressee.username}`);
    load();
  };

  const respond = async (id: string, status: "accepted" | "reject") => {
    if (status === "reject") {
      const { error } = await supabase.from("friendships").delete().eq("id", id);
      if (error) return toast.error(error.message);
      toast.success("Request declined");
    } else {
      const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
      if (error) return toast.error(error.message);
      toast.success("Friend added!");
    }
    load();
  };

  const knownIds = new Set(friendships.flatMap((f) => [f.requester_id, f.addressee_id]));

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Friends</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
        <Tabs defaultValue="all" className="max-w-3xl mx-auto">
          <TabsList className="bg-muted">
            <TabsTrigger value="all">All ({accepted.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({incoming.length + outgoing.length})</TabsTrigger>
            <TabsTrigger value="add">Add Friend</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-2">
            {accepted.length === 0 ? (
              <EmptyState text="No friends yet — head to Add Friend to find someone." />
            ) : accepted.map((f) => {
              const p = friendOf(f);
              return (
                <Card key={f.id} className="bg-surface border-border p-4 flex items-center gap-4">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback>{p.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.display_name || p.username}</div>
                    <div className="text-xs text-muted-foreground truncate">@{p.username}</div>
                  </div>
                  <Button size="sm" onClick={() => nav(`/app/dm/${p.id}`)}>
                    <MessageSquare className="h-4 w-4 mr-2" /> Message
                  </Button>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="pending" className="mt-6 space-y-6">
            <Section title={`Incoming (${incoming.length})`}>
              {incoming.length === 0 ? <EmptyState text="No incoming requests." /> :
                incoming.map((f) => (
                  <Card key={f.id} className="bg-surface border-border p-4 flex items-center gap-4">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={f.requester.avatar_url ?? undefined} />
                      <AvatarFallback>{f.requester.username.slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{f.requester.display_name || f.requester.username}</div>
                      <div className="text-xs text-muted-foreground truncate">@{f.requester.username}</div>
                    </div>
                    <Button size="icon" variant="secondary" onClick={() => respond(f.id, "accepted")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => respond(f.id, "reject")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </Card>
                ))}
            </Section>

            <Section title={`Outgoing (${outgoing.length})`}>
              {outgoing.length === 0 ? <EmptyState text="No outgoing requests." /> :
                outgoing.map((f) => (
                  <Card key={f.id} className="bg-surface border-border p-4 flex items-center gap-4">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={f.addressee.avatar_url ?? undefined} />
                      <AvatarFallback>{f.addressee.username.slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{f.addressee.display_name || f.addressee.username}</div>
                      <div className="text-xs text-muted-foreground truncate">@{f.addressee.username} · pending</div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => respond(f.id, "reject")}>Cancel</Button>
                  </Card>
                ))}
            </Section>
          </TabsContent>

          <TabsContent value="add" className="mt-6">
            <Card className="bg-surface border-border p-5">
              <label className="text-sm text-muted-foreground mb-2 block">Search by username</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQ}
                  onChange={(e) => search(e.target.value)}
                  placeholder="e.g. bumble_bee"
                  className="pl-9"
                />
              </div>

              <div className="mt-4 space-y-2">
                {searching && <div className="text-sm text-muted-foreground">Searching…</div>}
                {!searching && searchQ.length >= 2 && searchResults.length === 0 && (
                  <div className="text-sm text-muted-foreground">No users found.</div>
                )}
                {searchResults.map((p) => {
                  const already = knownIds.has(p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={p.avatar_url ?? undefined} />
                        <AvatarFallback>{p.username.slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{p.display_name || p.username}</div>
                        <div className="text-xs text-muted-foreground truncate">@{p.username}</div>
                      </div>
                      <Button size="sm" disabled={already} onClick={() => sendRequest(p)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {already ? "Pending/Friends" : "Add"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-6 text-center">{text}</div>;
}

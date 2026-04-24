import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Camera, Loader2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const usernameRe = /^[a-zA-Z0-9_]{3,20}$/;
const profileSchema = z.object({
  username: z.string().regex(usernameRe, "3-20 chars, letters/numbers/underscores"),
  display_name: z.string().trim().max(40, "Max 40 chars").optional().or(z.literal("")),
  bio: z.string().trim().max(280, "Max 280 chars").optional().or(z.literal("")),
});

interface ProfileRow {
  id: string; username: string; display_name: string | null; bio: string | null; avatar_url: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setProfile(data);
      setUsername(data.username);
      setDisplayName(data.display_name ?? "");
      setBio(data.bio ?? "");
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    const parsed = profileSchema.safeParse({ username, display_name: displayName, bio });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      username: parsed.data.username,
      display_name: parsed.data.display_name || null,
      bio: parsed.data.bio || "",
    }).eq("id", user.id);
    setSaving(false);
    if (error) {
      if (error.code === "23505") toast.error("That username is already taken.");
      else toast.error(error.message);
      return;
    }
    toast.success("Profile saved");
    setProfile((p) => p ? { ...p, username, display_name: displayName, bio } : p);
  };

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 4 * 1024 * 1024) { toast.error("Max file size: 4MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true, contentType: file.type,
    });
    if (upErr) { setUploading(false); toast.error(upErr.message); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: updErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setUploading(false);
    if (updErr) { toast.error(updErr.message); return; }
    setProfile((p) => p ? { ...p, avatar_url: url } : p);
    toast.success("Avatar updated");
  };

  if (!profile) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <UserCog className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Edit Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-thin">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="bg-surface border-border p-6 flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-xl">{profile.username.slice(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-soft hover:opacity-90">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                <input type="file" accept="image/*" className="hidden" onChange={onAvatar} disabled={uploading} />
              </label>
            </div>
            <div className="min-w-0">
              <div className="text-lg font-semibold truncate">{profile.display_name || profile.username}</div>
              <div className="text-sm text-muted-foreground truncate">@{profile.username}</div>
            </div>
          </Card>

          <Card className="bg-surface border-border p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username (@)</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} />
              <p className="text-xs text-muted-foreground">3–20 characters · letters, numbers, underscores</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="display">Display name</Label>
              <Input id="display" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={4} placeholder="Tell people a bit about you…" />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/280</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { MessageCircle, Loader2 } from "lucide-react";

const usernameRe = /^[a-zA-Z0-9_]{3,20}$/;

const signupSchema = z.object({
  username: z.string().regex(usernameRe, "3-20 chars, letters/numbers/underscores"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  dob: z.string().refine((d) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return false;
    const age = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return age >= 13 && age < 120;
  }, "You must be at least 13 years old"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

export default function Auth() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to="/app" replace />;

  const onSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({
      username: String(fd.get("username") || ""),
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || ""),
      dob: String(fd.get("dob") || ""),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { username: parsed.data.username, date_of_birth: parsed.data.dob },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome to The Bumble Chat!");
    nav("/app");
  };

  const onLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || ""),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    nav("/app");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-accent-grad flex items-center justify-center shadow-glow mb-4">
            <MessageCircle className="h-7 w-7 text-foreground" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">The Bumble Chat</h1>
          <p className="text-sm text-muted-foreground mt-2">Talk, tag, hangout.</p>
        </div>

        <Card className="bg-surface border-border shadow-soft p-6">
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full mb-6 bg-muted">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={onLogin} className="space-y-4">
                <Field label="Email" name="email" type="email" autoComplete="email" />
                <Field label="Password" name="password" type="password" autoComplete="current-password" />
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={onSignup} className="space-y-4">
                <Field label="Username" name="username" placeholder="bumble_bee" />
                <Field label="Email" name="email" type="email" autoComplete="email" />
                <Field label="Password" name="password" type="password" autoComplete="new-password" />
                <Field label="Date of birth" name="dob" type="date" />
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </main>
  );
}

function Field({ label, name, type = "text", ...rest }: { label: string; name: string; type?: string; autoComplete?: string; placeholder?: string; }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required {...rest} />
    </div>
  );
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

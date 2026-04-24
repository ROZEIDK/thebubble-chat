import { Server, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Servers() {
  return (
    <div className="h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <Server className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Servers</h1>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="bg-surface border-border p-10 max-w-md text-center shadow-soft">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-accent-grad flex items-center justify-center shadow-glow mb-4">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Servers are coming soon</h2>
          <p className="text-sm text-muted-foreground">
            We're crafting something special. Servers will let you create communities, channels, and group chats — stay tuned.
          </p>
        </Card>
      </div>
    </div>
  );
}

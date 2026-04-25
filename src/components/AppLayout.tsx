import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Users, Server, UserCog, LogOut, MessageCircle, Github } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnread } from "@/hooks/useUnread";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const items = [
  { to: "/app/friends", label: "Friends", icon: Users },
  { to: "/app/servers", label: "Servers", icon: Server },
  { to: "/app/profile", label: "Profile", icon: UserCog },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const { total } = useUnread();
  const loc = useLocation();

  return (
    <div className="min-h-screen flex w-full">
      <aside className="w-[72px] shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 gap-2">
        <div className="h-10 w-10 rounded-xl bg-accent-grad flex items-center justify-center shadow-glow mb-4">
          <MessageCircle className="h-5 w-5" />
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {items.map((it) => {
            const active = loc.pathname.startsWith(it.to);
            const showBadge = it.to === "/app/friends" && total > 0;
            return (
              <Tooltip key={it.to} delayDuration={150}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={it.to}
                    className={`relative group h-11 w-11 rounded-xl flex items-center justify-center transition-all ${
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <it.icon className="h-5 w-5" />
                    {showBadge && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold leading-none flex items-center justify-center ring-2 ring-sidebar">
                        {total > 99 ? "99+" : total}
                      </span>
                    )}
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">{it.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View on GitHub"
              className="h-11 w-11 rounded-xl flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="right">Contribute on GitHub</TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-11 w-11 rounded-xl text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Sign out</TooltipContent>
        </Tooltip>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

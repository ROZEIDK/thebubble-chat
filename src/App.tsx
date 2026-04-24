import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import RequireAuth from "@/components/RequireAuth";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Friends from "./pages/Friends";
import Servers from "./pages/Servers";
import Profile from "./pages/Profile";
import DM from "./pages/DM";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/app"
              element={
                <RequireAuth>
                  <AppLayout>
                    <Navigate to="/app/friends" replace />
                  </AppLayout>
                </RequireAuth>
              }
            />
            <Route path="/app/friends" element={<RequireAuth><AppLayout><Friends /></AppLayout></RequireAuth>} />
            <Route path="/app/servers" element={<RequireAuth><AppLayout><Servers /></AppLayout></RequireAuth>} />
            <Route path="/app/profile" element={<RequireAuth><AppLayout><Profile /></AppLayout></RequireAuth>} />
            <Route path="/app/dm/:friendId" element={<RequireAuth><AppLayout><DM /></AppLayout></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

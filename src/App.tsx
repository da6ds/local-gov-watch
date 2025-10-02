import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { GlobalBanner } from "@/components/GlobalBanner";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import DigestPreview from "./pages/DigestPreview";
import Connectors from "./pages/admin/Connectors";
import Settings from "./pages/Settings";
import BrowseLegislation from "./pages/browse/Legislation";
import BrowseMeetings from "./pages/browse/Meetings";
import BrowseElections from "./pages/browse/Elections";
import LegislationDetail from "./pages/details/LegislationDetail";
import MeetingDetail from "./pages/details/MeetingDetail";
import ElectionDetail from "./pages/details/ElectionDetail";
import Calendar from "./pages/Calendar";
import Watchlists from "./pages/Watchlists";
import NotFound from "./pages/NotFound";
import Trends from "./pages/browse/Trends";
import Digest from "./pages/Digest";
import Unsubscribe from "./pages/Unsubscribe";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <GlobalBanner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/digest-preview" element={<DigestPreview />} />
                <Route path="/admin/connectors" element={<Connectors />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/browse/legislation" element={<BrowseLegislation />} />
                <Route path="/browse/meetings" element={<BrowseMeetings />} />
                <Route path="/browse/elections" element={<BrowseElections />} />
                <Route path="/browse/trends" element={<Trends />} />
                <Route path="/legislation/:id" element={<LegislationDetail />} />
                <Route path="/meetings/:id" element={<MeetingDetail />} />
                <Route path="/elections/:id" element={<ElectionDetail />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/digest" element={<Digest />} />
                <Route path="/unsubscribe/:token" element={<Unsubscribe />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/watchlists" element={<Watchlists />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

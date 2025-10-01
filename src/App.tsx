import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
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
import DigestSettings from "./pages/settings/DigestSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/browse/legislation" element={<BrowseLegislation />} />
            <Route path="/browse/meetings" element={<BrowseMeetings />} />
            <Route path="/browse/elections" element={<BrowseElections />} />
            <Route path="/browse/trends" element={<Trends />} />
            <Route path="/legislation/:id" element={<LegislationDetail />} />
            <Route path="/meeting/:id" element={<MeetingDetail />} />
            <Route path="/election/:id" element={<ElectionDetail />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/watchlists" element={<Watchlists />} />
            <Route path="/settings/digest" element={<DigestSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

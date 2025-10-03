import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { WalkthroughProvider } from "@/components/WalkthroughProvider";
import { useOnboarding } from "@/hooks/useOnboarding";
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
import Alerts from "./pages/Alerts";
import Unsubscribe from "./pages/Unsubscribe";
import Search from "./pages/Search";
import Stances from "./pages/Stances";
import Auth from "./pages/Auth";
import TrackedTerms from "./pages/TrackedTerms";
import TrackedTermMatches from "./pages/TrackedTermMatches";
import MyLists from "./pages/MyLists";

const queryClient = new QueryClient();

function AppContent() {
  const {
    showOnboarding,
    showWalkthrough,
    setShowWalkthrough,
    completeOnboarding,
    skipOnboarding,
  } = useOnboarding();

  return (
    <>
      <OnboardingDialog
        open={showOnboarding}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />
      <WalkthroughProvider
        run={showWalkthrough}
        onComplete={() => setShowWalkthrough(false)}
      />
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
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/digest" element={<Navigate to="/alerts" replace />} />
        <Route path="/search" element={<Search />} />
        <Route path="/stances" element={<Stances />} />
        <Route path="/tracked-terms" element={<TrackedTerms />} />
        <Route path="/tracked-terms/:id/matches" element={<TrackedTermMatches />} />
        <Route path="/lists" element={<MyLists />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/unsubscribe/:token" element={<Unsubscribe />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        <Route path="/watchlists" element={<Watchlists />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

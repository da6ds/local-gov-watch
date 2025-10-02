import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, Scale } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { RefreshControl } from "@/components/RefreshControl";
import { getGuestScope, setGuestScope } from "@/lib/guestSessionStorage";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BrowseDropdown } from "@/components/nav/BrowseDropdown";
import { MyWorkspaceDropdown } from "@/components/nav/MyWorkspaceDropdown";
import { SearchIconButton } from "@/components/nav/SearchIconButton";
import { OmniFiltersBar } from "@/components/nav/OmniFiltersBar";
import { useDemoUser } from "@/hooks/useDemoUser";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const queryClient = useQueryClient();
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);
  const { isLoggedIn } = useDemoUser();

  // Initialize from session storage
  useEffect(() => {
    setSelectedJurisdictions(getGuestScope());
  }, []);

  // Handle jurisdiction change
  const handleJurisdictionChange = (slugs: string[]) => {
    setSelectedJurisdictions(slugs);
    setGuestScope(slugs);
    
    // Invalidate all data queries
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
    queryClient.invalidateQueries({ queryKey: ['browse'] });
    queryClient.invalidateQueries({ queryKey: ['trends'] });
    
    toast.success("Location updated");
  };

  const mobileNavItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/browse/legislation", label: "Legislation" },
    { href: "/browse/meetings", label: "Meetings" },
    { href: "/browse/elections", label: "Elections" },
    { href: "/browse/trends", label: "Trends" },
    { href: "/calendar", label: "Calendar" },
    { href: "/digest", label: "Digest" },
  ];

  const hasActiveFilters = selectedJurisdictions.length > 0;

  const handleClearAll = () => {
    handleJurisdictionChange([]);
    toast.success("All filters cleared");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Primary Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex flex-col gap-4 mt-4">
                <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2 mb-4">
                  <Scale className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Local Gov Watch</span>
                </Link>
                <nav className="flex flex-col gap-2">
                  {mobileNavItems.map((item) => (
                    <Button
                      key={item.href}
                      variant={location.pathname === item.href ? "secondary" : "ghost"}
                      className="justify-start touch-target"
                      asChild
                      onClick={() => setOpen(false)}
                    >
                      <Link to={item.href}>
                        {item.label}
                      </Link>
                    </Button>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2 ml-4 md:ml-0">
            <Scale className="h-5 w-5 text-primary" />
            <span className="font-semibold hidden sm:inline-block">Local Gov Watch</span>
          </Link>

          {/* Desktop Primary Nav */}
          <nav className="hidden md:flex items-center gap-2 ml-8">
            <Button
              variant={location.pathname === "/dashboard" ? "secondary" : "ghost"}
              asChild
            >
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <BrowseDropdown />
            <Button
              variant={location.pathname === "/digest" ? "secondary" : "ghost"}
              asChild
            >
              <Link to="/digest">Digest</Link>
            </Button>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {isLoggedIn && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hidden sm:flex">
                    Demo Mode
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Your data is temporary and will clear when you close this tab
                </TooltipContent>
              </Tooltip>
            )}
            <SearchIconButton />
            <div className="hidden md:flex">
              <MyWorkspaceDropdown />
            </div>
            <div className="hidden md:flex">
              <RefreshControl />
            </div>
          </div>
        </div>
      </header>

      {/* OmniFilters Bar */}
      <OmniFiltersBar
        selectedJurisdictions={selectedJurisdictions}
        onJurisdictionChange={handleJurisdictionChange}
        onClearAll={handleClearAll}
        showClearAll={hasActiveFilters}
      />

      <main className="container py-6 mt-12">{children}</main>

      <footer className="border-t py-4 md:py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Local Gov Watch</p>
        </div>
      </footer>
    </div>
  );
}
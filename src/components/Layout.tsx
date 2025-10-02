import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Scale } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TopicsPopover } from "@/components/TopicsPopover";
import { RefreshControl } from "@/components/RefreshControl";
import { LocationSelector } from "@/components/LocationSelector";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";
import { getGuestScope, setGuestScope } from "@/lib/guestSessionStorage";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const queryClient = useQueryClient();
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);

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

  const tabItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/browse/legislation", label: "Legislation" },
    { href: "/browse/meetings", label: "Meetings" },
    { href: "/browse/elections", label: "Elections" },
    { href: "/browse/trends", label: "Trends" },
    { href: "/calendar", label: "Calendar" },
    { href: "/digest", label: "Digest" },
  ];

  const mobileNavItems = [...tabItems];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
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

          {/* Desktop Nav - Tabs */}
          <nav className="hidden md:flex items-center gap-1 ml-8">
            {tabItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "text-sm font-medium px-3 py-2 rounded-md transition-colors",
                  location.pathname === item.href
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-secondary/50"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Global Search & Filters - Desktop & Mobile */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden sm:block">
              <GlobalSearchBar />
            </div>
            <LocationSelector 
              value={selectedJurisdictions}
              onChange={handleJurisdictionChange}
              maxSelections={3}
            />
            <TopicsPopover />
            <div className="hidden md:flex">
              <RefreshControl />
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">{children}</main>

      <footer className="border-t py-4 md:py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Local Gov Watch</p>
        </div>
      </footer>
    </div>
  );
}
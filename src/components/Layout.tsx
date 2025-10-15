import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Scale } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getGuestScope, setGuestScope } from "@/lib/guestSessionStorage";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BrowseDropdown } from "@/components/nav/BrowseDropdown";
import { MyWorkspaceDropdown } from "@/components/nav/MyWorkspaceDropdown";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";
import { TrackedTermsFilter } from "@/components/TrackedTermsFilter";
import { LocationSelector } from "@/components/LocationSelector";
import { CategoriesPopover } from "@/components/CategoriesPopover";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const mobileNavItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/browse/legislation", label: "Legislation" },
    { href: "/browse/meetings", label: "Meetings" },
    { href: "/browse/elections", label: "Elections" },
    { href: "/browse/trends", label: "Trends" },
    { href: "/calendar", label: "Calendar" },
    { href: "/alerts", label: "Alerts" },
  ];


  return (
    <div className="min-h-screen bg-background">
      {/* Primary Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          {/* Mobile: Hamburger menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <Menu className="h-4 w-4" />
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

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 ml-2 md:ml-0">
            <Scale className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm md:text-base">Local Gov Watch</span>
          </Link>

          {/* Desktop Primary Nav */}
          <nav className="hidden md:flex items-center gap-2 ml-6 lg:ml-8">
            <Button
              variant={location.pathname === "/dashboard" ? "secondary" : "ghost"}
              size="sm"
              asChild
              data-tour="dashboard"
            >
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <div data-tour="browse">
              <BrowseDropdown />
            </div>
            <Button
              variant={location.pathname === "/alerts" ? "secondary" : "ghost"}
              size="sm"
              asChild
              data-tour="alerts"
            >
              <Link to="/alerts">Alerts</Link>
            </Button>
          </nav>

          {/* Right Side - Filters and Actions */}
          <div className="flex items-center gap-1.5 md:gap-2 ml-auto">
            <TrackedTermsFilter />
            <div className="hidden md:flex">
              <LocationSelector />
            </div>
            <div className="hidden md:flex">
              <CategoriesPopover />
            </div>
            <div className="hidden md:flex" data-tour="my-workspace">
              <MyWorkspaceDropdown />
            </div>
          </div>
        </div>
      </header>

      <main className="container py-3 mt-4 md:mt-6 pb-20 md:pb-4">{children}</main>

      <footer className="border-t py-2 md:py-3 mb-16 md:mb-0">
        <div className="container text-center text-xs md:text-sm text-muted-foreground">
          <p>Local Gov Watch</p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
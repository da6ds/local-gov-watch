import { Link, useLocation } from "react-router-dom";
import { Home, FileText, Bell, User, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function MobileBottomNav() {
  const location = useLocation();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isBrowseActive = location.pathname.startsWith("/browse") || location.pathname === "/calendar";

  const browseItems = [
    { href: "/browse/legislation", label: "Legislation", icon: FileText },
    { href: "/browse/meetings", label: "Meetings", icon: FileText },
    { href: "/browse/elections", label: "Elections", icon: FileText },
    { href: "/calendar", label: "Calendar", icon: FileText },
    { href: "/browse/trends", label: "Trends", icon: FileText },
  ];

  const workspaceItems = [
    { href: "/tracked-terms", label: "My Tracked Terms", enabled: true },
    { href: "/watchlists", label: "My Followed Items", enabled: false },
    { href: "/stances", label: "My Stances", enabled: true },
    { href: "/alerts", label: "Alert Settings", enabled: true },
  ];

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/dashboard"
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              isActive("/dashboard")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Home</span>
          </Link>

          <button
            onClick={() => setBrowseOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              isBrowseActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs font-medium">Browse</span>
          </button>

          <Link
            to="/alerts"
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              isActive("/alerts")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bell className="h-5 w-5" />
            <span className="text-xs font-medium">Alerts</span>
          </Link>

          <button
            onClick={() => setWorkspaceOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              isActive("/stances") || isActive("/watchlists") || isActive("/tracked-terms") || isActive("/alerts")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">My Work</span>
          </button>

          <Link
            to="/search"
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              isActive("/search")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Search className="h-5 w-5" />
            <span className="text-xs font-medium">Search</span>
          </Link>
        </div>
      </nav>

      {/* Browse Bottom Sheet */}
      <Sheet open={browseOpen} onOpenChange={setBrowseOpen}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Browse</SheetTitle>
          </SheetHeader>
          <div className="grid gap-2 py-4">
            {browseItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className="justify-start h-12"
                  asChild
                  onClick={() => setBrowseOpen(false)}
                >
                  <Link to={item.href}>
                    <Icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Workspace Bottom Sheet */}
      <Sheet open={workspaceOpen} onOpenChange={setWorkspaceOpen}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>My Workspace</SheetTitle>
          </SheetHeader>
          <div className="grid gap-2 py-4">
            {workspaceItems.map((item, index) => (
              <div key={item.href}>
                {index === 3 && <Separator className="my-2" />}
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className="justify-start h-12 w-full"
                  asChild={item.enabled}
                  disabled={!item.enabled}
                  onClick={() => item.enabled && setWorkspaceOpen(false)}
                >
                  {item.enabled ? (
                    <Link to={item.href}>
                      {item.label}
                      {!item.enabled && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          Coming Soon
                        </span>
                      )}
                    </Link>
                  ) : (
                    <span>
                      {item.label}
                      <span className="ml-auto text-xs text-muted-foreground">
                        Coming Soon
                      </span>
                    </span>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

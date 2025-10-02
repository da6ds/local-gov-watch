import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Scale, Calendar, BookOpen, Star, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DemoBanner } from "@/components/DemoBanner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: BookOpen },
    { href: "/browse/legislation", label: "Legislation", icon: Scale },
    { href: "/browse/meetings", label: "Meetings", icon: Calendar },
    { href: "/browse/elections", label: "Elections", icon: Star },
    { href: "/browse/trends", label: "Trends", icon: Star },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Banner - Always Visible */}
      <DemoBanner />
      
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
                  {navItems.map((item) => (
                    <Button
                      key={item.href}
                      variant={location.pathname === item.href ? "secondary" : "ghost"}
                      className="justify-start touch-target"
                      asChild
                      onClick={() => setOpen(false)}
                    >
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4 mr-2" />
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

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 ml-8">
            <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                Browse <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link to="/browse/legislation">Legislation</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/browse/meetings">Meetings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/browse/elections">Elections</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/browse/trends">Trends</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/settings" className="text-sm font-medium hover:text-primary transition-colors">
              Settings
            </Link>
          </nav>
        </div>
      </header>

      <main className="container py-6">{children}</main>

      <footer className="border-t py-6 md:py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Local Gov Watch • Austin, Travis County, Texas</p>
          <p className="mt-2">Hyper-local. AI-smart. Costs dozens, not thousands.</p>
        </div>
      </footer>
    </div>
  );
}
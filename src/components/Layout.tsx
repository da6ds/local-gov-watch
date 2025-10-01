import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Scale, Calendar, BookOpen, Star, Settings } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Scale },
    { href: "/dashboard", label: "Dashboard", icon: BookOpen },
    { href: "/browse/legislation", label: "Legislation", icon: Scale },
    { href: "/browse/trends", label: "Trends", icon: Star },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    ...(user ? [{ href: "/watchlists", label: "Watchlists", icon: Star }] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                <div className="border-t pt-4 mt-4">
                  {user ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-2 px-2">{user.email}</p>
                      <Button variant="ghost" className="w-full justify-start touch-target" onClick={handleSignOut}>
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Button className="w-full touch-target" asChild onClick={() => setOpen(false)}>
                      <Link to="/auth">Sign In</Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2 ml-4 md:ml-0">
            <Scale className="h-5 w-5 text-primary" />
            <span className="font-semibold hidden sm:inline-block">Local Gov Watch</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 ml-8">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={location.pathname === item.href ? "default" : "ghost"}
                asChild
              >
                <Link to={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden md:inline-block text-sm text-muted-foreground">{user.email}</span>
                <Button variant="outline" onClick={handleSignOut} className="hidden md:inline-flex">
                  Sign Out
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
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
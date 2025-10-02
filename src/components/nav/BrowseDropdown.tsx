import { Link, useLocation } from "react-router-dom";
import { ChevronDown, FileText, Users, Vote, Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const browseItems = [
  { href: "/browse/legislation", label: "Legislation", icon: FileText },
  { href: "/browse/meetings", label: "Meetings", icon: Users },
  { href: "/browse/elections", label: "Elections", icon: Vote },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/browse/trends", label: "Trends", icon: TrendingUp },
];

export function BrowseDropdown() {
  const location = useLocation();
  
  const isActive = (href: string) => location.pathname === href;
  const isAnyBrowseActive = browseItems.some(item => isActive(item.href));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isAnyBrowseActive ? "secondary" : "ghost"}
          className="gap-1"
        >
          Browse
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-background">
        {browseItems.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  isActive(item.href) && "bg-accent text-accent-foreground font-medium"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

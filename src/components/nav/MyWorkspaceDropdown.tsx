import { ChevronDown, Heart, List, Search, Bell, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const workspaceItems = [
  { label: "My Stances", icon: Heart, href: "/stances" },
  { label: "My Lists", icon: List, href: "/watchlists", disabled: true },
  { label: "Saved Searches", icon: Search, href: "#", disabled: true },
  { label: "Notifications", icon: Bell, href: "#", disabled: true },
  { label: "Settings", icon: Settings, href: "/settings", disabled: true },
];

export function MyWorkspaceDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-1">
          My Workspace
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background">
        {workspaceItems.map((item) => {
          const Icon = item.icon;
          
          if (item.disabled) {
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <DropdownMenuItem disabled className="flex items-center gap-2 opacity-50">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent side="left">
                  Coming with login
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <DropdownMenuItem key={item.label} asChild>
              <Link to={item.href} className="flex items-center gap-2 cursor-pointer">
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

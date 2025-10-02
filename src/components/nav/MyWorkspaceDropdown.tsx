import { ChevronDown, Heart, List, Search, Bell, Settings } from "lucide-react";
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
  { label: "My Stances", icon: Heart },
  { label: "My Lists", icon: List },
  { label: "Saved Searches", icon: Search },
  { label: "Notifications", icon: Bell },
  { label: "Settings", icon: Settings },
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
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

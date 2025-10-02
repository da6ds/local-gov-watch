import { ChevronDown, Heart, List, Search, Bell, Settings, LogOut, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DemoLoginDialog } from "@/components/DemoLoginDialog";
import { useDemoUser } from "@/hooks/useDemoUser";
import { toast } from "sonner";

const workspaceItems = [
  { label: "My Stances", icon: Heart, href: "/stances" },
  { label: "My Lists", icon: List, href: "/watchlists" },
  { label: "Saved Searches", icon: Search, href: "#", disabled: true },
  { label: "Notifications", icon: Bell, href: "#", disabled: true },
  { label: "Settings", icon: Settings, href: "/settings", disabled: true },
];

export function MyWorkspaceDropdown() {
  const { demoUser, isLoggedIn, endDemo } = useDemoUser();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    endDemo();
    toast.success("Demo session ended. Your data has been cleared.");
    navigate("/");
  };

  // If not logged in, show "Try Demo" button
  if (!isLoggedIn) {
    return (
      <>
        <Button 
          variant="ghost" 
          className="gap-1.5"
          onClick={() => setShowLoginDialog(true)}
        >
          <Sparkles className="h-4 w-4" />
          Try Demo
        </Button>
        <DemoLoginDialog 
          open={showLoginDialog} 
          onOpenChange={setShowLoginDialog} 
        />
      </>
    );
  }

  // If logged in, show dropdown with user name
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-1">
          Demo User: {demoUser}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background">
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
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          End Demo Session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

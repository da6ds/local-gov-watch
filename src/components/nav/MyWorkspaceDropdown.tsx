import { ChevronDown, Hash, List, Bell, LogOut, Sparkles, Scale, FolderOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DemoLoginDialog } from "@/components/DemoLoginDialog";
import { useDemoUser } from "@/hooks/useDemoUser";
import { toast } from "sonner";
const workspaceItems = [{
  label: "My Tracked Terms",
  icon: Hash,
  href: "/tracked-terms"
}, {
  label: "My Lists",
  icon: FolderOpen,
  href: "/lists"
}, {
  label: "My Stances",
  icon: Scale,
  href: "/stances"
}, {
  label: "My Followed Items",
  icon: List,
  href: "/watchlists",
  disabled: true
}, {
  label: "Alert Settings",
  icon: Bell,
  href: "/alerts"
}];
export function MyWorkspaceDropdown() {
  const {
    demoUser,
    isLoggedIn,
    endDemo
  } = useDemoUser();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const navigate = useNavigate();
  const handleLogout = () => {
    endDemo();
    toast.success("Demo session ended. Your data has been cleared.");
    navigate("/");
  };

  // If not logged in, show "Try Demo" button
  if (!isLoggedIn) {
    return <>
        
        <DemoLoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
      </>;
  }

  // If logged in, show dropdown with user name
  return <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-1">
          Demo User: {demoUser}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background">
        {workspaceItems.map(item => {
        const Icon = item.icon;
        if (item.disabled) {
          return <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <DropdownMenuItem disabled className="flex items-center gap-2 opacity-50">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent side="left">
                  Coming with login
                </TooltipContent>
              </Tooltip>;
        }
        return <DropdownMenuItem key={item.label} asChild>
              <Link to={item.href} className="flex items-center gap-2 cursor-pointer">
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </DropdownMenuItem>;
      })}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          End Demo Session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>;
}
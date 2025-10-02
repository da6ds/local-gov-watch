import { useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const legislationStatuses = [
  { value: "all", label: "All" },
  { value: "introduced", label: "Introduced" },
  { value: "in-committee", label: "In Committee" },
  { value: "first-reading", label: "First Reading" },
  { value: "second-reading", label: "Second Reading" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
  { value: "effective", label: "Effective" },
];

export const meetingStatuses = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "this-week", label: "This Week" },
  { value: "today", label: "Today" },
  { value: "past", label: "Past" },
];

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  count?: number;
}

export function StatusFilter({ value, onChange, count }: StatusFilterProps) {
  const location = useLocation();
  
  // Determine which statuses to show based on current page
  const statuses = location.pathname.includes("/legislation") 
    ? legislationStatuses 
    : meetingStatuses;

  const selectedLabel = statuses.find(s => s.value === value)?.label || "All";
  const showCount = value !== "all" && count !== undefined && count > 0;

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-background">
          {statuses.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showCount && (
        <Badge variant="secondary" className="ml-1">
          {count}
        </Badge>
      )}
    </div>
  );
}

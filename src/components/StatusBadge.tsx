import { Badge } from "@/components/ui/badge";
import { LEGISLATION_STATUSES } from "@/lib/constants";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = LEGISLATION_STATUSES.find(s => s.value === status?.toLowerCase());
  
  if (!statusConfig) {
    return <Badge variant="secondary">{status}</Badge>;
  }

  return (
    <Badge className={`status-pill status-${statusConfig.value}`}>
      {statusConfig.label}
    </Badge>
  );
}
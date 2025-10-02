import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LEGISLATION_TIMELINE_STAGES } from "@/lib/constants";
import { format } from "date-fns";

interface LegislationTimelineProps {
  currentStatus: string;
  introducedAt?: string | null;
  passedAt?: string | null;
  effectiveAt?: string | null;
}

export function LegislationTimeline({
  currentStatus,
  introducedAt,
  passedAt,
  effectiveAt,
}: LegislationTimelineProps) {
  const normalizedStatus = currentStatus?.toLowerCase() || '';
  
  const stages = LEGISLATION_TIMELINE_STAGES.map((stage) => {
    const stageIndex = LEGISLATION_TIMELINE_STAGES.findIndex(s => s.key === stage.key);
    const currentIndex = LEGISLATION_TIMELINE_STAGES.findIndex(s => s.key === normalizedStatus);
    
    const isCompleted = stageIndex < currentIndex || 
      (normalizedStatus === 'effective' && stage.key === 'passed') ||
      (normalizedStatus === 'passed' && stage.key === 'introduced');
    
    const isCurrent = stage.key === normalizedStatus;
    const isFailed = normalizedStatus === 'failed' || normalizedStatus === 'withdrawn';
    
    let date: string | null = null;
    if (stage.key === 'introduced') date = introducedAt;
    if (stage.key === 'passed') date = passedAt;
    if (stage.key === 'effective') date = effectiveAt;
    
    return {
      ...stage,
      isCompleted: isCompleted || (stage.key === 'introduced' && introducedAt),
      isCurrent,
      isFailed,
      date,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Status Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {stage.isFailed ? (
                  <XCircle className="h-6 w-6 text-destructive" />
                ) : stage.isCompleted ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : stage.isCurrent ? (
                  <Circle className="h-6 w-6 text-primary fill-primary" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground/30" />
                )}
                {index < stages.length - 1 && (
                  <div 
                    className={`w-px h-8 mt-1 ${
                      stage.isCompleted 
                        ? 'bg-green-600 dark:bg-green-400' 
                        : 'bg-muted-foreground/20'
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className={`font-medium ${
                  stage.isCurrent ? 'text-primary' : 
                  stage.isCompleted ? 'text-foreground' : 
                  'text-muted-foreground'
                }`}>
                  {stage.label}
                </div>
                {stage.date && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {format(new Date(stage.date), "MMM d, yyyy")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

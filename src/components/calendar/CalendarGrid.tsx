import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
} from "date-fns";
import { DayPopover } from "./DayPopover";

interface CalendarGridProps {
  currentMonth: Date;
  selectedDate: Date | undefined;
  counts: Record<string, number>;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  variant?: 'desktop' | 'tablet' | 'mobile';
  enableHoverPopover?: boolean;
  scope?: string;
  topics?: string[];
}

export function CalendarGrid({
  currentMonth,
  selectedDate,
  counts,
  onDateSelect,
  onMonthChange,
  variant = 'desktop',
  enableHoverPopover = false,
  scope,
  topics,
}: CalendarGridProps) {
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePrevMonth = () => onMonthChange(subMonths(currentMonth, 1));
  const handleNextMonth = () => onMonthChange(addMonths(currentMonth, 1));
  const handleToday = () => {
    onMonthChange(new Date());
    onDateSelect(new Date());
  };

  const getEventCount = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    return counts[key] || 0;
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, date: Date) => {
    const currentIndex = calendarDays.findIndex(d => isSameDay(d, date));
    let targetIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        targetIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        targetIndex = Math.min(calendarDays.length - 1, currentIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        targetIndex = Math.max(0, currentIndex - 7);
        break;
      case 'ArrowDown':
        e.preventDefault();
        targetIndex = Math.min(calendarDays.length - 1, currentIndex + 7);
        break;
      case 'Home':
        e.preventDefault();
        targetIndex = Math.floor(currentIndex / 7) * 7;
        break;
      case 'End':
        e.preventDefault();
        targetIndex = Math.floor(currentIndex / 7) * 7 + 6;
        break;
      case 'PageUp':
        e.preventDefault();
        handlePrevMonth();
        return;
      case 'PageDown':
        e.preventDefault();
        handleNextMonth();
        return;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onDateSelect(date);
        return;
      default:
        return;
    }

    const targetDate = calendarDays[targetIndex];
    if (targetDate) {
      setFocusedDate(targetDate);
      // Focus the button
      setTimeout(() => {
        const buttons = gridRef.current?.querySelectorAll('[role="gridcell"] button');
        if (buttons && buttons[targetIndex]) {
          (buttons[targetIndex] as HTMLElement).focus();
        }
      }, 0);
    }
  };

  const cellSizeClasses = {
    desktop: 'h-14 text-base lg:text-lg',
    tablet: 'h-12 text-sm md:text-base',
    mobile: 'h-11 text-sm',
  }[variant];

  const gapClasses = variant === 'mobile' ? 'gap-0.5' : 'gap-1 sm:gap-1.5';

  return (
    <div className="w-full" role="grid" aria-label="Calendar">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className={`grid grid-cols-7 ${gapClasses} mb-2`} role="row">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            role="columnheader"
            className="text-center text-xs md:text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day Cells */}
      <div ref={gridRef} className={`grid grid-cols-7 ${gapClasses}`}>
        {calendarDays.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const eventCount = getEventCount(day);
          const hasEvents = eventCount > 0;

          const dayCell = (
            <div key={idx} role="gridcell">
              <div
                data-testid="calendar-day"
                data-has-events={hasEvents}
                aria-label={`${format(day, 'MMMM d, yyyy')}${hasEvents ? `, ${eventCount} event${eventCount > 1 ? 's' : ''}` : ''}`}
                className={`
                  aspect-square w-full flex flex-col items-center justify-center
                  ${cellSizeClasses}
                  rounded-md transition-colors
                  ${!isCurrentMonth ? 'text-muted-foreground/40' : ''}
                  ${isSelected ? 'bg-primary text-primary-foreground font-bold' : ''}
                  ${!isSelected && isTodayDate ? 'font-semibold ring-2 ring-primary border-2 border-primary' : ''}
                  ${!isSelected && hasEvents && !isTodayDate ? 'bg-primary/10 font-medium' : ''}
                `}
              >
                <span>{format(day, 'd')}</span>
                {hasEvents && !isSelected && (
                  <span className="text-[10px] text-muted-foreground">
                    {eventCount} meeting{eventCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          );

          // Wrap with popover on desktop if hover is enabled
          if (enableHoverPopover && hasEvents && scope) {
            return (
              <DayPopover
                key={idx}
                date={day}
                eventCount={eventCount}
                scope={scope}
                topics={topics}
              >
                {dayCell}
              </DayPopover>
            );
          }

          return dayCell;
        })}
      </div>
    </div>
  );
}

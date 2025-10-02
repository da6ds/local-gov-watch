import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from "date-fns";

interface CalendarCardProps {
  currentMonth: Date;
  selectedDate: Date | undefined;
  datesWithEvents: Date[];
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export function CalendarCard({ 
  currentMonth, 
  selectedDate, 
  datesWithEvents,
  onDateSelect,
  onMonthChange
}: CalendarCardProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() - 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + 1);
    onMonthChange(newDate);
  };

  const handleToday = () => {
    onMonthChange(new Date());
    onDateSelect(new Date());
  };

  const hasEvent = (date: Date) => {
    return datesWithEvents.some(eventDate => 
      format(eventDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  return (
    <Card data-testid="calendar-card" className="h-fit">
      <CardContent className="p-4 md:p-6 w-full">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="w-full">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div 
                key={day} 
                className="text-center text-xs md:text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarDays.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const hasEventDate = hasEvent(day);

              return (
                <button
                  key={idx}
                  data-testid="calendar-day"
                  data-has-events={hasEventDate}
                  onClick={() => onDateSelect(day)}
                  className={`
                    aspect-square w-full flex items-center justify-center
                    text-sm md:text-base lg:text-lg
                    rounded-md transition-colors
                    ${!isCurrentMonth ? 'text-muted-foreground/40' : ''}
                    ${isSelected ? 'bg-primary text-primary-foreground font-bold' : ''}
                    ${!isSelected && isTodayDate ? 'bg-accent font-semibold' : ''}
                    ${!isSelected && hasEventDate ? 'bg-primary/10 font-bold' : ''}
                    ${!isSelected && !isTodayDate && !hasEventDate ? 'hover:bg-accent' : ''}
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

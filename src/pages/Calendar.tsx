import { Layout } from "@/components/Layout";
import { Calendar as CalendarComponent } from "@/components/calendar/Calendar";

export default function Calendar() {
  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Header - visible on mobile only */}
        <div className="md:hidden mb-6">
          <h1 className="text-3xl font-bold mb-2">Calendar</h1>
          <p className="text-muted-foreground">View upcoming meetings and elections</p>
        </div>

        <CalendarComponent variant="full" />
      </div>
    </Layout>
  );
}

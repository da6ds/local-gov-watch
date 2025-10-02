import { Layout } from "@/components/Layout";
import { MiniCalendar } from "@/components/MiniCalendar";
import { getGuestScope } from "@/lib/guestSessionStorage";

export default function Calendar() {
  const scopeString = getGuestScope().join(',');

  return (
    <Layout>
      <div className="container py-6">
        {/* Header - visible on mobile only */}
        <div className="md:hidden mb-6">
          <h1 className="text-3xl font-bold mb-2">Calendar</h1>
          <p className="text-muted-foreground">View upcoming meetings and elections</p>
        </div>

        {/* Calendar - uses global filters from navbar */}
        <MiniCalendar scope={scopeString} showSidePanel={true} />
      </div>
    </Layout>
  );
}

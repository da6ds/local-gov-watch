import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";

export default function BrowseMeetings() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Meetings</h1>
          <p className="text-muted-foreground">City council, county, and state sessions</p>
        </div>

        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No meetings data available yet.</p>
        </Card>
      </div>
    </Layout>
  );
}
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";

export default function Calendar() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Calendar</h1>
          <p className="text-muted-foreground">Meetings and elections timeline</p>
        </div>

        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Calendar view coming soon</p>
        </Card>
      </div>
    </Layout>
  );
}
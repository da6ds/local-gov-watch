import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";

export default function BrowseElections() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Elections</h1>
          <p className="text-muted-foreground">Upcoming elections and deadlines</p>
        </div>

        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No elections data available yet.</p>
        </Card>
      </div>
    </Layout>
  );
}
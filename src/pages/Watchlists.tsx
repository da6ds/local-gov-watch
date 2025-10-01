import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Watchlists() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Watchlists</h1>
            <p className="text-muted-foreground">Track legislation and get email alerts</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Watchlist
          </Button>
        </div>

        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No watchlists yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Create a watchlist to save searches and track items
          </p>
        </Card>
      </div>
    </Layout>
  );
}
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function BrowseLegislation() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Legislation</h1>
          <p className="text-muted-foreground">Track bills, ordinances, and resolutions</p>
        </div>

        <Card className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search legislation..." className="pl-10" />
            </div>
            <Button>Search</Button>
          </div>
        </Card>

        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No legislation data available yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Admins can configure data sources to begin tracking legislation.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
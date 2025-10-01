import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { useParams } from "react-router-dom";

export default function MeetingDetail() {
  const { id } = useParams();

  return (
    <Layout>
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Meeting detail view for ID: {id}</p>
        </Card>
      </div>
    </Layout>
  );
}
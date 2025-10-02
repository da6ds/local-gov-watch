import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText } from "lucide-react";
import { Link } from "react-router-dom";

interface RelatedInfoProps {
  jurisdiction?: { name: string; slug: string } | null;
  externalId?: string | null;
  sourceUrl?: string | null;
  docUrl?: string | null;
  people?: any;
}

export function RelatedInfo({
  jurisdiction,
  externalId,
  sourceUrl,
  docUrl,
  people,
}: RelatedInfoProps) {
  const sponsors = people?.sponsors || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Related Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {jurisdiction && (
          <div>
            <div className="text-sm font-medium mb-1">Jurisdiction</div>
            <Link to={`/browse/legislation?jurisdiction=${jurisdiction.slug}`}>
              <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                {jurisdiction.name}
              </Badge>
            </Link>
          </div>
        )}

        {externalId && (
          <div>
            <div className="text-sm font-medium mb-1">External ID</div>
            <Badge variant="outline">{externalId}</Badge>
          </div>
        )}

        {docUrl && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <a href={docUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="h-4 w-4 mr-2" />
              View Original Document
            </a>
          </Button>
        )}

        {sourceUrl && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Source
            </a>
          </Button>
        )}

        {sponsors.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Sponsored by</div>
            <div className="text-sm text-muted-foreground">
              {sponsors.map((s: any) => s.name).join(", ")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

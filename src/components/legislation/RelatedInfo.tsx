import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, Globe, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

interface RelatedInfoProps {
  jurisdiction?: { name: string; slug: string; website?: string | null; phone?: string | null; email?: string | null } | null;
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

        {/* Contact & Source Section */}
        <div className="border-t pt-4">
          <div className="text-sm font-medium mb-3">Contact & Source</div>
          <div className="space-y-2">
            {jurisdiction?.website && (
              <div className="flex items-start gap-2 text-sm">
                <Globe className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <Button variant="link" className="h-auto p-0 text-sm" asChild>
                  <a href={jurisdiction.website} target="_blank" rel="noopener noreferrer">
                    Visit {jurisdiction.name} website
                    <ExternalLink className="h-3 w-3 ml-1 inline" />
                  </a>
                </Button>
              </div>
            )}
            {jurisdiction?.phone && (
              <div className="flex items-start gap-2 text-sm">
                <Phone className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <a href={`tel:${jurisdiction.phone}`} className="hover:underline">
                  {jurisdiction.phone}
                </a>
              </div>
            )}
            {jurisdiction?.email && (
              <div className="flex items-start gap-2 text-sm">
                <Mail className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <a href={`mailto:${jurisdiction.email}`} className="hover:underline">
                  {jurisdiction.email}
                </a>
              </div>
            )}
            {!jurisdiction?.website && !jurisdiction?.phone && !jurisdiction?.email && (
              <p className="text-sm text-muted-foreground">
                Contact information not available
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

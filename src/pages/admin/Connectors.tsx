import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Play, RefreshCw, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Connectors() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [runningConnector, setRunningConnector] = useState<string | null>(null);

  const { data: connectors, isLoading } = useQuery({
    queryKey: ["connectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connector")
        .select("*")
        .order("jurisdiction_slug", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const toggleEnabledMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("connector")
        .update({ enabled })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connectors"] });
      toast({ title: "Connector updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update connector",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const runConnectorMutation = useMutation({
    mutationFn: async (connectorId: string) => {
      const { data, error } = await supabase.functions.invoke("run-connector", {
        body: { connectorId },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setRunningConnector(null);
      queryClient.invalidateQueries({ queryKey: ["connectors"] });
      
      const stats = data.stats || {};
      const newCount = stats.newCount || 0;
      const updatedCount = stats.updatedCount || 0;
      const errorCount = stats.errorCount || 0;
      
      if (data.status === "error") {
        toast({
          title: "Connector run failed",
          description: `${errorCount} errors occurred`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connector run complete",
          description: `${newCount} new, ${updatedCount} updated${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
        });
      }
    },
    onError: (error) => {
      setRunningConnector(null);
      toast({
        title: "Connector run failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRunNow = (connectorId: string) => {
    setRunningConnector(connectorId);
    runConnectorMutation.mutate(connectorId);
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "secondary";
    if (status === "success") return "default";
    if (status === "error") return "destructive";
    return "secondary";
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Connector Registry</h1>
          <p className="text-muted-foreground">
            Manage data sources for jurisdictions
          </p>
        </div>

        <div className="grid gap-6">
          {connectors?.map((connector) => (
            <Card key={connector.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {connector.key}
                      <Badge variant={getStatusColor(connector.last_status)}>
                        {connector.last_status || "never run"}
                      </Badge>
                      {!connector.enabled && (
                        <Badge variant="outline">disabled</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {connector.notes}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Enabled</span>
                      <Switch
                        checked={connector.enabled}
                        onCheckedChange={(checked) =>
                          toggleEnabledMutation.mutate({
                            id: connector.id,
                            enabled: checked,
                          })
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRunNow(connector.id)}
                      disabled={!connector.enabled || runningConnector === connector.id}
                    >
                      {runningConnector === connector.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Run now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Jurisdiction:</span>
                    <div className="font-medium">{connector.jurisdiction_slug}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kind:</span>
                    <div className="font-medium capitalize">{connector.kind}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Schedule:</span>
                    <div className="font-medium">{connector.schedule}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last run:</span>
                    <div className="font-medium">
                      {connector.last_run_at
                        ? formatDistanceToNow(new Date(connector.last_run_at), {
                            addSuffix: true,
                          })
                        : "Never"}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">URL:</span>
                  <a
                    href={connector.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    {connector.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Parser:</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {connector.parser_key}
                  </code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}

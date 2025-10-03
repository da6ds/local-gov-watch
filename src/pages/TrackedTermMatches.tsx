import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TrackedTermMatches() {
  const { id } = useParams();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("30d");

  const { data: term } = useQuery({
    queryKey: ['tracked-term', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracked_term')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: matches, isLoading } = useQuery({
    queryKey: ['term-matches', id, typeFilter, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from('term_match')
        .select(`
          *,
          legislation:item_id (
            id,
            title,
            jurisdiction_id,
            introduced_at,
            ai_summary
          ),
          meeting:item_id (
            id,
            title,
            jurisdiction_id,
            starts_at,
            ai_summary
          )
        `)
        .eq('tracked_term_id', id)
        .order('matched_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('item_type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by date
      if (dateFilter !== 'all') {
        const now = new Date();
        let cutoffDate = new Date();
        
        switch (dateFilter) {
          case '7d':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case '30d':
            cutoffDate.setDate(now.getDate() - 30);
            break;
          case '6m':
            cutoffDate.setMonth(now.getMonth() - 6);
            break;
        }

        return data.filter(match => {
          const matchDate = new Date(match.matched_at);
          return matchDate >= cutoffDate;
        });
      }

      return data;
    },
    enabled: !!id,
  });

  if (!term) return null;

  return (
    <div className="container max-w-5xl py-6 md:py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tracked-terms">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tracked Terms
            </Link>
          </Button>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold">{term.name}</h1>
            <p className="text-muted-foreground">
              {matches?.length || 0} matches found
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="legislation">Legislation</SelectItem>
              <SelectItem value="meeting">Meetings</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Matches List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-6 bg-muted rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </Card>
            ))}
          </div>
        ) : matches && matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((match) => {
              const item = match.item_type === 'legislation' 
                ? (match as any).legislation 
                : (match as any).meeting;
              
              if (!item) return null;

              const date = match.item_type === 'legislation'
                ? item.introduced_at
                : item.starts_at;

              return (
                <Card key={match.id} className="p-4 md:p-6 hover:bg-muted/50 transition-colors">
                  <Link 
                    to={`/${match.item_type === 'legislation' ? 'legislation' : 'meeting'}/${item.id}`}
                    className="space-y-3 block"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={match.item_type === 'legislation' ? 'default' : 'secondary'}>
                            {match.item_type === 'legislation' ? 'Legislation' : 'Meeting'}
                          </Badge>
                          {date && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        {item.ai_summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.ai_summary}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs text-muted-foreground">Matched:</span>
                      {(match.matched_keywords as string[]).map((keyword, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No matches yet</h3>
              <p className="text-sm text-muted-foreground">
                We'll notify you when new legislation or meetings mention your keywords
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

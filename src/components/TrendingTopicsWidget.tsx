import { TrendingUp, ArrowRight } from 'lucide-react';
import { TrendingTopic } from '@/lib/trendingTopics';
import { Link } from 'react-router-dom';

interface TrendingTopicsWidgetProps {
  topics: TrendingTopic[];
  isLoading?: boolean;
}

export const TrendingTopicsWidget = ({ topics, isLoading }: TrendingTopicsWidgetProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Analyzing recent activity...</p>
      </div>
    );
  }
  
  if (topics.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">No trending topics yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Topics will appear as legislation and meetings are added
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {topics.slice(0, 6).map((topic, index) => (
          <Link
            key={topic.keyword}
            to={`/browse/legislation?search=${encodeURIComponent(topic.keyword)}`}
            className="flex items-center gap-3 p-2.5 rounded-md hover:bg-accent transition-colors group border border-transparent hover:border-border"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
              {index + 1}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm capitalize truncate">
                {topic.keyword}
              </h4>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>{topic.count} mention{topic.count !== 1 ? 's' : ''}</span>
                <span className="opacity-60">•</span>
                <span>{topic.percentage.toFixed(0)}% of items</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <TrendingUp className="h-4 w-4 text-primary" />
              <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>
      
      <div className="pt-2 border-t">
        <Link 
          to="/browse/legislation" 
          className="flex items-center justify-center gap-1 text-sm text-primary hover:underline"
        >
          Browse all legislation
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

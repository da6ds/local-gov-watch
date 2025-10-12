import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CityBadgeProps {
  city: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  className?: string;
}

export const CityBadge = ({ 
  city, 
  size = 'medium',
  showIcon = true,
  className
}: CityBadgeProps) => {
  // Color mapping for different cities (future-proof for expansion)
  const getCityColor = (cityName: string): string => {
    const normalizedCity = cityName.toLowerCase();
    if (normalizedCity.includes('austin')) return 'blue';
    if (normalizedCity.includes('san rafael')) return 'green';
    if (normalizedCity.includes('santa rosa')) return 'purple';
    if (normalizedCity.includes('napa')) return 'orange';
    if (normalizedCity.includes('travis')) return 'blue'; // Travis County
    return 'gray';
  };

  const color = getCityColor(city);
  
  const sizeClasses = {
    small: 'text-xs px-2 py-0.5 gap-1',
    medium: 'text-sm px-3 py-1 gap-1.5',
    large: 'text-base px-4 py-1.5 gap-2'
  };

  const iconSizes = {
    small: 12,
    medium: 14,
    large: 16
  };

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    gray: 'bg-muted text-muted-foreground border-border'
  };
  
  return (
    <div className={cn(
      'inline-flex items-center font-medium rounded-full border whitespace-nowrap',
      sizeClasses[size],
      colorClasses[color],
      className
    )}>
      {showIcon && <MapPin size={iconSizes[size]} className="flex-shrink-0" />}
      <span className="font-semibold">{city}</span>
    </div>
  );
};

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  color?: 'default' | 'customer' | 'contact' | 'school' | 'teacher' | 'payer';
  onClick?: () => void;
}

const colorStyles = {
  default: 'bg-primary/10 text-primary',
  customer: 'bg-customer/10 text-customer',
  contact: 'bg-contact/10 text-contact',
  school: 'bg-school/10 text-school',
  teacher: 'bg-teacher/10 text-teacher',
  payer: 'bg-payer/10 text-payer',
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color = 'default',
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'stat-card group',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-display font-bold text-foreground">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', colorStyles[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

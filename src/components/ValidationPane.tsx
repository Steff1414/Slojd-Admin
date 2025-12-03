import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ValidationItem {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
}

interface ValidationPaneProps {
  items: ValidationItem[];
  title?: string;
}

export function ValidationPane({ items, title = 'Datavalidering' }: ValidationPaneProps) {
  if (items.length === 0) {
    return (
      <Card className="border-success/20 bg-success/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-success">
            <CheckCircle className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Inga problem hittades</p>
        </CardContent>
      </Card>
    );
  }

  const getIcon = (type: ValidationItem['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'info':
        return <Info className="h-4 w-4 text-info" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const hasErrors = items.some(i => i.type === 'error');
  const hasWarnings = items.some(i => i.type === 'warning');

  return (
    <Card className={hasErrors ? 'border-destructive/20 bg-destructive/5' : hasWarnings ? 'border-warning/20 bg-warning/5' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className={`h-4 w-4 ${hasErrors ? 'text-destructive' : 'text-warning'}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2 text-sm">
            {getIcon(item.type)}
            <span className="text-muted-foreground">{item.message}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

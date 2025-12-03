import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Send, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface RecentMessage {
  id: string;
  to_email: string;
  subject: string;
  status: string;
  channel: string | null;
  category: string | null;
  sent_at: string | null;
  created_at: string | null;
  contact: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

const channelLabels: Record<string, string> = {
  EMAIL: 'E-post',
  SMS: 'SMS',
  NEWSLETTER: 'Nyhetsbrev',
  SYSTEM: 'System',
};

const categoryLabels: Record<string, string> = {
  WELCOME: 'Välkommen',
  ORDER_CONFIRMATION: 'Orderbekräftelse',
  ORDER_DELIVERED: 'Leveransbekräftelse',
  RECEIPT: 'Kvitto',
  ABANDONED_CART_REMINDER: 'Varukorgspåminnelse',
  NEWSLETTER: 'Nyhetsbrev',
  OTHER: 'Övrigt',
};

export function RecentMessagesCard() {
  const [messages, setMessages] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentMessages() {
      try {
        const { data } = await supabase
          .from('email_messages')
          .select(`
            id,
            to_email,
            subject,
            status,
            channel,
            category,
            sent_at,
            created_at,
            contact:contact_id (
              id,
              first_name,
              last_name
            )
          `)
          .order('sent_at', { ascending: false, nullsFirst: false })
          .limit(5);

        setMessages((data || []) as RecentMessage[]);
      } catch (error) {
        console.error('Error fetching recent messages:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentMessages();
  }, []);

  const getChannelIcon = (channel: string | null) => {
    switch (channel) {
      case 'SMS':
        return <MessageSquare className="h-4 w-4" />;
      case 'EMAIL':
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getChannelBadgeVariant = (channel: string | null) => {
    switch (channel) {
      case 'SMS':
        return 'secondary';
      case 'NEWSLETTER':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Senaste meddelanden</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Senaste meddelanden
          </CardTitle>
          <CardDescription>Utgående kommunikation</CardDescription>
        </div>
        <Link
          to="/contacts"
          className="text-sm font-medium text-primary hover:underline"
        >
          Visa alla
        </Link>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-sm">Inga meddelanden skickade än</p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <Link
                key={message.id}
                to={message.contact ? `/contacts/${message.contact.id}` : '#'}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {getChannelIcon(message.channel)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      {message.contact 
                        ? `${message.contact.first_name} ${message.contact.last_name}`
                        : message.to_email
                      }
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {message.subject}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <Badge variant={getChannelBadgeVariant(message.channel) as any}>
                    {channelLabels[message.channel || 'EMAIL'] || message.channel}
                  </Badge>
                  {message.category && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {categoryLabels[message.category] || message.category}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {message.sent_at 
                      ? format(new Date(message.sent_at), 'd MMM', { locale: sv })
                      : '-'
                    }
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

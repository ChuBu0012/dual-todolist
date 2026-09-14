interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number; // Integer color code
  footer?: {
    text: string;
    icon_url?: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp?: string; // ISO8601 string
}

export interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}


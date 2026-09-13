import type { DiscordWebhookPayload } from '../types/discord';
import type { CompletedTaskLog } from '../types/todo';
import { formatThaiDate, formatSummaryDate } from '../utils/dateFormat';

const BOT_USERNAME = 'pipin';


/**
 * Split a long text message into chunks below Discord's 2000 character limit (default 1850)
 * Attempts to break gracefully on newlines.
 */
export function splitDiscordMessage(text: string, maxLength: number = 1850): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const lines = text.split('\n');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const line of lines) {
    // If a single line is absurdly long, force cut
    if (line.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      for (let i = 0; i < line.length; i += maxLength) {
        chunks.push(line.slice(i, i + maxLength));
      }
      continue;
    }

    if (currentChunk.length + line.length + 1 > maxLength) {
      chunks.push(currentChunk.trim());
      currentChunk = line;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n${line}` : line;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export const discordService = {
  async sendTaskCompleted(cardTitle: string, itemText: string, completedBy: string) {
    const by = completedBy === 'most' ? 'Most' : 'Fern';
    const embed = {
      description: `✅ **DONE:** ${by.toUpperCase()} - ${itemText} / ${cardTitle || 'UNTITLED'}`,
      color: 5763719 // Discord Green
    };
    await this.sendMessage({ embeds: [embed] });
  },

  getWebhookUrl(): string | undefined {
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        const url = import.meta.env.VITE_DISCORD_WEBHOOK_URL || import.meta.env.DISCORD_WEBHOOK_URL;
        if (url) return url;
      }
    } catch {
      // Ignore in Node.js
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env.VITE_DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
    }
    return undefined;
  },

  /**
   * Base function to send message to Discord Webhook
   * Automatically splits long text content if exceeding limit
   */
  async sendMessage(payload: Omit<DiscordWebhookPayload, 'username' | 'avatar_url'>) {
    const webhookUrl = this.getWebhookUrl();
    if (!webhookUrl) {
      console.warn('Discord Webhook URL is not configured.');
      return;
    }

    // If content is provided and too long, send chunks sequentially
    if (payload.content && payload.content.length > 1850) {
      const chunks = splitDiscordMessage(payload.content, 1850);
      for (const chunk of chunks) {
        await this.postDirect(webhookUrl, {
          content: chunk,
          username: BOT_USERNAME,
          // avatar_url: BOT_AVATAR,
        });
      }
      return;
    }

    const fullPayload: DiscordWebhookPayload = {
      ...payload,
      username: BOT_USERNAME,
      // avatar_url: BOT_AVATAR,
    };

    await this.postDirect(webhookUrl, fullPayload);
  },

  async postDirect(webhookUrl: string, payload: DiscordWebhookPayload) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Discord Webhook failed: ${response.statusText} (${response.status})`);
      }
    } catch (error) {
      console.error('Failed to send Discord message:', error);
      throw error;
    }
  },

  /**
   * 1. 30-Minute Interval Batch Completions
   * Summarizes all tasks completed in the last 30 minutes by Most & Fern
   */
  async sendBatchedCompletions(logs: CompletedTaskLog[]) {
    if (!logs || logs.length === 0) {
      console.log('No completed tasks in this interval. Skipping Discord batch notification.');
      return;
    }

    const now = new Date();
    const dateStr = formatThaiDate(now); // format: 12/09/69

    const mostLogs = logs.filter((l) => l.completedBy === 'most');
    const fernLogs = logs.filter((l) => l.completedBy === 'fern');

    const lines: string[] = [
      `BATCH UPDATE`,
      `DATE: ${dateStr}`,
      `TOTAL DONE: ${logs.length}`,
      '',
    ];

    if (mostLogs.length > 0) {
      lines.push(`MOST COMPLETED:`);
      mostLogs.forEach((l) => {
        lines.push(`- ${l.itemText} / ${l.cardTitle}`);
      });
      lines.push('');
    }

    if (fernLogs.length > 0) {
      lines.push(`FERN COMPLETED:`);
      fernLogs.forEach((l) => {
        lines.push(`- ${l.itemText} / ${l.cardTitle}`);
      });
      lines.push('');
    }

    const message = lines.join('\n').trim();
    await this.sendMessage({ content: message });
  },

  /**
   * 22:00 Check-in Reminder
   */
  async sendCheckinReminder() {
    const todayThai = formatThaiDate(new Date());

    const content = [
      `SYSTEM CHECK: 22:00`,
      `DATE: ${todayThai}`,
      '',
      `LOG YOUR PENDING TASKS.`
    ].join('\n');

    await this.sendMessage({ content });
  },

  /**
   * 22:30 Check-in Reminder (Cute version)
   */
  async sendNightlyReminder() {
    const todayThai = formatThaiDate(new Date());

    const content = [
      `SYSTEM CHECK: 22:30`,
      `DATE: ${todayThai}`,
      '',
      `FINAL REVIEW BEFORE TOMORROW.`
    ].join('\n');

    await this.sendMessage({ content });
  },

  /**
   * 3. Daily Summary Report
   * Matches format requested:
   * Dual Todo Summary · 12 Sep 2026
   * Total items: 12
   * Completed: 8
   * Pending: 4
   * Completion rate: 67%
   *
   * Most completed: 5
   * Fern completed: 3
   * รายการค้าง จัดกลุ่มตามการ์ด
   * (Split into multiple messages if too long)
   */
  async sendDailySummaryFormatted(params: {
    date?: Date;
    totalItems: number;
    completedCount: number;
    pendingCount: number;
    mostCompletedCount: number;
    fernCompletedCount: number;
    pendingByCard: Array<{ cardTitle: string; items: Array<{ text: string; assignee: string }> }>;
  }) {
    const date = params.date || new Date();
    const summaryDateStr = formatSummaryDate(date); // e.g. "12 Sep 2026"


    const completionRate =
      params.totalItems > 0 ? Math.round((params.completedCount / params.totalItems) * 100) : 0;

    const headerLines: string[] = [
      `DAILY SUMMARY: ${summaryDateStr}`,
      `TOTAL: ${params.totalItems}`,
      `COMPLETED: ${params.completedCount}`,
      `PENDING: ${params.pendingCount}`,
      `RATE: ${completionRate}%`,
      '',
      `MOST DONE: ${params.mostCompletedCount}`,
      `FERN DONE: ${params.fernCompletedCount}`,
      '',
    ];

    if (params.pendingByCard.length === 0) {
      headerLines.push('STATUS: NO PENDING TASKS');
      await this.sendMessage({ content: headerLines.join('\n') });
      return;
    }

    headerLines.push('PENDING TASKS:');

    const pendingLines: string[] = [];
    params.pendingByCard.forEach((card) => {
      pendingLines.push(`${card.cardTitle.toUpperCase()}`);
      card.items.forEach((item) => {
        const assigneeTag = item.assignee === 'both' ? 'Both' : item.assignee === 'most' ? 'Most' : 'Fern';
        pendingLines.push(`- ${item.text} | ${assigneeTag.toUpperCase()}`);
      });
    });

    const fullText = `${headerLines.join('\n')}\n${pendingLines.join('\n')}`;

    await this.sendMessage({ content: fullText });
  },
};

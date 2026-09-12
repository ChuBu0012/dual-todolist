import batchHandler from './batch-completions';
import summaryHandler from './daily-summary';

export default async function handler(req: any, res: any) {
  const url = req?.url ? new URL(req.url, 'http://localhost') : null;
  const type = url?.searchParams?.get('type') || req?.query?.type;

  if (type === 'batch') {
    return batchHandler(req, res);
  }

  if (type === 'summary') {
    return summaryHandler(req, res);
  }

  const info = {
    message: 'Dual Todo Cron API endpoint',
    availableEndpoints: [
      { path: '/api/cron/batch-completions', description: '30-minute interval batch task completions' },
      { path: '/api/cron/daily-summary', description: '22:00 Daily summary report & check-in' },
      { path: '/api/cron?type=batch', description: 'Trigger batch cron manually' },
      { path: '/api/cron?type=summary', description: 'Trigger summary cron manually' },
    ],
  };

  if (res && typeof res.status === 'function') {
    return res.status(200).json(info);
  }
  return new Response(JSON.stringify(info, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}


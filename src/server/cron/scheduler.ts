type Task = () => Promise<void> | void;

function parseTime(hhmm: string): { hours: number; minutes: number } {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  return { hours: h, minutes: m || 0 };
}

export function scheduleDaily(hhmm: string, task: Task) {
  const { hours, minutes } = parseTime(hhmm);
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next.getTime() - now.getTime();

  const run = async () => {
    try { await task(); } catch (err) { console.error('Cron task error', err); }
    // schedule next 24h
    setTimeout(run, 24 * 60 * 60 * 1000);
  };

  setTimeout(run, delay);
}




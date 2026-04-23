export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function formatRelativeTime(iso: string): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return 'Just now';

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}

export function formatDateTime(iso: string): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return 'Unknown';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
}

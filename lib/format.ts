export const jpy = (value: number | null | undefined) => {
  if (value == null) return '¥0';
  return '¥' + Math.round(value).toLocaleString('ja-JP');
};

export const pct = (value: number | null | undefined, digits = 0) => {
  if (value == null) return '0%';
  return `${(value * 100).toFixed(digits)}%`;
};

export const daysSince = (iso: string | null | undefined) => {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / 86400000);
};

export const shortDate = (iso: string | Date | null | undefined) => {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

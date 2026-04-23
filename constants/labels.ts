/**
 * ロール・ランク等の表示ラベル（画面表記を日本語に統一）
 * DB上の値は英語（platinum/gold/silver/bronze, admin/ranger/maker）のまま。
 */

export const RANK_LABEL: Record<string, string> = {
  platinum: 'プラチナ',
  gold: 'ゴールド',
  silver: 'シルバー',
  bronze: 'ブロンズ',
};

export const ROLE_LABEL: Record<string, string> = {
  admin: '管理者',
  ranger: 'レンジャー',
  maker: 'メーカー',
};

export function rankLabel(v: string | null | undefined): string {
  if (!v) return '-';
  return RANK_LABEL[v] ?? v;
}

export function roleLabel(v: string | null | undefined): string {
  if (!v) return '-';
  return ROLE_LABEL[v] ?? v;
}

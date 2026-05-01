/**
 * 営業フェーズの定義（与信→商談→サンプル→見積→発注→継続/失注）
 *
 * 「新規 = レンジャーが獲得した顧客」のみ対象。
 * customers.acquired_by_ranger_id IS NULL の既存顧客は管理対象外。
 */

export type SalesPhase =
  | 'credit_check'
  | 'ec_assigned'
  | 'negotiation'
  | 'sample'
  | 'quote'
  | 'order'
  | 'done'
  | 'lost';

type BadgeTone = 'neutral' | 'navy' | 'emerald' | 'amber' | 'red' | 'blue' | 'violet';

type PhaseSpec = {
  key: SalesPhase;
  label: string;
  tone: BadgeTone;
  /** 与信→...→発注 の本筋順（ec_assigned/done/lost は外れる） */
  flowOrder: number | null;
};

export const SALES_PHASES: readonly PhaseSpec[] = [
  { key: 'credit_check', label: '与信',     tone: 'amber',   flowOrder: 1 },
  { key: 'ec_assigned',  label: 'EC誘導',   tone: 'neutral', flowOrder: null },
  { key: 'negotiation',  label: '商談',     tone: 'violet',  flowOrder: 2 },
  { key: 'sample',       label: 'サンプル', tone: 'blue',    flowOrder: 3 },
  { key: 'quote',        label: '見積',     tone: 'navy',    flowOrder: 4 },
  { key: 'order',        label: '発注',     tone: 'emerald', flowOrder: 5 },
  { key: 'done',         label: '継続',     tone: 'emerald', flowOrder: null },
  { key: 'lost',         label: '失注',     tone: 'red',     flowOrder: null },
] as const;

const PHASE_MAP = new Map(SALES_PHASES.map((p) => [p.key, p]));

export function getPhaseSpec(phase: SalesPhase | null | undefined): PhaseSpec | null {
  if (!phase) return null;
  return PHASE_MAP.get(phase) ?? null;
}

export function getPhaseLabel(phase: SalesPhase | null | undefined): string {
  return getPhaseSpec(phase)?.label ?? '未分類';
}

export function getPhaseTone(phase: SalesPhase | null | undefined): BadgeTone {
  return getPhaseSpec(phase)?.tone ?? 'neutral';
}

/** 本筋フロー順の次のフェーズ（クイック進行ボタン用）。本筋外なら null */
export function getNextPhase(phase: SalesPhase | null | undefined): SalesPhase | null {
  const spec = getPhaseSpec(phase);
  if (!spec || spec.flowOrder == null) return null;
  const next = SALES_PHASES.find((p) => p.flowOrder === spec.flowOrder! + 1);
  return next?.key ?? null;
}

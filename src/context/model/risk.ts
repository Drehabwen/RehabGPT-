export const RISK_LEVEL_MAP: Record<string, 'none' | 'low' | 'medium' | 'high'> = {
  low: 'low',
  mild: 'low',
  medium: 'medium',
  moderate: 'medium',
  high: 'high',
  none: 'none',
};

export function mapRiskLevel(value: string | null | undefined): 'none' | 'low' | 'medium' | 'high' {
  if (!value) return 'none';
  return RISK_LEVEL_MAP[value] || 'none';
}

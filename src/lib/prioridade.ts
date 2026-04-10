import type { ProductPriority } from './types';

export function evaluatePurchasePriority(
  estoqueAtual: number,
  estoqueMinimo: number,
  estoqueRegular: number
): ProductPriority {
  const target = Math.max(estoqueRegular, estoqueMinimo);

  if (target <= 0) {
    return {
      label: 'Baixa',
      tone: 'low',
      score: 0,
      gap: 0,
      coverage: null,
      reason: 'Sem estoque mínimo e regular configurados para este produto.'
    };
  }

  const gapToMin = estoqueMinimo - estoqueAtual;
  const gapToRegular = target - estoqueAtual;
  const coverage = estoqueAtual / target;

  if (estoqueAtual <= estoqueMinimo) {
    return {
      label: 'Crítica',
      tone: 'critical',
      score: 140 + Math.max(gapToMin, 0) * 3,
      gap: gapToMin,
      coverage,
      reason: 'No limite mínimo ou abaixo. Reposição imediata recomendada.'
    };
  }

  if (estoqueAtual < target) {
    return {
      label: 'Alta',
      tone: 'high',
      score: 95 + Math.max(gapToRegular, 0) * 2,
      gap: gapToRegular,
      coverage,
      reason: 'Abaixo do estoque regular. Compra recomendada para reposição.'
    };
  }

  if (coverage < 1.3) {
    return {
      label: 'Moderada',
      tone: 'medium',
      score: 60 + (1.3 - coverage) * 25,
      gap: gapToRegular,
      coverage,
      reason: 'Acima do regular, mas com folga curta de estoque.'
    };
  }

  return {
    label: 'Baixa',
    tone: 'low',
    score: Math.max(0, 20 - coverage * 4),
    gap: gapToRegular,
    coverage,
    reason: 'Estoque confortável acima do nível regular.'
  };
}

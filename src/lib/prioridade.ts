import type { ProductPriority } from './types';

export function evaluatePurchasePriority(
  estoqueAtual: number,
  estoqueMinimo: number
): ProductPriority {
  if (estoqueMinimo <= 0) {
    return {
      label: 'Baixa',
      tone: 'low',
      score: 0,
      gap: 0,
      coverage: null,
      reason: 'Sem estoque mínimo configurado para este produto.'
    };
  }

  const gap = estoqueMinimo - estoqueAtual;
  const coverage = estoqueAtual / estoqueMinimo;

  if (estoqueAtual <= 0) {
    return {
      label: 'Crítica',
      tone: 'critical',
      score: 140 + Math.max(gap, 0) * 3,
      gap,
      coverage: 0,
      reason: 'Sem saldo disponível. Reposição imediata recomendada.'
    };
  }

  if (coverage < 0.5) {
    return {
      label: 'Alta',
      tone: 'high',
      score: 95 + Math.max(gap, 0) * 2,
      gap,
      coverage,
      reason: 'Cobertura abaixo de 50% do estoque mínimo.'
    };
  }

  if (coverage < 1) {
    return {
      label: 'Moderada',
      tone: 'medium',
      score: 60 + Math.max(gap, 0),
      gap,
      coverage,
      reason: 'Abaixo do estoque mínimo, mas ainda com saldo operacional.'
    };
  }

  return {
    label: 'Baixa',
    tone: 'low',
    score: Math.max(0, 20 - coverage * 4),
    gap,
    coverage,
    reason: 'Estoque acima do mínimo configurado.'
  };
}

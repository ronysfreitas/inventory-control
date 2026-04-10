import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2
});

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'Sem registro';
  }

  return format(parseISO(value), 'dd/MM/yyyy', {
    locale: ptBR
  });
}

export function formatDateLong(value: string | null | undefined) {
  if (!value) {
    return 'Sem registro';
  }

  return format(parseISO(value), "dd 'de' MMM yyyy", {
    locale: ptBR
  });
}

export function formatQuantity(value: number) {
  return numberFormatter.format(value);
}

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatCoverage(value: number | null) {
  if (value === null) {
    return 'N/A';
  }

  return `${numberFormatter.format(value * 100)}%`;
}

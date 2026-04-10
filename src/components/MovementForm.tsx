import { useState } from 'preact/hooks';

interface SupplierOption {
  id: number;
  nome: string;
}

interface MovementFormProps {
  type: 'entrada' | 'saida';
  productCode: string;
  suppliers?: SupplierOption[];
  disabled?: boolean;
  today: string;
}

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

export default function MovementForm({
  type,
  productCode,
  suppliers = [],
  disabled = false,
  today
}: MovementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const requiresSupplier = type === 'entrada';
  const isDisabled = disabled || (requiresSupplier && suppliers.length === 0);

  async function handleSubmit(event: Event) {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;

    if (isDisabled) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.codigoProduto = productCode;

      const response = await fetch(type === 'entrada' ? '/api/entradas' : '/api/saidas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? 'Não foi possível registrar a movimentação.');
      }

      form.reset();
      setFeedback({
        type: 'success',
        message:
          type === 'entrada'
            ? 'Entrada registrada. Atualizando o saldo...'
            : 'Saída registrada. Atualizando o saldo...'
      });

      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível registrar a movimentação.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form class="card async-form async-form--movement" onSubmit={handleSubmit}>
      <header class="card__header">
        <div>
          <h3>{type === 'entrada' ? 'Registrar entrada' : 'Registrar saída'}</h3>
          <p>
            {type === 'entrada'
              ? 'Toda entrada incrementa automaticamente o estoque do produto.'
              : 'Toda saída reduz o estoque e respeita o saldo disponível.'}
          </p>
        </div>
      </header>

      {requiresSupplier && suppliers.length === 0 ? (
        <div class="inline-note">
          Cadastre pelo menos um fornecedor antes de lançar entradas para este item.
        </div>
      ) : null}

      <div class="form-grid">
        <label class="field">
          <span class="field__label">Data</span>
          <input name="data" type="date" defaultValue={today} disabled={isDisabled} required />
        </label>

        {requiresSupplier ? (
          <label class="field">
            <span class="field__label">Fornecedor</span>
            <select
              name="fornecedorId"
              defaultValue={suppliers[0]?.id ?? ''}
              disabled={isDisabled}
              required
            >
              {suppliers.map((supplier) => (
                <option value={supplier.id}>{supplier.nome}</option>
              ))}
            </select>
          </label>
        ) : null}

        <label class="field">
          <span class="field__label">Quantidade</span>
          <input
            name="quantidade"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue="1"
            disabled={isDisabled}
            required
          />
        </label>

        {requiresSupplier ? (
          <label class="field">
            <span class="field__label">Valor unitário</span>
            <input
              name="valorUnitario"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              disabled={isDisabled}
              required
            />
          </label>
        ) : null}

        <label class={`field ${requiresSupplier ? 'field--span-2' : ''}`}>
          <span class="field__label">Observação</span>
          <textarea
            name="observacao"
            rows={3}
            placeholder={
              type === 'entrada'
                ? 'Nota fiscal, lote, observações...'
                : 'Motivo da saída, destino, observações...'
            }
            disabled={isDisabled}
          />
        </label>
      </div>

      {feedback ? (
        <p class={`form-feedback form-feedback--${feedback.type}`}>{feedback.message}</p>
      ) : null}

      <div class="form-actions">
        <button type="submit" class="button button--primary" disabled={isDisabled || isSubmitting}>
          {isSubmitting ? 'Salvando...' : type === 'entrada' ? 'Salvar entrada' : 'Salvar saída'}
        </button>
      </div>
    </form>
  );
}

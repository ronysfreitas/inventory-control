import { useState } from 'preact/hooks';

interface CreateProductFormProps {
  disabled?: boolean;
}

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

export default function CreateProductForm({
  disabled = false
}: CreateProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  async function handleSubmit(event: Event) {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;

    if (disabled) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await fetch('/api/produtos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? 'Não foi possível cadastrar o produto.');
      }

      form.reset();
      setFeedback({
        type: 'success',
        message: 'Produto cadastrado com sucesso. Atualizando a lista...'
      });

      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível cadastrar o produto.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form class="card async-form" onSubmit={handleSubmit}>
      <header class="card__header">
        <div>
          <h2>Novo produto</h2>
          <p>Cadastre itens com estoque mínimo e saldo inicial.</p>
        </div>
      </header>

      <div class="form-grid">
        <label class="field">
          <span class="field__label">Código do produto</span>
          <input name="codigo" type="text" placeholder="CIMENTO-001" disabled={disabled} required />
        </label>

        <label class="field field--span-2">
          <span class="field__label">Nome</span>
          <input name="nome" type="text" placeholder="Cimento CP-II 50kg" disabled={disabled} required />
        </label>

        <label class="field">
          <span class="field__label">Unidade de compra</span>
          <input name="unidadeCompra" type="text" placeholder="saco, caixa, rolo..." disabled={disabled} required />
        </label>

        <label class="field">
          <span class="field__label">Estoque mínimo</span>
          <input name="estoqueMinimo" type="number" min="0" step="0.01" defaultValue="0" disabled={disabled} required />
        </label>

        <label class="field">
          <span class="field__label">Estoque inicial</span>
          <input name="estoqueInicial" type="number" min="0" step="0.01" defaultValue="0" disabled={disabled} required />
        </label>
      </div>

      {feedback ? (
        <p class={`form-feedback form-feedback--${feedback.type}`}>{feedback.message}</p>
      ) : null}

      <div class="form-actions">
        <button type="submit" class="button button--primary" disabled={disabled || isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar produto'}
        </button>
      </div>
    </form>
  );
}

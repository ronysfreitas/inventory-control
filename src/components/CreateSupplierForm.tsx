import { useState } from 'preact/hooks';

interface CreateSupplierFormProps {
  disabled?: boolean;
}

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

export default function CreateSupplierForm({
  disabled = false
}: CreateSupplierFormProps) {
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
      const response = await fetch('/api/fornecedores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? 'Não foi possível cadastrar o fornecedor.');
      }

      form.reset();
      setFeedback({
        type: 'success',
        message: 'Fornecedor cadastrado com sucesso. Atualizando a lista...'
      });

      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível cadastrar o fornecedor.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form class="card async-form" onSubmit={handleSubmit}>
      <header class="card__header">
        <div>
          <h2>Novo fornecedor</h2>
          <p>Centralize os contatos usados nas entradas do estoque.</p>
        </div>
      </header>

      <div class="form-grid">
        <label class="field field--span-2">
          <span class="field__label">Nome</span>
          <input name="nome" type="text" placeholder="Distribuidora Horizonte" disabled={disabled} required />
        </label>

        <label class="field">
          <span class="field__label">Contato 1</span>
          <input name="contato1" type="text" placeholder="(31) 99999-0000" disabled={disabled} required />
        </label>

        <label class="field">
          <span class="field__label">Contato 2</span>
          <input name="contato2" type="text" placeholder="Opcional" disabled={disabled} />
        </label>

        <label class="field field--span-2">
          <span class="field__label">E-mail</span>
          <input name="email" type="email" placeholder="compras@fornecedor.com" disabled={disabled} />
        </label>
      </div>

      {feedback ? (
        <p class={`form-feedback form-feedback--${feedback.type}`}>{feedback.message}</p>
      ) : null}

      <div class="form-actions">
        <button type="submit" class="button button--primary" disabled={disabled || isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar fornecedor'}
        </button>
      </div>
    </form>
  );
}

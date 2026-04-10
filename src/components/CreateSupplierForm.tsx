import { useState } from 'preact/hooks';

interface CreateSupplierFormProps {
  disabled?: boolean;
}

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (!digits) {
    return '';
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function normalizeEmail(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
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
        throw new Error(result.message ?? 'Nao foi possivel cadastrar o fornecedor.');
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
            : 'Nao foi possivel cadastrar o fornecedor.'
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
          <p>Cadastre parceiros e mantenha os dados de contato organizados.</p>
        </div>
      </header>

      <div class="form-grid">
        <label class="field field--span-2">
          <span class="field__label">Nome</span>
          <input name="nome" type="text" disabled={disabled} required />
        </label>

        <label class="field">
          <span class="field__label">Contato 1</span>
          <input
            name="contato1"
            type="text"
            inputMode="tel"
            placeholder="(31) 99999-0000"
            disabled={disabled}
            onInput={(event) => {
              const input = event.currentTarget as HTMLInputElement;
              input.value = formatPhone(input.value);
            }}
          />
        </label>

        <label class="field">
          <span class="field__label">Contato 2</span>
          <input
            name="contato2"
            type="text"
            inputMode="tel"
            placeholder="(31) 99999-0000"
            disabled={disabled}
            onInput={(event) => {
              const input = event.currentTarget as HTMLInputElement;
              input.value = formatPhone(input.value);
            }}
          />
        </label>

        <label class="field field--span-2">
          <span class="field__label">E-mail</span>
          <input
            name="email"
            type="email"
            inputMode="email"
            placeholder="compras@fornecedor.com"
            disabled={disabled}
            onInput={(event) => {
              const input = event.currentTarget as HTMLInputElement;
              input.value = normalizeEmail(input.value);
            }}
          />
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

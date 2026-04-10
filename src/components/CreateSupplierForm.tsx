import { useState } from 'preact/hooks';

type SupplierFormMode = 'create' | 'edit';

interface SupplierFormValues {
  id?: number;
  nome?: string;
  contato1?: string | null;
  contato2?: string | null;
  email?: string | null;
}

interface CreateSupplierFormProps {
  disabled?: boolean;
  mode?: SupplierFormMode;
  endpoint?: string;
  successRedirect?: string;
  initialValues?: SupplierFormValues;
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelHref?: string;
  cancelLabel?: string;
  note?: string;
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
  disabled = false,
  mode = 'create',
  endpoint,
  successRedirect,
  initialValues,
  title,
  description,
  submitLabel,
  cancelHref,
  cancelLabel,
  note
}: CreateSupplierFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const isEditMode = mode === 'edit';
  const requestMethod = isEditMode ? 'PUT' : 'POST';
  const requestUrl =
    endpoint ??
    (isEditMode && initialValues?.id
      ? `/api/fornecedores?id=${initialValues.id}`
      : '/api/fornecedores');

  const heading = title ?? (isEditMode ? 'Editar fornecedor' : 'Novo fornecedor');
  const bodyCopy =
    description ??
    (isEditMode
      ? 'Atualize os dados do parceiro sem afetar o historico de entradas.'
      : 'Cadastre parceiros e mantenha os dados de contato organizados.');
  const actionLabel =
    submitLabel ??
    (isEditMode
      ? isSubmitting
        ? 'Salvando...'
        : 'Salvar alteracoes'
      : isSubmitting
        ? 'Salvando...'
        : 'Salvar fornecedor');

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
      const response = await fetch(requestUrl, {
        method: requestMethod,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? 'Nao foi possivel salvar o fornecedor.');
      }

      setFeedback({
        type: 'success',
        message: isEditMode
          ? 'Fornecedor atualizado com sucesso. Redirecionando...'
          : 'Fornecedor cadastrado com sucesso. Atualizando a lista...'
      });

      if (!isEditMode) {
        form.reset();
      }

      window.setTimeout(() => {
        if (successRedirect) {
          window.location.href = successRedirect;
          return;
        }

        window.location.reload();
      }, 700);
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel salvar o fornecedor.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form class="card async-form" onSubmit={handleSubmit}>
      <header class="card__header">
        <div>
          <h2>{heading}</h2>
          <p>{bodyCopy}</p>
        </div>

        {cancelHref ? (
          <a href={cancelHref} class="button button--secondary">
            {cancelLabel ?? 'Cancelar'}
          </a>
        ) : null}
      </header>

      {note ? <p class="inline-note">{note}</p> : null}

      <div class="form-grid">
        <label class="field field--span-2">
          <span class="field__label">Nome</span>
          <input
            name="nome"
            type="text"
            defaultValue={initialValues?.nome ?? ''}
            disabled={disabled}
            required
          />
        </label>

        <label class="field">
          <span class="field__label">Contato 1</span>
          <input
            name="contato1"
            type="text"
            inputMode="tel"
            placeholder="(31) 99999-0000"
            defaultValue={initialValues?.contato1 ?? ''}
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
            defaultValue={initialValues?.contato2 ?? ''}
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
            defaultValue={initialValues?.email ?? ''}
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
          {actionLabel}
        </button>
      </div>
    </form>
  );
}

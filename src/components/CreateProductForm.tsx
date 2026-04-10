import { useState } from 'preact/hooks';

type ProductFormMode = 'create' | 'edit';

interface ProductFormValues {
  id?: number;
  codigo?: string;
  nome?: string;
  unidadeCompra?: string;
  estoqueMinimo?: number;
  estoqueRegular?: number;
  estoqueInicial?: number;
}

interface CreateProductFormProps {
  disabled?: boolean;
  mode?: ProductFormMode;
  endpoint?: string;
  successRedirect?: string;
  initialValues?: ProductFormValues;
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

export default function CreateProductForm({
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
}: CreateProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const isEditMode = mode === 'edit';
  const requestMethod = isEditMode ? 'PUT' : 'POST';
  const requestUrl =
    endpoint ??
    (isEditMode && initialValues?.id
      ? `/api/produtos?id=${initialValues.id}`
      : '/api/produtos');

  const heading = title ?? (isEditMode ? 'Editar produto' : 'Novo produto');
  const bodyCopy =
    description ??
    (isEditMode
      ? 'Atualize os dados cadastrais sem alterar o saldo atual do item.'
      : 'Cadastre itens com estoque mínimo e saldo inicial.');
  const actionLabel =
    submitLabel ??
    (isEditMode
      ? isSubmitting
        ? 'Salvando...'
        : 'Salvar alterações'
      : isSubmitting
        ? 'Salvando...'
        : 'Salvar produto');

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
        throw new Error(result.message ?? 'Não foi possível salvar o produto.');
      }

      setFeedback({
        type: 'success',
        message: isEditMode
          ? 'Produto atualizado com sucesso. Redirecionando...'
          : 'Produto cadastrado com sucesso. Atualizando a lista...'
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
            : 'Não foi possível salvar o produto.'
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
          <span class="field__label">Código do produto</span>
          <input
            name="codigo"
            type="text"
            placeholder="COD123456"
            defaultValue={initialValues?.codigo ?? ''}
            disabled={disabled}
            required
          />
        </label>

        <label class="field field--span-2">
          <span class="field__label">Nome</span>
          <input
            name="nome"
            type="text"
            placeholder="XYZ <especificação>"
            defaultValue={initialValues?.nome ?? ''}
            disabled={disabled}
            required
          />
        </label>

        <label class="field">
          <span class="field__label">Unidade de compra</span>
          <input
            name="unidadeCompra"
            type="text"
            placeholder="Unidade, litro, saco, caixa, rolo..."
            defaultValue={initialValues?.unidadeCompra ?? ''}
            disabled={disabled}
            required
          />
        </label>

        <label class="field">
          <span class="field__label">Estoque mínimo</span>
          <input
            name="estoqueMinimo"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initialValues?.estoqueMinimo ?? 0}
            disabled={disabled}
            required
          />
        </label>

        <label class="field">
          <span class="field__label">Estoque regular</span>
          <input
            name="estoqueRegular"
            type="number"
            min="0"
            step="0.01"
            defaultValue={initialValues?.estoqueRegular ?? 0}
            disabled={disabled}
            required
          />
        </label>

        {!isEditMode ? (
          <label class="field">
            <span class="field__label">Estoque inicial</span>
            <input
              name="estoqueInicial"
              type="number"
              min="0"
              step="0.01"
              defaultValue={initialValues?.estoqueInicial ?? 0}
              disabled={disabled}
              required
            />
          </label>
        ) : null}
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

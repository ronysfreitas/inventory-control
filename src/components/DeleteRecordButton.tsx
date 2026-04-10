import { useState } from 'preact/hooks';

interface DeleteRecordButtonProps {
  endpoint: string;
  resourceLabel: string;
  disabled?: boolean;
}

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

export default function DeleteRecordButton({
  endpoint,
  resourceLabel,
  disabled = false
}: DeleteRecordButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  async function handleDelete() {
    if (disabled || isSubmitting) {
      return;
    }

    const confirmed = window.confirm(
      `Deseja realmente excluir ${resourceLabel}? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(endpoint, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? `Não foi possível excluir ${resourceLabel}.`);
      }

      setFeedback({
        type: 'success',
        message: `${resourceLabel} excluído com sucesso. Atualizando a lista...`
      });

      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : `Não foi possível excluir ${resourceLabel}.`
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div class="table-actions">
      <button
        type="button"
        class="button button--secondary button--danger"
        disabled={disabled || isSubmitting}
        onClick={handleDelete}
      >
        {isSubmitting ? 'Excluindo...' : 'Excluir'}
      </button>

      {feedback ? (
        <span class={`table-actions__feedback table-actions__feedback--${feedback.type}`}>
          {feedback.message}
        </span>
      ) : null}
    </div>
  );
}

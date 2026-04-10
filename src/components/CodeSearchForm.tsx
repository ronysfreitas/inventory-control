import { useState } from 'preact/hooks';

interface CodeSearchFormProps {
  initialValue?: string;
  compact?: boolean;
}

export default function CodeSearchForm({
  initialValue = '',
  compact = false
}: CodeSearchFormProps) {
  const [code, setCode] = useState(initialValue);
  const [error, setError] = useState('');

  function handleSubmit(event: Event) {
    event.preventDefault();

    const trimmed = code.trim();

    if (!trimmed) {
      setError('Informe um código para pesquisar.');
      return;
    }

    window.location.assign(`/produto/${encodeURIComponent(trimmed.toUpperCase())}`);
  }

  return (
    <form class={`search-form ${compact ? 'search-form--compact' : ''}`} onSubmit={handleSubmit}>
      <label class="field">
        <span class="field__label">Pesquisar produto por código</span>
        <div class="search-form__controls">
          <input
            name="codigo"
            type="text"
            value={code}
            onInput={(event) => {
              setCode((event.target as HTMLInputElement).value);
              setError('');
            }}
            placeholder="Ex.: CIMENTO-001"
            autoComplete="off"
          />
          <button type="submit" class="button button--primary">
            Buscar
          </button>
        </div>
      </label>

      {error ? <p class="form-feedback form-feedback--error">{error}</p> : null}
    </form>
  );
}

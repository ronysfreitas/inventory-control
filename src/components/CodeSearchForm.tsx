import { useEffect, useRef, useState } from 'preact/hooks';

import type { ProductSuggestion } from '../lib/types';

interface CodeSearchFormProps {
  initialValue?: string;
  compact?: boolean;
}

function buildProductUrl(code: string) {
  return `/produto/${encodeURIComponent(code.trim().toUpperCase())}`;
}

export default function CodeSearchForm({
  initialValue = '',
  compact = false
}: CodeSearchFormProps) {
  const [code, setCode] = useState(initialValue);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const suggestionsIdRef = useRef(
    `product-code-suggestions-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    const trimmed = code.trim();

    setActiveIndex(-1);

    if (!trimmed) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/produtos-autocomplete?term=${encodeURIComponent(trimmed)}`,
          {
            signal: controller.signal
          }
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message ?? 'Não foi possível buscar sugestões.');
        }

        setSuggestions(Array.isArray(result.data) ? result.data : []);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [code]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  function goToProduct(targetCode: string) {
    window.location.assign(buildProductUrl(targetCode));
  }

  function handleSubmit(event: Event) {
    event.preventDefault();

    const trimmed = code.trim();

    if (!trimmed) {
      setError('Informe um código para pesquisar.');
      return;
    }

    if (activeIndex >= 0 && suggestions[activeIndex]) {
      goToProduct(suggestions[activeIndex].codigo);
      return;
    }

    goToProduct(trimmed);
  }

  function openSuggestions() {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    setIsFocused(true);
  }

  function closeSuggestionsSoon() {
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsFocused(false);
      setActiveIndex(-1);
    }, 120);
  }

  function selectSuggestion(suggestion: ProductSuggestion) {
    setCode(suggestion.codigo);
    setSuggestions([]);
    setIsFocused(false);
    setActiveIndex(-1);
    goToProduct(suggestion.codigo);
  }

  const shouldShowSuggestions =
    isFocused &&
    Boolean(code.trim()) &&
    (isLoading || suggestions.length > 0 || code.trim().length >= 2);

  return (
    <form class={`search-form ${compact ? 'search-form--compact' : ''}`} onSubmit={handleSubmit}>
      <label class="field">
        <span class="field__label">Pesquisar produto por código</span>
        <div class="search-form__controls">
          <div class="search-form__input-wrap">
            <input
              name="codigo"
              type="text"
              value={code}
              onFocus={openSuggestions}
              onBlur={closeSuggestionsSoon}
              onInput={(event) => {
                setCode((event.target as HTMLInputElement).value);
                setError('');
              }}
              onKeyDown={(event) => {
                if (!shouldShowSuggestions || suggestions.length === 0) {
                  if (event.key === 'Escape') {
                    setIsFocused(false);
                    setActiveIndex(-1);
                  }
                  return;
                }

                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setActiveIndex((current) =>
                    current < suggestions.length - 1 ? current + 1 : 0
                  );
                  return;
                }

                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActiveIndex((current) =>
                    current > 0 ? current - 1 : suggestions.length - 1
                  );
                  return;
                }

                if (event.key === 'Enter' && activeIndex >= 0) {
                  event.preventDefault();
                  selectSuggestion(suggestions[activeIndex]);
                  return;
                }

                if (event.key === 'Escape') {
                  setIsFocused(false);
                  setActiveIndex(-1);
                }
              }}
              placeholder="Ex.: COD123456"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls={suggestionsIdRef.current}
              aria-expanded={shouldShowSuggestions}
            />

            {shouldShowSuggestions ? (
              <div
                class="search-form__suggestions"
                id={suggestionsIdRef.current}
                role="listbox"
              >
                {isLoading ? (
                  <div class="search-form__suggestion search-form__suggestion--meta">
                    Buscando códigos...
                  </div>
                ) : suggestions.length ? (
                  suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      class={`search-form__suggestion ${
                        index === activeIndex ? 'search-form__suggestion--active' : ''
                      }`}
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      onClick={() => {
                        selectSuggestion(suggestion);
                      }}
                    >
                      <strong>{suggestion.codigo}</strong>
                      <small>{suggestion.nome}</small>
                    </button>
                  ))
                ) : (
                  <div class="search-form__suggestion search-form__suggestion--meta">
                    Nenhum produto encontrado para este código.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <button type="submit" class="button button--primary">
            Buscar
          </button>
        </div>
      </label>

      {error ? <p class="form-feedback form-feedback--error">{error}</p> : null}
    </form>
  );
}

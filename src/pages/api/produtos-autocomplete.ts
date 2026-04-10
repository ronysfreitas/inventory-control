import type { APIRoute } from 'astro';

import { jsonResponse, resolveErrorStatus } from '../../lib/server/api';
import {
  getFriendlyError,
  searchProductSuggestions
} from '../../lib/server/inventory-service';

export const GET: APIRoute = async ({ url }) => {
  try {
    const term = url.searchParams.get('term') ?? '';
    const suggestions = await searchProductSuggestions(term);

    return jsonResponse({
      ok: true,
      data: suggestions
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        message: getFriendlyError(error),
        data: []
      },
      resolveErrorStatus(error)
    );
  }
};

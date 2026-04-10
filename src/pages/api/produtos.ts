import type { APIRoute } from 'astro';

import { jsonResponse, readRequestPayload, resolveErrorStatus } from '../../lib/server/api';
import { createProduct, getFriendlyError } from '../../lib/server/inventory-service';

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await readRequestPayload(request);
    const product = await createProduct(payload);

    return jsonResponse(
      {
        ok: true,
        message: 'Produto cadastrado com sucesso.',
        data: product
      },
      201
    );
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        message: getFriendlyError(error)
      },
      resolveErrorStatus(error)
    );
  }
};

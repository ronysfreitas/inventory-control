import type { APIRoute } from 'astro';

import { jsonResponse, readRequestPayload, resolveErrorStatus } from '../../lib/server/api';
import { createSupplier, getFriendlyError } from '../../lib/server/inventory-service';

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await readRequestPayload(request);
    const supplier = await createSupplier(payload);

    return jsonResponse(
      {
        ok: true,
        message: 'Fornecedor cadastrado com sucesso.',
        data: supplier
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

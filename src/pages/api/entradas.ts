import type { APIRoute } from 'astro';

import { jsonResponse, readRequestPayload, resolveErrorStatus } from '../../lib/server/api';
import { createEntry, getFriendlyError } from '../../lib/server/inventory-service';

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await readRequestPayload(request);
    const entry = await createEntry(payload);

    return jsonResponse(
      {
        ok: true,
        message: 'Entrada registrada com sucesso.',
        data: entry
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

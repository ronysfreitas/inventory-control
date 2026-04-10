import type { APIRoute } from 'astro';

import { jsonResponse, readRequestPayload, resolveErrorStatus } from '../../lib/server/api';
import { createExit, getFriendlyError } from '../../lib/server/inventory-service';

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await readRequestPayload(request);
    const exit = await createExit(payload);

    return jsonResponse(
      {
        ok: true,
        message: 'Saída registrada com sucesso.',
        data: exit
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

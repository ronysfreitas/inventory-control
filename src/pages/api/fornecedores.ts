import type { APIRoute } from 'astro';

import { jsonResponse, readRequestPayload, resolveErrorStatus } from '../../lib/server/api';
import {
  createSupplier,
  deleteSupplier,
  getFriendlyError,
  updateSupplier
} from '../../lib/server/inventory-service';

function getRecordId(request: Request) {
  const id = Number(new URL(request.url).searchParams.get('id'));

  if (!Number.isInteger(id) || id <= 0) {
    throw Object.assign(new Error('Informe um identificador valido.'), {
      statusCode: 400
    });
  }

  return id;
}

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

export const PUT: APIRoute = async ({ request }) => {
  try {
    const payload = await readRequestPayload(request);
    const supplierId = getRecordId(request);
    const supplier = await updateSupplier(supplierId, payload);

    return jsonResponse({
      ok: true,
      message: 'Fornecedor atualizado com sucesso.',
      data: supplier
    });
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

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const supplierId = getRecordId(request);
    const supplier = await deleteSupplier(supplierId);

    return jsonResponse({
      ok: true,
      message: 'Fornecedor excluido com sucesso.',
      data: supplier
    });
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

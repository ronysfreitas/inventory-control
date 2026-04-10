import type { APIRoute } from 'astro';

import { jsonResponse, readRequestPayload, resolveErrorStatus } from '../../lib/server/api';
import {
  createProduct,
  deleteProduct,
  getFriendlyError,
  updateProduct
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

export const PUT: APIRoute = async ({ request }) => {
  try {
    const payload = await readRequestPayload(request);
    const productId = getRecordId(request);
    const product = await updateProduct(productId, payload);

    return jsonResponse({
      ok: true,
      message: 'Produto atualizado com sucesso.',
      data: product
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
    const productId = getRecordId(request);
    const product = await deleteProduct(productId);

    return jsonResponse({
      ok: true,
      message: 'Produto excluído com sucesso.',
      data: product
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


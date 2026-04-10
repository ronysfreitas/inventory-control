export async function readRequestPayload(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return request.json();
  }

  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}

export function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

export function resolveErrorStatus(error: unknown) {
  if (typeof error === 'object' && error && 'statusCode' in error) {
    const requestError = error as {
      statusCode?: number;
    };

    if (typeof requestError.statusCode === 'number') {
      return requestError.statusCode;
    }
  }

  if (typeof error === 'object' && error && 'issues' in error) {
    return 400;
  }

  if (typeof error === 'object' && error && 'code' in error) {
    const databaseError = error as {
      code?: string;
    };

    if (['23505', '23503', 'P0001'].includes(databaseError.code ?? '')) {
      return 400;
    }
  }

  return 500;
}

import { shouldServeSpaShell } from './_shared/spa-fallback.mjs';

export async function onRequest(context) {
  const response = await context.next();
  if (response.status !== 404) {
    return response;
  }

  const request = context.request;
  const url = new URL(request.url);
  const shouldFallback = shouldServeSpaShell({
    pathname: url.pathname,
    method: request.method,
    acceptHeader: request.headers.get('accept') || '',
    secFetchMode: request.headers.get('sec-fetch-mode') || ''
  });

  if (!shouldFallback) {
    return response;
  }

  const assetRequest = new Request(new URL('/404.html', url), request);
  const notFoundResponse = await context.env.ASSETS.fetch(assetRequest);

  if (!notFoundResponse.ok) {
    return response;
  }

  return new Response(notFoundResponse.body, {
    status: 404,
    statusText: 'Not Found',
    headers: notFoundResponse.headers
  });
}


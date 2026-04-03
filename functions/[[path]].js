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

  const assetRequest = new Request(new URL('/index.html', url), request);
  return context.env.ASSETS.fetch(assetRequest);
}


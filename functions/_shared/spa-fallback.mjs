export function hasFileExtension(pathname) {
  return /\/[^/]+\.[a-z0-9]{1,16}$/i.test(pathname || '');
}

export function shouldServeSpaShell(options) {
  const pathname = options && options.pathname ? options.pathname : '/';
  const method = options && options.method ? String(options.method).toUpperCase() : 'GET';
  const acceptHeader = options && options.acceptHeader ? String(options.acceptHeader) : '';
  const secFetchMode = options && options.secFetchMode ? String(options.secFetchMode) : '';

  if (method !== 'GET' && method !== 'HEAD') return false;
  if (pathname === '/404.html') return false;
  if (pathname.startsWith('/pages/')) return false;
  if (pathname.startsWith('/api/')) return false;
  if (hasFileExtension(pathname)) return false;

  return secFetchMode === 'navigate' || acceptHeader.includes('text/html');
}


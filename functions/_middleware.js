const CANONICAL_ORIGIN = 'https://nouploadvideo.com';

/**
 * Redirects the default *.pages.dev hostname to the canonical custom domain.
 * www → apex is handled by a Cloudflare Redirect Rule (zone-level, faster).
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === 'nouploadvideo.pages.dev') {
    const destination = `${CANONICAL_ORIGIN}${url.pathname}${url.search}`;
    return Response.redirect(destination, 301);
  }

  return context.next();
}

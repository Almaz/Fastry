import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  
  // Add X-Robots-Tag header for components pages
  const url = new URL(context.url);
  if (url.pathname === '/components/' || url.pathname === '/components' || 
      url.pathname === '/en/components/' || url.pathname === '/en/components' ||
      url.pathname.startsWith('/components/') || url.pathname.startsWith('/en/components/')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  }
  
  return response;
});

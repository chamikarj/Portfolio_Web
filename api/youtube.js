import { createYoutubeHandler } from '../lib/youtube.mjs';

export function createUploadsHandler(options = {}) {
  const getUploads = createYoutubeHandler(options);
  return async function uploads(request) {
    if (request.method !== 'GET') {
      return Response.json({ status: 'error', message: 'Use GET for this endpoint.' }, {
        status: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' },
      });
    }
    return getUploads();
  };
}

export default { fetch: createUploadsHandler() };

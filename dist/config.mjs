// Public endpoint only. Database credentials stay in the Cloudflare Worker.
export const PROGRESS_API = 'https://dayfam-challenges-api.calebday1820.workers.dev/progress';
const localPreview = typeof location !== 'undefined' && ['127.0.0.1', 'localhost'].includes(location.hostname) && location.port === '4173';
export const THOUGHTS_API = new URL('/thoughts', localPreview ? 'http://127.0.0.1:8787' : PROGRESS_API).href;

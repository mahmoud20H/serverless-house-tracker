const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

function buildHeaders(customHeaders = {}) {
  const headers = { ...customHeaders };
  const apiKey = import.meta.env.VITE_API_KEY;

  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  return headers;
}

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  return fetch(url, {
    ...options,
    headers: buildHeaders(options.headers),
  });
}

export { API_BASE_URL };

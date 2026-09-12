// API Client with Access Token in Memory & Refresh Handling

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    let res = await fetch(url, config);

    // Handle token expiration: attempt refresh once
    if (res.status === 401 && !options._retry) {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setAccessToken(refreshData.token);
        headers['Authorization'] = `Bearer ${refreshData.token}`;
        config._retry = true;
        res = await fetch(url, config);
      }
    }

    if (!res.ok) {
      let errData = {};
      try {
        errData = await res.json();
      } catch {
        // Response was not JSON
      }
      const error = new Error(errData.error?.message || `HTTP ${res.status}`);
      error.code = errData.error?.code;
      error.status = res.status;
      error.details = errData.error?.details;
      throw error;
    }

    if (res.status === 204) return null;
    return await res.json();
  } catch (err) {
    throw err;
  }
}

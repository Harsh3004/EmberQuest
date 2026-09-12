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
    credentials: 'include',
    ...options,
    headers,
  };

  try {
    let res = await fetch(url, config);

    // Handle token expiration: attempt refresh once
    if (res.status === 401 && !options._retry) {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData.accessToken || refreshData.token;
          if (newToken) {
            setAccessToken(newToken);
            headers['Authorization'] = `Bearer ${newToken}`;
            config._retry = true;
            res = await fetch(url, config);
          }
        }
      } catch {
        // Refresh failed, proceed to error handling
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
